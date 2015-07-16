if(document.getElementById('width')){
var width = document.getElementById('width')
    width.setAttribute('width', (window.innerWidth * .8));
    console.log(width);
}

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
if(document.getElementById('hidden')){
  var payload = document.getElementById('hidden').innerHTML;

  if(payload != "empty"){

    payload = JSON.parse(payload);

    var h = window.innerHeight;
    var w = document.getElementById('graph').clientWidth

    console.log("h",h);
    console.log("w",w);

    var rx = w / 2.05,
        ry = h / 2.05,
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
        .style("top", "0px")
        .style("left", "0px")
        .style("margin", "0 auto")
        .style('border', '0px solid black')
        .style("width", w + "px")
        .style("height", w + "px")
        //.style("position", "relative")
        .style("-webkit-backface-visibility", "hidden");

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
};

d3.select("g-node").transition().duration(5000)
    .delay(500)
    .styleTween("background-color", function() { return d3.interpolate("green", "red"); });

if (document.getElementById('node-2noun')){
var nodes = document.getElementById('node-2noun')
var text = nodes.children[0].innerHTML
text = text.substr(1,text.length-1)
nodes.children[0].innerHTML = text;
nodes.children[0].setAttribute('fill', '#FF66ff')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '24px')
nodes.removeAttribute('cursor');
d3.select("#node-2noun")
 .on('click', null);
}

if (document.getElementById('node-2similar')){
var nodes = document.getElementById('node-2similar')
var text = nodes.children[0].innerHTML
text = text.substr(1,text.length-1)
nodes.children[0].innerHTML = text;
nodes.children[0].setAttribute('fill', '#880088')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '18px')
nodes.removeAttribute('cursor');
d3.select("#node-2similar")
 .on('click', null);
}

if (document.getElementById('node-2antonym')){
var nodes = document.getElementById('node-2antonym')
var text = nodes.children[0].innerHTML
text = text.substr(1,text.length-1)
nodes.children[0].innerHTML = text;
nodes.children[0].setAttribute('fill', '#880088')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '18px')
nodes.removeAttribute('cursor');
d3.select("#node-2antonym")
 .on('click', null);
}

if (document.getElementById('node-2related')){
var nodes = document.getElementById('node-2related')
var text = nodes.children[0].innerHTML
text = text.substr(1,text.length-1)
nodes.children[0].innerHTML = text;
nodes.children[0].setAttribute('fill', '#880088')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '18px')
nodes.removeAttribute('cursor');
d3.select("#node-2related")
 .on('click', null);
}


if (document.getElementById('node-3verb')){
var nodes = document.getElementById('node-3verb')
var text = nodes.children[0].innerHTML
text = text.substr(1,text.length-1)
nodes.children[0].innerHTML = text;
nodes.children[0].setAttribute('fill', '#00FF00')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '24px')
nodes.removeAttribute('cursor');
d3.select("#node-3verb")
 .on('click', null);
}

if (document.getElementById('node-3similar')){
var nodes = document.getElementById('node-3similar')
var text = nodes.children[0].innerHTML
text = text.substr(1,text.length-1)
nodes.children[0].innerHTML = text;
nodes.children[0].setAttribute('fill', '#008800')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '18px')
nodes.removeAttribute('cursor');
d3.select("#node-3similar")
 .on('click', null);
}

if (document.getElementById('node-3antonym')){
var nodes = document.getElementById('node-3antonym')
var text = nodes.children[0].innerHTML
text = text.substr(1,text.length-1)
nodes.children[0].innerHTML = text;
nodes.children[0].setAttribute('fill', '#008800')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '18px')
nodes.removeAttribute('cursor');
d3.select("#node-3antonym")
 .on('click', null);
}

if (document.getElementById('node-3related')){
var nodes = document.getElementById('node-3related')
var text = nodes.children[0].innerHTML
text = text.substr(1,text.length-1)
nodes.children[0].innerHTML = text;
nodes.children[0].setAttribute('fill', '#008800')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '18px')
nodes.removeAttribute('cursor');
d3.select("#node-3related")
 .on('click', null);
}


if (document.getElementById('node-1adjective')){
var nodes = document.getElementById('node-1adjective')
var text = nodes.children[0].innerHTML
text = text.substr(1,text.length-1)
nodes.children[0].innerHTML = text;
nodes.children[0].setAttribute('fill', '#0000FF')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '24px')
nodes.removeAttribute('cursor');
d3.select("#node-1adjective")
 .on('click', null);
}

if (document.getElementById('node-1similar')){
var nodes = document.getElementById('node-1similar')
var text = nodes.children[0].innerHTML
text = text.substr(1,text.length-1)
nodes.children[0].innerHTML = text;
nodes.children[0].setAttribute('fill', '#000088')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '18px')
nodes.removeAttribute('cursor');
d3.select("#node-1similar")
 .on('click', null);
}

if (document.getElementById('node-1antonym')){
var nodes = document.getElementById('node-1antonym')
var text = nodes.children[0].innerHTML
text = text.substr(1,text.length-1)
nodes.children[0].innerHTML = text;
nodes.children[0].setAttribute('fill', '#000088')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '18px')
nodes.removeAttribute('cursor');
d3.select("#node-1antonym")
 .on('click', null);
}

