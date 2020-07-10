var loader = new THREE.TextureLoader();


function setupCanvas(canvas) {
  // Get the device pixel ratio, falling back to 1.
  var dpr = window.devicePixelRatio || 1;
  // Get the size of the canvas in CSS pixels.
  var rect = canvas.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  var ctx = canvas.getContext('2d');
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  ctx.scale(dpr, dpr);
  return ctx;
}

// CAMERA SCENE
function addLights() {
  var ambientLight = new THREE.AmbientLight(0x444444);
  ambientLight.intensity = 0.1;
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1.);

  directionalLight.position.set(2100, 2100, 2100); //.normalize(); //900 400 0000

  directionalLight.castShadow = true;
    scene.add(directionalLight);


  var directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight2.position.set(-2100, -2100, -2100);
directionalLight2.castShadow = true;
directionalLight2.shadowCameraVisible = true;
// 
// directionalLight2.shadowCameraNear = 0.1;
// directionalLight2.shadowCameraFar = 1500;
  scene.add(directionalLight2);

  //

}

function setupCamera() {
 var diag = Math.sqrt(2*250**2);
  (camera.position.x = diag),
    (camera.position.y = -diag),
    (camera.position.z = 0);
// 
camera.position.set(-238.28170746732,-37.63611473497561, 386.68437666960847)
// 
camera.rotation.set(0.09702471384151097, -0.5501556360272357
,0.05084237596710642)

  camera.lookAt(new THREE.Vector3(0, 0, 0));
  camera.castShadow=true



// _x: 0.8509394739919909, _y: 0.10293695562021556, _z: -0.11665942479134604,
// {x: 51.89140880197084, y: -377.69962709346026, z: 331.1725734205775}
}



var old = 0
function render3() {
    // 
    // window.raycaster.setFromCamera( mouse, camera );
    // 
	// // calculate objects intersecting the picking ray
	// var intersects = raycaster.intersectObjects( window.g.nodes.children ,true);
    // if (intersects.length != old ){
    //     window.i = intersects
    //     old = intersects.length
    //     console.log(intersects[0])
    // }
    
  requestAnimationFrame(render3);
  
  renderer.render(scene, camera);
}

function lines3d(scene,ldata){
var material = new THREE.LineBasicMaterial( { color: d3.color('whitesmoke').toString() ,transparent: true, opacity:.0,linewidth: 0.2} );//0xffffff

var links = new THREE.Group();


//lines
ldata.forEach(d=>{
points = [window.loc[d.source] , window.loc[d.target]]
var geometry = new THREE.BufferGeometry().setFromPoints( points );
var line = new THREE.Line( geometry, material);
links.add(line) 
})


    scene.add( links  );
    return links
    
}


function color3d(){
    
  // 
  // var mclr = d3.max(window.clr)
  // window.clr = window.clr.map(d=>d3.interpolateViridis(d/mclr).toString())

  var cmap = d3.scaleOrdinal('f9c80e-f86624-ea3546-662e9b-36e0f7'.split('-').map(d=>'#'+d))
  
  window.clr = window.clr.map(d=>cmap(d).toString())
  window.g.nodes.documents.children.forEach((d,i)=>
  
  
  d.material.color.set(window.clr[i]))
  // = new THREE.MeshPhongMaterial( {transparent: true, opacity:.10, color:window.clr[i]})
  //.color.set(window.clr[i]))


}


function sphere3d(ndata){
        
    var nodes = {documents:new THREE.Group(),topics:new THREE.Group()}
    
    var geometry = new THREE.SphereGeometry( 1, 32, 32 );
    geometry.colorsNeedUpdate = true;
    var material = new THREE.MeshBasicMaterial();
    var spheretemp = new THREE.Mesh( geometry, material );
    window.clr = []
    window.loc = {}

    ndata.forEach(d=>{
        window.clr.push(parseInt(d.infomap))
        //topic node
        if (d.paper!='1'){
            
            var sphere = new THREE.Mesh(new THREE.SphereGeometry( 3, 32, 32 ), new THREE.MeshNormalMaterial( {transparent: true, opacity:.10
                //, color: d3.color('coral').toString()  
            } ));
            
        }
        else{
        var sphere = spheretemp.clone()
        sphere.material = new THREE.MeshPhongMaterial( {transparent: true, opacity:0, color: 0x0099ff
} );
}


        sphere.name = d.id;
        sphere.position.set(d.x, d.y,d.z);
        window.loc[d.id] = new THREE.Vector3(d.x, d.y,d.z);
        
    nodes[d.paper!='1'?'topics':'documents'].add(sphere)
    
  })
return nodes
}


            // 
			// function onDocumentMouseMove( event ) {
            // 
			// 	event.preventDefault();
            // 
            // 
            //     var rect = renderer.domElement.getBoundingClientRect();
            //     mouse.x = ( ( event.clientX - rect.left ) / ( rect.width - rect.left ) ) * 2 - 1;
            //     mouse.y = - ( ( event.clientY - rect.top ) / ( rect.bottom - rect.top) ) * 2 + 1;
            // 
            //     // console.log('mouse',mouse)
            // }

// 
// window.addEventListener( 'mousemove', onDocumentMouseMove, false );