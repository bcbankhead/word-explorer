if(document.getElementById('sform')){
  var dictionary = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    // url points to a json file that contains an array of country names, see
    // https://github.com/twitter/typeahead.js/blob/gh-pages/data/countries.json
    prefetch: '/javascripts/dictionary.json'
  });
  // passing in `null` for the `options` arguments will result in the default
  // options being used
  $('#sform .input').typeahead(null, {
    name: 'dictionary',
    source: dictionary
  });
}
//***************************************************
//**************************************************
var payload = document.getElementById('hidden').innerHTML;

if(payload != "empty"){

  payload = JSON.parse(payload);

  var w = 770,
      h = 750,
      rx = w / 2,
      ry = h / 2,
      m0,
      rotate = 0;

  var splines = [];

  var cluster = d3.layout.cluster()
      .size([360, ry - 120])
      .sort(function(a, b) { return d3.ascending(a.key, b.key); });

  var bundle = d3.layout.bundle();

  var line = d3.svg.line.radial()
      .interpolate("bundle")
      .tension(.85)
      .radius(function(d) { return d.y; })
      .angle(function(d) { return d.x / 180 * Math.PI; });

  // Chrome 15 bug: <http://code.google.com/p/chromium/issues/detail?id=98951>
  var div = d3.select("#graph")
    .insert("div", "h2")
      //.style("top", "-80px")
      //.style("left", "0px")
      //.style('border', '1px solid black')
       //.style("width", w + "px")
       //.style("height", w + "px")
      // .style("position", "relative")
      // .style("-webkit-backface-visibility", "hidden");

  var svg = div.append("svg:svg")
      .attr("width", w)
      .attr("height", w)
    .append("svg:g")
      .attr("transform", "translate(" + rx + "," + ry + ")");
  svg.append("svg:path")
      .attr("class", "arc")
      .attr("d", d3.svg.arc().outerRadius(ry - 120).innerRadius(0).startAngle(0).endAngle(2 * Math.PI))
      .on("mousedown", mousedown);

    var nodes = cluster.nodes(packages.root(payload)),
        links = packages.imports(nodes),
        splines = bundle(links);

    var path = svg.selectAll("path.link")
        .data(links)
      .enter().append("svg:path")
        .attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; })
        .attr("d", function(d, i) { return line(splines[i]); });

    svg.selectAll("g.node")
        .data(nodes.filter(function(n) { return !n.children; }))
      .enter().append("svg:g")
        .attr("class", "node")
        .attr("id", function(d) { return "node-" + d.key; })
        .on("click", function(d) { window.location = "/words/"+ d.key; })
        .attr("cursor", "pointer")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
      .append("svg:text")
        .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
        .attr("dy", ".31em")
        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        //.attr("fill", "red")
        .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
        .text(function(d) { return d.key; })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

    d3.select("input[type=range]").on("change", function() {
      line.tension(this.value / 100);
      path.attr("d", function(d, i) { return line(splines[i]); });
    });

  d3.select(window)
      .on("mousemove", mousemove)
      .on("mouseup", mouseup);

  function mouse(e) {
    return [e.pageX - rx, e.pageY - ry];
  }

  function mousedown() {
    m0 = mouse(d3.event);
    d3.event.preventDefault();
  }

  function mousemove() {
    if (m0) {
      var m1 = mouse(d3.event),
          dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;
      div.style("-webkit-transform", "translateY(" + (ry - rx) + "px)rotateZ(" + dm + "deg)translateY(" + (rx - ry) + "px)");
    }
  }

  function mouseup() {
    if (m0) {
      var m1 = mouse(d3.event),
          dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;

      rotate += dm;
      if (rotate > 360) rotate -= 360;
      else if (rotate < 0) rotate += 360;
      m0 = null;

      div.style("-webkit-transform", null);

      svg
          .attr("transform", "translate(" + rx + "," + ry + ")rotate(" + rotate + ")")
        .selectAll("g.node text")
          .attr("dx", function(d) { return (d.x + rotate) % 360 < 180 ? 8 : -8; })
          .attr("text-anchor", function(d) { return (d.x + rotate) % 360 < 180 ? "start" : "end"; })
          .attr("transform", function(d) { return (d.x + rotate) % 360 < 180 ? null : "rotate(180)"; });
    }
  }

  function mouseover(d) {
    svg.selectAll("path.link.target-" + d.key)
        .classed("target", true)
        .each(updateNodes("source", true));

    svg.selectAll("path.link.source-" + d.key)
        .classed("source", true)
        .each(updateNodes("target", true));
  }

  function mouseout(d) {
    svg.selectAll("path.link.source-" + d.key)
        .classed("source", false)
        .each(updateNodes("target", false));

    svg.selectAll("path.link.target-" + d.key)
        .classed("target", false)
        .each(updateNodes("source", false));
  }

  function updateNodes(name, value) {
    return function(d) {
      if (value) this.parentNode.appendChild(this);
      svg.select("#node-" + d[name].key).classed(name, value);
    };
  }

  function cross(a, b) {
    return a[0] * b[1] - a[1] * b[0];
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
}

