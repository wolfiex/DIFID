var fail = 0;
var em;
var div = document.getElementById("div");
div.style.height = "1em";
em = div.offsetHeight;

var data;
var width = (height = Math.min(window.innerWidth, window.innerHeight) * 0.9);
var halfwidth = width / 2;
// main canvas - plotting
var mainCanvas, hiddenCanvas, context, hiddencontext, tool, title;
var voronoi = d3.voronoi().extent([[-1, -1], [width + 1, height + 1]]);
fuzzysort = fuzzysortNew();

var cmap = d3.scaleOrdinal(
    "f9c80e-f86624-ea3546-662e9b-36e0f7-3498db".split("-").map(d => "#" + d)
);

// load files
d3
    .queue()
    .defer(d3.csv, "../data/doc_information.csv") // documnet info [0]
    .defer(d3.csv, "../data/tsne_results.csv") // tsnelocations
    .defer(d3.csv, "../data/topic_info.csv") // tsnelocations
    .defer(d3.csv, "../data/label_tsne.csv") //labelloc
    .defer(d3.csv, "../data/locations.csv")
    .defer(d3.json, "continents.geojson")
    //.defer(d3.csv, '../preprocess/nodes.csv')// node data
    .await(load);

function load(err, ...dt) {
    console.log("Loading...", dt);
    var toFloat = "lon lat x y";
    data = {};

    var basecol = "continent"; //'wc__oecd'//continent

    data[basecol] = [...new Set(dt[0].map(d => d[basecol]))];
    data.colours = "f94144-f3722c-f8961e-f9c74f-90be6d-43aa8b-577590"
        .split("-")
        .map(d => "#" + d);

    data.info = new Map(
        dt[0].map(d => {
            d.c = data.colours[data[basecol].indexOf(d[basecol])];
            return [d.id, d];
        })
    );

    // rm nodes with no information
    data.tsne = dt[1].filter(d => data.info.has(d.doc_id)).map(d => {
        [1, 2].forEach(e => {
            var q = "tsne-" + e;
            d[q] = +d[q];
        });
        return d;
    });

    data.carto=true
    // limits for scale fn
    data.x = d3
        .scaleLinear()
        .domain(d3.extent(data.tsne.map(d => d["tsne-1"])))
        .range([0, width]);

    data.y = d3
        .scaleLinear()
        .domain(d3.extent(data.tsne.map(d => d["tsne-2"])))
        .range([height, 0]);

    data.tsne = data.tsne.map(d => {
        d.tloc = { x: data.x(d["tsne-1"]), y: data.y(d["tsne-2"]) };
        return d;
    });

    data.topics = dt[2];

    var hw = width / 2.0;
    data.labels = dt[3]
        .map(d => {
            (d.x = d.cx = data.x(d["tsne-1"])), (d.y = d.cy = data.y(
                d["tsne-2"]
            ));
            d.left = d.x < hw;
            return d;
        })
        .sort(function(x, y) {
            return d3.ascending(x.y, y.y);
        });

    data.locations = new Map(
        dt[4].map(d => [
            d.doc_id,
            new L.LatLng(parseFloat(d.lat), parseFloat(d.lon))
        ])
    );

    data.title = [...data.info.values()].map((d, i) => {
        return { title: d.title.toLowerCase(), id: d.id };
    });

    // set up canvas
    mainCanvas = d3
        .select("#container")
        .append("canvas")
        .classed("mainCanvas", true)
        .attr("width", width)
        .attr("height", height);

    // hidden canvas - tooltips
    hiddenCanvas = d3
        .select("#tooltip")
        .append("canvas")
        .classed("hiddenCanvas", true)
        .attr("width", width)
        .attr("height", height);

    context = mainCanvas.node().getContext("2d");
    hiddencontext = hiddenCanvas.node().getContext("2d");

    tool = d3.select("#tooltip");
    title = d3.select("#title");

    //
    // draw()
    draw_world(dt[5]);

    
    setMap()
    mousesetup(hiddencontext, mainCanvas, map)
    
    d3
        .select("canvas")
        .call(
            d3
                .zoom()
                .scaleExtent([1, 8])
                .translateExtent([[0, 0], [width, height]])
                .extent([[0, 0], [width, height]])
                .on("zoom", () => zoomed(d3.event.transform))
        );

    function zoomed(transform) {
        
        console.log(transform)
        
        d3.selectAll(".annotation-group").remove();
        context.save();
        context.clearRect(0, 0, width, height);
        context.translate(transform.x, transform.y);
        context.scale(transform.k, transform.k);
//map._resetView([51,0],8)
        hiddencontext.save();
        hiddencontext.clearRect(0, 0, width, height);

        hiddencontext.translate(transform.x, transform.y);
        hiddencontext.scale(transform.k, transform.k);

        data.zoom = (1 / transform.k) ** 0.5 || 1;
        draw();
        window.scroll(0, 0);
        context.restore();
        hiddencontext.restore();
    }

    zoomed(d3.zoomIdentity);

    //
    // label()
    
    console.log("data loaded");
}

