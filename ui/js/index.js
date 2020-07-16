var data ;
var width = height = Math.min(window.innerWidth,window.innerHeight)*.9;
var halfwidth = width/2;
// main canvas - plotting
var mainCanvas,hiddenCanvas,context,hiddencontext,tool,title
var voronoi = d3.voronoi().extent([[-1, -1], [width + 1, height + 1]]);
fuzzysort = fuzzysortNew()

var cmap = d3.scaleOrdinal(
    "f9c80e-f86624-ea3546-662e9b-36e0f7-3498db".split("-").map(d => "#" + d)
);

// load files
d3.queue()
  .defer(d3.csv,'../data/doc_information.csv')// documnet info [0]
  .defer(d3.csv, '../data/tsne_results.csv')// tsnelocations
  .defer(d3.csv, '../data/topic_info.csv')// tsnelocations
  .defer(d3.json,"continents.geojson")
  //.defer(d3.csv, '../preprocess/nodes.csv')// node data
  .await(load)





function load(err,...dt){
    
    var toFloat = 'lon lat x y'
    data = {}
    
    var basecol = 'continent'//'wc__oecd'//continent
    
    data[basecol] = [...new Set(dt[0].map(d=>d[basecol]))];
    data.colours = 'f94144-f3722c-f8961e-f9c74f-90be6d-43aa8b-577590'.split('-').map(d=>'#'+d)

    
    data.info = new Map(dt[0].map(d=>{d.c = data.colours[data[basecol].indexOf(d[basecol])];return [d.id,d]}))
    
    // rm nodes with no information
    data.tsne = dt[1].filter(d=>data.info.has(d.doc_id)).map(d=>{
        [1,2].forEach(e=>{var q = 'tsne-'+e; d[q]=+d[q]});    
    return d})
    
    // limits for scale fn
    data.x =  d3.scaleLinear()
	    .domain(d3.extent(data.tsne.map(d=>d['tsne-1'])))
		.range([0,width]);

	data.y = d3.scaleLinear()
		.domain(d3.extent(data.tsne.map(d=>d['tsne-2'])))
		.range([height, 0]);

    data.tsne = data.tsne.map(d=>{d.x=data.x(d['tsne-1']),d.y=data.y(d['tsne-2']);return d})
    
    data.topics = dt[2]


    data.title =[...data.info.values()].map((d,i)=>{return {title:d.title.toLowerCase(),id:d.id}})
    
    
    
    // set up canvas
    mainCanvas = d3.select('#container')
    .append('canvas')
    .classed('mainCanvas', true)
    .attr('width', width)
    .attr('height', height);

    // hidden canvas - tooltips
    hiddenCanvas = d3.select('#tooltip')
    .append('canvas')
    .classed('hiddenCanvas', true)
    .attr('width', width)
    .attr('height', height);


    context = mainCanvas.node().getContext('2d');
    hiddencontext = hiddenCanvas.node().getContext('2d');

    
    tool = d3.select('#tooltip')
    title = d3.select('#title')
    
    
    draw()
    
    data.topology = dt[3]
    draw_world(dt[3])
    
    console.log('data loaded')
}
    
    
    
    
    
function draw(){

		context.clearRect(0, 0, width, height);
        hiddencontext.clearRect(0, 0, width, height);
        // filter here


        var size = width/400
        var filtered = data.filtered || data.tsne 
        
        
        var points = filtered.map(d=>[d.x,d.y])
        var diagram = voronoi(points)
        
        var links = diagram.links(),
            polygons = diagram.polygons();
                
        context.beginPath();
         for (var i = 0, n = polygons.length; i < n; ++i) drawCell(context,polygons[i]);
         context.strokeStyle = "rgba(2,2,2,0.1)";
         context.stroke();        
                        
                
        
        filtered.forEach(d=>{
            context.globalAlpha = .5
            context.beginPath();
            context.arc(d.x, d.y, size, 0, 2*Math.PI);
            context.fillStyle = cmap(data.info.get(d.doc_id).continent) || 'black';
            context.fill();
        })
    
        
        
        // set invisible nodes 
        data.nodeclr = {};
        
        filtered.forEach((d,i)=>{
            hiddencontext.beginPath();
            drawCell(hiddencontext,polygons[i]);
            // hiddencontext.arc(d.x, d.y, width/200, 0, 2*Math.PI);
            var c = genColor(i);
            data.nodeclr[c] = d.doc_id
            hiddencontext.fillStyle = c;
            hiddencontext.fill();
        })
        
        
        
        
    mainCanvas.on('mouseout', function(){
        
        tool.style('opacity', 0)
        title.text('')
    })        
    
    
    
        mainCanvas.on('mousemove', function(){
    		    
    		var mouseX = d3.event.layerX || d3.event.offsetX;
    		var mouseY = d3.event.layerY || d3.event.offsety;

    		
    		var col = hiddencontext.getImageData(mouseX, mouseY, 1, 1).data;
    		var colKey = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
    		var nodeData = data.nodeclr[colKey];
    		try{
                var doc = data.info.get(''+nodeData)
                
                title.text(doc.title)
                
    			// tool
    			// 	.style('opacity', 0.98)
    			// 	.style('top', d3.event.pageY < halfwidth ? halfwidth:0)
    			// 	.style('left',d3.event.pageX < halfwidth ? halfwidth:0)
                //     //.style('left', d3.event.pageX + 5 + 'px')
    			// 	.html('Name: ' + doc.title + '<br>' + 'Content: ' + doc + '<br>' );
    		} catch(e) {
    			tool
    				.style('opacity', 0);
    		}

    	})
        
        
        mainCanvas.on('dblclick', function(){

            var mouseX = d3.event.layerX || d3.event.offsetX;
            var mouseY = d3.event.layerY || d3.event.offsety;

            
            var col = hiddencontext.getImageData(mouseX, mouseY, 1, 1).data;
            var colKey = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
            var nodeData = data.nodeclr[colKey];
            try{
                var doc = data.info.get(''+nodeData)
                
                doi(doc.wosarticle__di)
            } catch(e) {
            }

        })
        
        
        
        
	}


    function drawCell(ctx,cell) {
      if (!cell) return false;
      ctx.moveTo(cell[0][0], cell[0][1]);
      for (var j = 1, m = cell.length; j < m; ++j) {
        ctx.lineTo(cell[j][0], cell[j][1]);
      }
      //ctx.closePath();
      return true;
    }
    
    // function for tooltip
    function genColor(i){
    		var ret = [];
    		if (i < 16777215){
    			ret.push(i & 0xff); //R
    			ret.push((i & 0xff00) >> 8); //G
    			ret.push((i & 0xff0000) >> 16); //B

    			
    		}
            return  "rgb(" + ret.join(',') + ")";
        }
    	

function doi(x){
    var url = `https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=${x.replace('/','%2F')}&btnG=`
    console.log(url)
    var win = window.open(url, '_blank');
    win.focus();
    
}

