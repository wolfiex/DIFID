

// 3js setup

  var height_scale = 80;
  var scene = new THREE.Scene();
  scene.background=new THREE.Color(d3.color('#222').toString())
  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  
  
  var renderer = new THREE.WebGLRenderer({antialias:true});
  var controls = new THREE.OrbitControls(camera, renderer.domElement );
  controls.minDistance = 0;
  controls.maxDistance = 505;
//controls.noZoom = true;


  renderer.setSize(80,80);
  renderer.setPixelRatio( window.devicePixelRatio );
  document.getElementById('graph0').appendChild(renderer.domElement);


d3.queue()
  .defer(d3.json, 'src/world-110m.v1.json')// world outline
  .defer(d3.csv, '../preprocess/nodes.csv')// node data
  //.defer(d3.xml,'../graph/graph.svg')// graph image
  .defer(d3.csv,'../preprocess/links_topq.csv')
  .await(load)



function load(err,...data){

    
    // make data global
    window.data = data;


    nodes = sphere3d(data[1])
    // plot links
    links = lines3d(scene,data[2])
    
    nodes.documents.visible=false
    links.visible=false
    scene.add( nodes.documents );
    scene.add( nodes.topics)

    window.g = {nodes,links}

   render();
   render3();
   window.scrollTo(0, 0);
   document.getElementById('loader').remove()
   console.log('queue loaded')
} 






const mw = 1200;
var oldWidth = 0