function draw() {
    context.clearRect(0, 0, width, height);
    hiddencontext.clearRect(0, 0, width, height);
    // filter here

    var size = width / 400;
    var filtered = data.filtered || data.tsne;
    console.log("initial filtered datapoints", filtered.length);

    if (data.carto) {
        var ix = "loc";
         d3.select('.annotation-group').remove()
        filtered = filtered
            .map(d => {
                try {
                    //console.log('fdsfd',loc,d.doc_id,data.locations.get(d.doc_id),filtered)
                    d.loc = map.latLngToLayerPoint(
                        data.locations.get(d.doc_id)
                    );
                    // console.log(d.loc)
                    //[loc.x+Math.random()*0.001,loc.y]
                    return d;
                } catch (e) {
                    return false;
                }
            })
            .filter(d => d);

        mainCanvas.style("pointer-events", "none");

        d3.select("#world").style("visibility", "visible").style("pointer-events", "auto");
    } else {
        var ix = "tloc";
        d3.select("#world").style("visibility", "hidden");
        mainCanvas.style("pointer-events", "auto");
    }

    var points = filtered.map(d => [
        d[ix].x + Math.random() * 0.01,
        d[ix].y + Math.random() * 0.01
    ]);

    console.log("points remaining", points.length);

    /// MUST add random movement as voronoi fall over if occpying the same space.
    // Uncaught TypeError: Cannot read property '0' of null

    try {
        var diagram = voronoi(points);
        var polygons = diagram.polygons();

        context.beginPath();
        for (var i = 0, n = polygons.length; i < n; ++i)
            drawCell(context, polygons[i]);
        context.strokeStyle = "rgba(2,2,2,0.1)";
        context.stroke();
        fail = 0;
    } catch (e) {
        fail += 1;
        console.log("failed voronoi", fail);
        if (fail < 10) {
            return draw();
        } else {
            alert(
                "Failed to load interactivity layer, please try another browser or refresh. To continue without point interactivity, Click OK"
            );
        }
    }

    var keys = [];
    filtered.forEach(d => {
        context.globalAlpha = 0.5;
        context.beginPath();
        context.arc(d[ix].x, d[ix].y, size * data.zoom, 0, 2 * Math.PI);

        var item = data.info.get(d.doc_id)["continent"];
        keys.push(item);
        context.fillStyle = cmap(item) || "black";

        context.fill();
    });

    legend([...new Set(keys)], cmap);

    // set invisible nodes
    data.nodeclr = {};

    filtered.forEach((d, i) => {
        hiddencontext.beginPath();
        drawCell(hiddencontext, polygons[i]);
        // hiddencontext.arc(d.x, d.y, width/200, 0, 2*Math.PI);
        var c = genColor(i);
        data.nodeclr[c] = d.doc_id;
        hiddencontext.fillStyle = c;
        hiddencontext.fill();
    });


}





function drawCell(ctx, cell) {
    if (!cell) return false;
    ctx.moveTo(cell[0][0], cell[0][1]);
    for (var j = 1, m = cell.length; j < m; ++j) {
        ctx.lineTo(cell[j][0], cell[j][1]);
    }
    //ctx.closePath();
    return true;
}

// function for tooltip
function genColor(i) {
    var ret = [];
    if (i < 16777215) {
        ret.push(i & 0xff); //R
        ret.push((i & 0xff00) >> 8); //G
        ret.push((i & 0xff0000) >> 16); //B
    }
    return "rgb(" + ret.join(",") + ")";
}

function doi(x) {
    var url = `https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=${x.replace("/", "%2F")}&btnG=`;
    console.log(url);
    var win = window.open(url, "_blank");
    win.focus();
}
