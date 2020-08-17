function packageHierarchy(classes) {
  var map = {};

  function find(name, data) {
    var node = map[name], i;
    if (!node) {
      
      node = map[name] = data || {name: name, children: []};
      if (name.length) {
        node.parent = find(name.substring(0, i = name.lastIndexOf(":")));
        node.parent.children.push(node);
        node.key = name.substring(i + 1);
      }
    }
    return node;
  }

  classes.forEach(function(d) {
    find(d.name, d);
  });

  return d3.hierarchy(map[""]);
}

function draw_topics(){
    
    const root = tree(
        d3.hierarchy(data).sort((a, b) => d3.ascending(a.data.name, b.data.name))
      );

      const svg = d3
        .create("svg")
        .style("max-width", "100%")
        .style("height", "auto")
        .style("font", "10px sans-serif")
        .style("margin", "0px");

      const link = svg
        .append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5)
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr(
          "d",
          d3
            .linkRadial()
            .angle(d => d.x)
            .radius(d => d.y)
        );

      const node = svg
        .append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .selectAll("g")
        .data(root.descendants().reverse())
        .join("g")
        .attr(
          "transform",
          d => `
            rotate(${(d.x * 180) / Math.PI - 90})
            translate(${d.y},0)
          `
        );

      node
        .append("circle")
        //.attr("fill", d => (d.children ? "#555" : "#999"))
        .attr("r", 5.5);

      node
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", d => (d.x < Math.PI === !d.children ? 6 : -6))
        .attr("text-anchor", d => (d.x < Math.PI === !d.children ? "start" : "end"))
        .attr("transform", d => (d.x >= Math.PI ? "rotate(180)" : null))

        .text(d => {
          var v = d.data.data.name.split(':');
          return v[v.length - 1];
        })
        
        .style('font-weight', '')
        .style('fill', d => {
          var v = d.data.data.name.split(':');
          console.log(d.data.data.name);
          return d3.color(
            `hsl(${10 + (parseFloat(v[0]) / 4) * 360},${50 -
              5 * (parseFloat(v[1]) % 2)}%,${29 + 26 * (parseFloat(v[1]) % 2)}%)`
          );
        })

        .attr("font-size", '16px')
        .clone(true)
        .lower()
        .attr("stroke", "white");

}