async function render(){
    
    
      
  if (oldWidth == innerWidth) return
  oldWidth = innerWidth

  var width = height = Math.min(innerWidth,innerHeight)//d3.select('#graph').node().offsetWidth
  
  if (width>mw){
      width = height = mw
  }

  split = 0.8
  

  
d3.selectAll('#sections').style('width',((1-split)*width)+'px')
var fig = width*split-10
d3.selectAll('#sections div').style('height',fig+'px')

renderer.setSize(fig,fig);
setupCamera();
addLights();


 var canvas = d3.select('#graph')
  .style('width', (width*split)+'px')
  .html('')
  .append('canvas')
  .style('width', (fig)+'px')
  .style('height', (fig)+'px')

var context = setupCanvas(canvas.node());

const projection = d3
    .geoArmadillo()
    .fitSize([fig,fig], { type: "Sphere" })
    //.rotate([20, -90, 45])
    .precision(0.1);

const path = d3.geoPath(projection, context);
  context.save();   

world = data[0];
outline = ({type: "Sphere"}) ;
graticule = d3.geoGraticule10()
land =  topojson.feature(world, world.objects.land)
points = data[1].map(function(d){d.pmap = projection([parseInt(d.lon),parseInt(d.lat)]); return d})

console.log(points[3])

/// Internal functions

function clear(){
    context.clearRect(0, 0, fig, fig);
}


function drawMap(alpha = 1 ){
context.globalAlpha = alpha;    
context.beginPath(), path(outline), context.clip(), context.fillStyle = "#fff", context.fillRect(0, 0, width, height);

context.beginPath(), path(graticule), context.strokeStyle = "#ccc", context.stroke();     


context.beginPath(), path(land), context.fillStyle = "#333", context.fill();


//context.restore();
// context.beginPath(), path(outline), context.strokeStyle = "red", context.stroke();

}







function plot_points(size=1){
    
    points.forEach(function (p){
        
        context.beginPath();
        context.arc(p.pmap[0],p.pmap[1], 1*size, 0, 2*Math.PI);
        context.fillStyle = `rgba(255,160,0,${size})`
        context.fill()    
        
        
    })
//context.restore();
console.log('pt end')    
}
    


function plot_points(size=1){
    
    points.forEach(function (p){
        
        context.beginPath();
        context.arc(p.pmap[0],p.pmap[1], 1*size, 0, 2*Math.PI);
        context.fillStyle = `rgba(255,160,0,${size})`
        context.fill()    
                
    })
//context.restore();
console.log('pt end')    
}



function plot_pc(alpha=1){
    
    var cs = d3.schemeCategory20.map(d=>d3.color(d))
    
    points.forEach(function (p){
        var c = cs[parseInt(p.infomap)] || d3.color('green')
        context.beginPath();
        context.arc(p.pmap[0],p.pmap[1], 1, 0, 2*Math.PI);
        context.fillStyle = `rgba(${c.r},${c.b},${c.g},${alpha})`
        context.fill()    
                
    })
//context.restore();
console.log('pt end')    
}




function svgpts(){
    
    window.data[2].papers.forEach(function (p){
        
        context.beginPath();
        context.arc(p.pmap[0],p.pmap[1], 1*size, 0, 2*Math.PI);
        context.fillStyle = `rgba(255,160,0,${size})`
        context.fill()    
                
    })
//context.restore();
console.log('pt end')    
}




var gs = d3.graphScroll()
    .container(d3.select('.container-0'))
    .graph(d3.selectAll('container-0 #graph0'))
    .eventId('uniqueId0')  // namespace for scroll and resize events
    .sections(d3.selectAll('.container-0 #sections > div'))
    // .offset(innerWidth < 900 ? innerHeight - 30 : 200)
    .on('active', function(section){
  
  /// do stuff i 
  
  switch (section) {

      case 1:
          d3.select({}).transition()
            .duration(2000)
            .ease(d3.easeQuadIn)//.ease(Math.sqrt)
            .tween("topic", function(i) {
                
                g.nodes.topics.visible=true
                g.nodes.documents.visible=false
                g.links.visible=false
                console.log('adding topics')
                return function (i){
                g.nodes.topics.children.forEach(d=>d.material.opacity=i)
                
            }
                
                
            });
            
          break;  
     

      case 2:
          d3.select({}).transition()
            .duration(1500)
            .ease(d3.easeCubicInOut)//.ease(Math.sqrt)
            .tween("link", function(i) {
                console.log('adding links')
                //var g0 = document.getElementById('graph0')
                //g0.style.opacity=0.5
                g.nodes.documents.visible=true
                g.links.visible=false
                g.nodes.topics.visible=false
                return function (i){
                color3d()
                g.nodes.documents.children.forEach(d=>d.material.opacity=i*.8)
            }
                
            });
          break;
          
          
      case 3:
          clear()
          drawMap(alpha = 1 )
          d3.select({}).transition()
            .duration(2500)
            .ease(d3.easeCubicInOut)//.ease(Math.sqrt)
            .tween("fade2col", function() {
                 console.log('colouring')
                 g.links.visible=true
                 g.nodes.topics.visible=false
                // 
                // g.nodes.documents.children.forEach(d=>d.material = new THREE.MeshBasicMaterial( {transparent: true, opacity:.80, color:d.material.color}))
                
              return function(i){
                  g.links.children.forEach(d=>d.material.opacity=i/7)
              }  
            });
          
          break;      
   


  }
  
    })



 
  
  var gs = d3.graphScroll()
      .container(d3.select('.container-1'))
      .graph(d3.selectAll('container-1 #graph'))
      .eventId('uniqueId1')  // namespace for scroll and resize events
      .sections(d3.selectAll('.container-1 #sections > div'))
      // .offset(innerWidth < 900 ? innerHeight - 30 : 200)
      .on('active', function(section){
    
    /// do stuff i 
    
    switch (section) {

        case 0:
            d3.select({}).transition()
              .duration(3000)
              .ease(d3.easeQuadIn)//.ease(Math.sqrt)
              .tween("fade", function() {
                return drawMap
              });
              
            break;        

        case 1:
            console.log(1)
            clear()
            drawMap(alpha = 1 )
            d3.select({}).transition()
              .duration(1500)
              .ease(d3.easeCubicInOut)//.ease(Math.sqrt)
              .tween("facepts", plot_points);
            
            break;
        case 2:
            console.log(2)
            clear()
            drawMap(alpha = 1 )
            d3.select({}).transition()
              .duration(1500)
              .ease(d3.easeCubicInOut)//.ease(Math.sqrt)
              .tween("fade2col", function() {
                return plot_pc
              });
            
            break;      
     
  
  
    }
    
      })






/// container 2
  // 
  // var gs2 = d3.graphScroll()
  //     .container(d3.select('.container-2'))
  //     .graph(d3.selectAll('.container-2 #graph'))
  //     .eventId('uniqueId2')  // namespace for scroll and resize events
  //     .sections(d3.selectAll('.container-2 #sections > div'))
  //     .on('active', function(i){
  //       var h = height
  //       var w = width
  // 
  // 
  //       // path.transition().duration(1000)
  //       //     .attr('d', dArray[i])
  //       //     .style('fill', colors[i])
  //     })
  // 
  // 


      
};


var elem = [...document.querySelectorAll('div.pad')]
elem.unshift(document.getElementsByClassName('container-head')[0]);
var listen = true;

// 
// 
document.addEventListener("wheel", function (e) {
    e.preventDefault();
    
    if (listen){
    var active = document.querySelector('div.pad.graph-scroll-active')
    var index = elem.indexOf(active)+Math.sign(e.deltaY)
    var target = elem[index]
    target.scrollIntoView(true)
    window.scrollBy(0, -0.07*innerWidth);
    listen=false
    setTimeout(function(){listen=true;console.log(index)}, 1500);
        return false;
}



},{
  passive: false
});


d3.select(window).on('resize', render)
