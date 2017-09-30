
var windowH = $(window).height();
$("#map-container").height(windowH);
$("#infoWrapper").height(windowH);


// create basic leaflet map
// ========================
// tile layer for base map
var hotUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  hotAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles from <a href="http://hot.openstreetmap.org/" target="_blank">H.O.T.</a>',
  hotLayer = L.tileLayer(hotUrl, {attribution: hotAttribution});
// initialize map w options
var map = L.map('map', {
  layers: [hotLayer],
  center: new L.LatLng(0,0),
  zoom: 2,
  minZoom: 2
});

// get the data from the google spreadhsheet
var publicSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1Ee2kuKdzqSZ9M62p1OLsaRPIquAKvl_eSDRPf0kO1kI/edit?usp=sharing';
function init() {
  Tabletop.init( { key: publicSpreadsheetUrl,
                   callback: showInfo,
                   simpleSheet: true } )
}


function awesomeIcon(type){
  switch(type){
    case "bank":
        return "bank";
        break;
    case "atm":
        return "credit-card";
        break;
    case "shop":
        return "shopping-basket";
        break;
    default:
        return "question-circle";
  }
}

function statusColor(status){
  switch(status){
    case "functioning":
        return "#4daf4a";
        break;
    case "partial":
        return "#ff7f00";
        break;
    case "non-functioning":
        return "#e41a1c";
        break;
    default:
        return "#a9a9a9";
  }
}

function onClick(event){
  var locProps = event.target.options.properties;
  if(locProps['institution-name'] == "other"){
    $('#info-location-name').text(locProps['institution-name_other']);
  } else {
    $('#info-location-name').text(locProps['institution-name']);
  }
  $('#info-location-type').text(locProps['type']);
  $('#info-location-status').text(locProps['status']);
  $('#info-location-notes').text(locProps['status-notes']);

  var picUrl = "https://arcimagery.s3.amazonaws.com/disasters/2017-dominica-maria/financial_inst_and_market_assessment/" +
    locProps['picture0'];
  var picHtml = '<img class="location-pic" src="' + picUrl + '">'
  $('#info-location-picture').html(picHtml);
  $('#info-location-time').text(d3.isoParse(locProps.metasubmissionTime))

}

var data;
function showInfo(table, tabletop){
  data = table;
  locations = L.featureGroup();
  data.forEach(function(d, i) {
      d.today = d.metasubmissionTime.slice(0,10);
      var lat = parseFloat(d.latitude)
      var lng = parseFloat(d.longitude)
      if(!isNaN(lat) && !isNaN(lng)) {
        var locationMarker = L.VectorMarkers.icon({
          icon: awesomeIcon(d.type),
          markerColor: statusColor(d.status)
        });
        L.marker([lat,lng], {
          icon: locationMarker,
          properties: d
        }).on('click', onClick).addTo(locations);
      }
  });
  locations.addTo(map);
  map.fitBounds(locations.getBounds())
  doneLoading();
}

function drawCalendar(){

  var calendarColumns = function(month){
    //expects the month floor e.g. `Tue Mar 01 2016 00:00:00 GMT-0500 (EST)`
    return d3.time.weeks(d3.time.week.floor(month), d3.time.month.offset(month,1)).length
  }

  var minDate = d3.min(calendarData, function(d) { return new Date(d.today) })
  // var maxDate = new Date("2016-03-28")
  var maxDate = d3.max(calendarData, function(d) { return new Date(d.today) })


 var cellMargin = 2,
     cellSize = 20;

 var day = d3.time.format("%w"),
     week = d3.time.format("%U"),
     percent = d3.format(".1%"),
     format = d3.time.format("%Y-%m-%d"),
     titleFormat = d3.time.format.utc("%a, %d %b");
     monthName = d3.time.format("%B"),
     months= d3.time.month.range(d3.time.month.floor(minDate), maxDate);

 var svg = d3.select("#calendar").selectAll("svg")
     .data(months)
     .enter().append("svg")
       .attr("height", (cellSize * 7) + (cellMargin * 8) + 20)
       .attr("width", function(d) {
          var columns = calendarColumns(d);
          return (cellSize * columns) + (cellMargin * (columns + 1));
        })
       .attr("class", "month")
     .append("g")

   d3.select("#calendar").selectAll("svg").append("text")
      .attr("y", (cellSize * 7) + (cellMargin * 8) + 15 )
      .attr("x", function(d) {
        var columns = calendarColumns(d);
        return ((cellSize * columns) + (cellMargin * (columns + 1))) / 2;
      })
      .attr("class", "month-name")
      .attr("text-anchor", "middle")
      .text(function(d) { return monthName(d); })

 var rect = svg.selectAll("rect.day")
     .data(function(d, i) { return d3.time.days(d, new Date(d.getFullYear(), d.getMonth()+1, 1)); })
     .enter().append("rect")
       .attr("class", "day")
       .attr("width", cellSize)
       .attr("height", cellSize)
       .attr("rx", 3)
       .attr("ry", 3)
       .attr("fill", '#eaeaea')
       .attr("y", function(d) { return (day(d) * cellSize) + (day(d) * cellMargin) + cellMargin; })
       .attr("x", function(d) { return ((week(d) - week(new Date(d.getFullYear(),d.getMonth(),1))) * cellSize) + ((week(d) - week(new Date(d.getFullYear(),d.getMonth(),1))) * cellMargin) + cellMargin ; })
       .on("mouseover", function(d) {
         d3.select(this).classed('hover', true);
       })
       .on("mouseout", function(d) {
         d3.select(this).classed('hover', false);
       })
      .datum(format);

 rect.append("title")
    .text(function(d) { return titleFormat(new Date(d)); });

  var data = d3.nest()
    .key(function(d) { return d.today; })
    .rollup(function(leaves) { return leaves.length; })
    .map(calendarData);


    var color = d3.scale.quantize()
      .domain(d3.extent(calendarData, function(d) { return parseInt(d.count) }))
      .range(["#9ecae1","#6baed6","#4292c6","#2171b5","#08519c","#08306b"]);
      // Every ColorBrewer Scale
      // http://bl.ocks.org/mbostock/raw/5577023/

  rect.filter(function(d) { return d in data; })
      .style("fill", function(d) { return color(data[d]) })
      // .classed("clickable", true)
      // .on("click", function(d){
      //   if(d3.select(this).classed('focus')){
      //     d3.select(this).classed('focus', false)
      //   } else { d3.select(this).classed('focus', true)  }
      //   filterMap();
      // })
    .select("title")
      .text(function(d) { return titleFormat(new Date(d)) + ":  " + data[d]; });

}

function doneLoading(){
  console.log("heyu")
  $("#loading").hide();
}

// on window resize
$(window).resize(function(){
  windowH = $(window).height();
  $("#map-container").height(windowH);
  $("#infoWrapper").height(windowH);
})

init();
