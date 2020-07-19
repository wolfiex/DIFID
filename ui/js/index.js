
var em;
var div = document.getElementById('div');
div.style.height = '1em';
em = div.offsetHeight 



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
  .defer(d3.csv, '../data/label_tsne.csv')//labelloc
  //.defer(d3.json,"../continents.geojson")
  //.defer(d3.csv, '../preprocess/nodes.csv')// node data
  .await(load)





function load(err,...dt){
    console.log('Loading...',dt)
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
    
    
    var hw = width/2.0
    data.labels = dt[3].map(d=>{d.x = d.cx=data.x(d['tsne-1']),d.y=d.cy=data.y(d['tsne-2']);  d.left=d.x<hw ;  return d}).sort(function(x, y){
   return d3.ascending(x.y, y.y);
})


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
    //draw_world(dt[3])
    
    
    d3.select('canvas').call(d3.zoom()
        .scaleExtent([1, 8]).translateExtent([[0, 0], [width, height]])
            .extent([[0, 0], [width, height]])
        .on("zoom", () => zoomed(d3.event.transform)))
        
        ;

    function zoomed(transform) {
        
      d3.selectAll('.annotation-group').remove()
      context.save();
      context.clearRect(0, 0, width, height);
      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);
      
      hiddencontext.save();
      hiddencontext.clearRect(0, 0, width, height);
     
      hiddencontext.translate(transform.x, transform.y); 
      hiddencontext.scale(transform.k, transform.k);

      data.zoom =  (1/transform.k)**.5||1      
      draw()
      window.scroll(0,0)
      context.restore();
      hiddencontext.restore()
    }

    zoomed(d3.zoomIdentity);

    // 
    // label()
    console.log('data loaded')
}
    
    
    
    
    
function draw(){

		context.clearRect(0, 0, width, height);
        hiddencontext.clearRect(0, 0, width, height);
        // filter here


        var size = width/400
        var filtered = data.filtered || data.tsne 
        
        
        var points = filtered.map(d=>[d.x+Math.random()*0.001,d.y])
        /// MUST add random movement as voronoi fall over if occpying the same space. 
        var diagram = voronoi(points)
        var polygons = diagram.polygons();
        
        context.beginPath();
         for (var i = 0, n = polygons.length; i < n; ++i) drawCell(context,polygons[i]);
         context.strokeStyle = "rgba(2,2,2,0.1)";
         context.stroke();        
                        
        var keys = []
        filtered.forEach(d=>{
            context.globalAlpha = .5
            context.beginPath();
            context.arc(d.x, d.y, size*data.zoom, 0, 2*Math.PI);
            
            var item = data.info.get(d.doc_id)['continent'];
            keys.push(item)
            context.fillStyle = cmap(item) || 'black';
            
            context.fill();
            
        })
    
        legend([...new Set(keys)],cmap)
        
        
        
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
    			tool.style('opacity', 0);
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


function legend(keys,color){
    //console.log(keys,color)
    var keys = keys.filter(d=>d)
    var s = d3.select("#overlay")
    
    d3.selectAll('.legend').remove()

// Add one dot in the legend for each name.
s.selectAll("ldot")
  .data(keys)
  .enter()
  .append("circle")
  .classed('legend',true)
    .attr("cx", 20)
    .attr("cy", function(d,i){ return 30 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
    .attr("r", 3)
    .style('float','right')
    .style("fill", function(d){ return color(d)})

// Add one dot in the legend for each name.
s.selectAll("llab")
  .data(keys)
  .enter()
  .append("text")
   .classed('legend',true)
    .attr("x",30)
    .attr("y", function(d,i){ return 30 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
    .style("fill", function(d){ return color(d)})
    .text(function(d){ return d})
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")
    
    
    
}


function label(){       
    if (d3.select('.annotation-group').node()!=null){
        return d3.select('.annotation-group').remove()
        
    }
    
    
    const type = d3.annotationCalloutCircle

    var shift = d3.select('canvas').node().getBoundingClientRect()


    var left = data.labels.filter(d=>d.left)
    var right = data.labels.filter(d=>!d.left)
    window.l = left
    window.r = right

    var lh = height/(em*left.length)
    var rh = height/(em*right.length)
    console.log(rh,lh)
    
    var lc = 1
    var rc = 1
            
            console.log('dh')
            
            var annotations = data.labels.map(d=>{
                
                if (d.left){
                    var dh = lc*lh*em
                    lc+=1
                }else{
                    var dh = rc*rh*em
                    rc+=1
                }
                
                return { note: {
                    title:'32',
                    label: d.label,
                    bgPadding:0,
                    align:!d.left?"left":'right',
                  },
                  //can use x, y directly instead of data
                  data: { },
                     x:d.cx+shift.x, y:d.cy+shift.y,                  
                         ny: dh,//d.cy,
                         nx: d.left?shift.x - 80:80+shift.width+shift.x,  
                  
                  className: "show-bg",

                  subject: {
                    radius: 4
                  },
              }
              
              
            })


            var me = data.labels[2]
            console.log(me.x,me.cx,me.y,me.cy)


        const makeAnnotations = d3.annotation()
          .editMode(false)
          .notePadding(1.01)
          .type(type)
          .accessors({})
          .annotations(annotations)


        d3.select("#overlay")
          .append("g")
          .attr("class", "annotation-group")
          .call(makeAnnotations)

    // d3.selectAll('.annotation-note-label tspan').attr('dy','1.8em')
    d3.selectAll('.annotation-connector').attr('opacity',.6)
    d3.selectAll('.annotation-note-label')
    .style('pointer-events','auto')
    .on('mouseover',function(){
        var p = d3.select(this);
        [...p.node().parentElement.parentElement.parentElement.querySelectorAll('path, text')].forEach(d=>{d3.select(d).classed('hilight',true)})
    })
    .on('mouseout',function(){
        var p = d3.select(this);
        [...p.node().parentElement.parentElement.parentElement.querySelectorAll('*')].forEach(d=>{d3.select(d).classed('hilight',false)})
    })
    // 
}
