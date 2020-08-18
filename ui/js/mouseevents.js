

function canvasmove(ev) {    
    
    if (ev){
        var mouseX = ev.layerPoint.x 
        var mouseY = ev.layerPoint.y
    } else {
        var mouseX = d3.event.layerX || d3.event.offsetX ;
        var mouseY = d3.event.layerY || d3.event.offsetY ;
    }
    

    var col = hiddencontext.getImageData(mouseX, mouseY, 1, 1).data;
    var colKey = "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")";
    var nodeData = data.nodeclr[colKey];
    try {
        var doc = data.info.get("" + nodeData);
        title.text(doc.title);
        // tool
        // 	.style('opacity', 0.98)
        // 	.style('top', d3.event.pageY < halfwidth ? halfwidth:0)
        // 	.style('left',d3.event.pageX < halfwidth ? halfwidth:0)
        //     //.style('left', d3.event.pageX + 5 + 'px')
        // 	.html('Name: ' + doc.title + '<br>' + 'Content: ' + doc + '<br>' );
    } catch (e) {
        tool.style("opacity", 0);
    }
    // 
    
    if (!data.carto){
    
    if (imageData != undefined){
        //reset image
        context.putImageData(imageData,0,0)
    }else{
        //copy image
        imageData = context.getImageData(0,0,width,height);
    }
    
    var x = mouseX, y = mouseY
    context.beginPath();
    context.lineWidth=2;
    context.moveTo(x - 4, y - 4);
    context.lineTo(x + 4, y + 4);
    context.moveTo(x + 4, y - 4);
    context.lineTo(x - 4, y + 4);
    context.stroke();   
    context.beginPath();
    context.lineWidth=1.5;
    context.arc(x, y, 20, 0, 2 * Math.PI);
    context.stroke();
    
}

}



function canvasdblclick (ev) {    
    
    if (ev){
        var mouseX = ev.layerPoint.x 
        var mouseY = ev.layerPoint.y
    } else {
        var mouseX = d3.event.layerX || d3.event.offsetX ;
        var mouseY = d3.event.layerY || d3.event.offsetY ;
    }
    
    var col = hiddencontext.getImageData(mouseX, mouseY, 1, 1).data;
    var colKey = "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")";
    var nodeData = data.nodeclr[colKey];
    try {
        var doc = data.info.get("" + nodeData);

        doi(doc.wosarticle__di);
    } catch (e) {}
}



function mousesetup(hiddencontext, mainCanvas, map){
    mainCanvas.on("mouseout", function() {
        tool.style("opacity", 0);
        title.text("");
    });

    mainCanvas.on("mousemove", canvasmove);
    map.on("mousemove", canvasmove);

    mainCanvas.on("dblclick", canvasdblclick);
    map.on("dblclick", canvasdblclick);
    
}