if (document.getElementById('node-1related')){
var nodes = document.getElementById('node-1related')
var text = nodes.children[0].innerHTML
text = text.substr(1,text.length-1)
nodes.children[0].innerHTML = text;
nodes.children[0].setAttribute('fill', '#000088')
nodes.children[0].setAttribute('font-weight', 'bold')
nodes.children[0].setAttribute('font-size', '18px')
nodes.removeAttribute('cursor');
d3.select("#node-1related")
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

//document.getElementById('recentWords').style.opacity = 0;
var recentWords = document.getElementById('recentWords')
var disabled = document.getElementById('disabled')
var recentWordsOn = 0;

window.addEventListener('click', function(){
    recentWords.style.opacity = 0;
    recentWords.style.zIndex = 0;
    recentWordsHeader.style.opacity = 0;
    recentWordsHeader.style.zIndex = 0;
})

if(document.getElementById('word')){
  var word = document.getElementById('word')
  word.addEventListener('focus', function(){
    if(word.value.length === 0){
      document.getElementById('submit').disabled = true;
      disabled.style.opacity = .75;
      disabled.style.zIndex = 9999;
    }
  })

  word.addEventListener('blur', function(){
    if(word.value.length === 0){
      document.getElementById('submit').disabled = true;
      disabled.style.opacity = .75;
      disabled.style.zIndex = 9999;
    }
  })

  word.addEventListener('keyup', function(){
    if(word.value.length > 0){
      document.getElementById('submit').disabled = false;
      disabled.style.opacity = 0;
      disabled.style.zIndex = 0;
    } else {
      document.getElementById('submit').disabled = true;
      disabled.style.opacity = .75;
      disabled.style.zIndex = 9999;
    }
  })
}

if (document.getElementById('back')){
  var back = document.getElementById('back')
  back.addEventListener('mouseover', function(){
      recentWords.style.opacity = 1;
      recentWords.style.zIndex = 9998;
      recentWordsHeader.style.opacity = 1;
      recentWordsHeader.style.zIndex = 9999;
  })

  recentWords.addEventListener('mouseleave', function(){
    console.log("wtf");
    recentWordsOn = 0;
    recentWords.style.opacity = 0;
    recentWords.style.zIndex = 0;
    recentWordsHeader.style.opacity = 0;
    recentWordsHeader.style.zIndex = 0;
  })
}

if (document.getElementById('delmode')){
  var del = document.getElementById('delmode')
  var add = document.getElementById('addmode')
    del.addEventListener('click', function(){
    del.setAttribute('id','delmode-on')
    add.setAttribute('id','addmode')
    document.getElementById('word-box').style.display = 'none';
    document.getElementById('word-box-del').style.display = 'inline-block';
  })
}

if (document.getElementById('addmode')){
  var del = document.getElementById('delmode')
  var add = document.getElementById('addmode')
    add.addEventListener('click', function(){
      del.setAttribute('id','delmode')
      add.setAttribute('id','addmode-on')
    document.getElementById('word-box-del').style.display = 'none';
    document.getElementById('word-box').style.display = 'inline-block';
  })
}

if(document.getElementById('hidden')){
  $( document ).ready(function() {
    setTimeout(function(){
    var status = document.getElementById('word')
        status.placeholder = "search..."
        status.style.backgroundColor = 'rgb(240,240,240)';
      status.addEventListener('focus', function(){
        status.style.backgroundColor = 'rgb(0,255,255)';
      });
      status.addEventListener('blur', function(){
        status.style.backgroundColor = 'rgb(240,240,240)';
      });
      var hiddendiv = document.getElementById('hidden')
          hiddendiv.innerHTML = 'true';

      $("#backlabel").delay(100).fadeIn(300);
      $("#discoveredlabel").delay(200).fadeIn(300);
      $("#backcenter").delay(300).fadeIn(300);
      $("#discovered").delay(400).fadeIn(300);
      $("#heading5").delay(500).fadeIn(300);
      $("#heading4").delay(600).fadeIn(300);
      $("#heading3").delay(600).fadeIn(300);
      $("#profile").delay(700).fadeIn(300);
      $("#ds3Frame").delay(800).fadeOut(300);
      //$("#div3").fadeIn(3000);

    },500)
  });
}

if(document.getElementById('histSearch')){
  var histSearch = document.getElementById('histSearch')
  var wordCols =  document.getElementsByClassName('col1')

  histSearch.addEventListener('keyup', function(){
    if(histSearch.value.length == 0){
      for(var i =0; i < wordCols.length; i++){
        wordCols[i].style.display = 'inline-block';
      }
    }
  });

  histSearch.addEventListener('keyup', function(){
    var searchChar = histSearch.value[0];
    if(histSearch.value.length > 0){
      searchChar = searchChar.toUpperCase();
      console.log("check", searchChar);

      for(var i =0; i < wordCols.length; i++){
        if(wordCols[i].children[0].innerHTML[0] === searchChar){
          wordCols[i].style.display = 'inline-block';
          console.log(wordCols[i].children[0].innerHTML);
        } else {
          wordCols[i].style.display = 'none';
        }
      }
    }
  });
};