if (document.getElementById('node-noun')){
var nodes = document.getElementById('node-noun')
nodes.children[0].setAttribute('fill', '#FF0000')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '24px')
nodes.removeAttribute('cursor');
d3.select("#node-noun")
 .on('click', null);
}

if (document.getElementById('node-verb')){
var nodes = document.getElementById('node-verb')
nodes.children[0].setAttribute('fill', '#00FF00')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '24px')
nodes.removeAttribute('cursor');
d3.select("#node-verb")
 .on('click', null);
}

if (document.getElementById('node-adjective')){
var nodes = document.getElementById('node-adjective')
nodes.children[0].setAttribute('fill', '#0000FF')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '24px')
nodes.removeAttribute('cursor');
d3.select("#node-adjective")
 .on('click', null);

}

if (document.getElementById('node-general')){
var nodes = document.getElementById('node-general')
nodes.children[0].setAttribute('fill', '#00DDFF')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '24px')
nodes.removeAttribute('cursor');
d3.select("#node-general")
  .on('click', null);
}

if (document.getElementById('addword')){
  var addWord = document.getElementById('addword');
  addWord.addEventListener('mouseover', function(){
  var wordBox = document.getElementById('word-box');
    wordBox.style.backgroundColor = 'rgb(200, 235, 235)';
    wordBox.style.border = '1px dotted rgb(80, 135, 135)';
  })
  addWord.addEventListener('mouseout', function(){
  var wordBox = document.getElementById('word-box');
    wordBox.style.backgroundColor = '#FFFFFF';
    wordBox.style.border = '1px dotted black';
  })
}

if (document.getElementById('back')){
  var back = document.getElementById('back')
    back.addEventListener('click', function(){
    window.history.go(-1);
  })
}

if (document.getElementById('delmode')){
  var del = document.getElementById('delmode')
  var add = document.getElementById('addmode')
    del.addEventListener('click', function(){
    del.style.backgroundColor = 'rgb(255,210,210)'
    del.style.color = 'rgb(255,0,0)'
    add.style.backgroundColor = 'rgb(255,255,255)'
    add.style.color = 'rgb(150,150,150)'
    document.getElementById('word-box').style.display = 'none';
    document.getElementById('word-box-del').style.display = 'inline-block';
  })
}

if (document.getElementById('addmode')){
  var del = document.getElementById('delmode')
  var add = document.getElementById('addmode')
    add.addEventListener('click', function(){
    add.style.backgroundColor = 'rgb(155,240,240)'
    add.style.color = 'rgb(0,115,115)'
    del.style.backgroundColor = 'rgb(255,255,255)'
    del.style.color = 'rgb(150,150,150)'
    document.getElementById('word-box-del').style.display = 'none';
    document.getElementById('word-box').style.display = 'inline-block';
  })
}

$( document ).ready(function() {
  var hiddendiv = document.getElementById('hidden')
      hiddendiv.innerHTML = 'true';
  setTimeout(function(){
  var status = document.getElementById('word')
      status.placeholder = "search..."
      status.style.backgroundColor = 'rgb(240,240,240)';
    status.addEventListener('focus', function(){
    status.style.backgroundColor = 'rgb(0,255,255)';
    })
    status.addEventListener('blur', function(){
    status.style.backgroundColor = 'rgb(240,240,240)';
    })
  },500)
});
