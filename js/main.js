
var windowH = $(window).height();
$("#map-container").height(windowH);
$("#infoWrapper").height(windowH);

$("#info-pic-loading").hide();

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
var publicSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1Ee2kuKdzqSZ9M62p1OLsaRPIquAKvl_eSDRPf0kO1kI/edit#gid=0';
function init() {
  Tabletop.init( { key: publicSpreadsheetUrl,
                   callback: drawCalendar,
                   simpleSheet: true } )
}


function awesomeIcon(type){
  switch(type){
    case "financial":
        return "bank";
        break;
    // case "atm":
    //     return "credit-card";
    //     break;
    case "market":
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

var indicator = L.featureGroup();

function clearClicked(cb){
  if(map.hasLayer(indicator)){ map.removeLayer(indicator); }
  $('#info-location-name').text('');
  $('#info-location-type').text('');
  $('#info-location-status').text('');
  $('#info-location-notes').text('');
  $('#info-location-picture').html('');
  $('#info-location-time').text('');
  cb();
}

function onClick(event){
  clearClicked(function(){
    var locProps = event.target.options.properties;

    indicator = L.featureGroup().addTo(map);
    var markerOptions = {
        radius: 12,
        fillColor: "#ffffb3",
        color: "#ffffb3",
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8
    };
    var lat = parseFloat(locProps.latitude)
    var lng = parseFloat(locProps.longitude)
    var indicatorMarker = L.circleMarker([lat,lng], markerOptions).addTo(indicator);
    indicatorMarker.bringToBack();

    var loadedCount = 0;
    var loadingCount = 0;
    $("#info-pic-loading").show();

    $('#info-location-name').text(locProps['name']);
    $('#info-location-type').text(locProps['type']);
    $('#info-location-status').text(locProps['status']);
    $('#info-location-notes').text(locProps['status-notes']);

    var picHtml = "";
    var picUrlBase = "https://arcimagery.s3.amazonaws.com/disasters/2017-dominica-maria/financial_inst_and_market_assessment/";
    if(locProps['picture0'].length > 0){
      loadingCount++;
      picHtml += '<img class="location-pic" src="' + picUrlBase + locProps['picture0'] + '">'
    }
    if(locProps['picture1'].length > 0){
      loadingCount++;
      picHtml += '<img class="location-pic" src="' + picUrlBase + locProps['picture1'] + '">'
    }
    $('#info-location-picture').html(picHtml);
    $('.location-pic').load(function(){
      loadedCount++;
      if(loadedCount == loadingCount){
        $("#info-pic-loading").hide();
      }
    })
    $('#info-location-time').text(d3.isoParse(locProps._submission_time))
  })
}

var data;
function drawCalendar(info, tabletop){

  data = info;
  for(var i=0; i<data.length; i++){
    data[i].today =  data[i]._submission_time.slice(0,10);
  }

  var calendarRows = function(month){
    //expects the month floor e.g. `Tue Mar 01 2016 00:00:00 GMT-0500 (EST)`
    return d3.timeWeeks(d3.timeWeek.floor(month), d3.timeMonth.offset(month,1)).length
  }

  var minDate = d3.min(data, function(d) { return new Date(d._submission_time) })
  // var maxDate = new Date("2016-03-28")
  var maxDate = d3.max(data, function(d) { return new Date(d._submission_time) })

 var cellMargin = 2,
     cellSize = 20;

 var day = d3.timeFormat("%w"),
     week = d3.timeFormat("%U"),
     percent = d3.format(".1%"),
     format = d3.timeFormat("%Y-%m-%d"),
     titleFormat = d3.utcFormat("%a, %d %b");
     monthName = d3.timeFormat("%B"),
     months= d3.timeMonth.range(d3.timeMonth.floor(minDate), maxDate);

 var svg = d3.select("#calendar").selectAll("svg")
     .data(months)
     .enter().append("svg")
       .attr("width", (cellSize * 7) + (cellMargin * 8) )
       .attr("height", function(d) {
          var rows = calendarRows(d);
          return (cellSize * rows) + (cellMargin * (rows + 1)) + 20 ; // the 20 is for the month labels
        })
       .attr("class", "month")
     .append("g")

   d3.select("#calendar").selectAll("svg").append("text")
      .attr("x", ((cellSize * 7) + (cellMargin * 8)) / 2 )
      .attr("y", 15)
      .attr("class", "month-name")
      .attr("text-anchor", "middle")
      .text(function(d) { return monthName(d); })

 var rect = svg.selectAll("rect.day")
     .data(function(d, i) { return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth()+1, 1)); })
     .enter().append("rect")
       .attr("class", "day")
       .attr("width", cellSize)
       .attr("height", cellSize)
       .attr("rx", 3)
       .attr("ry", 3)
       .attr("fill", '#eaeaea')
       .attr("x", function(d) { return (day(d) * cellSize) + (day(d) * cellMargin) + cellMargin; })
       .attr("y", function(d) { return ((week(d) - week(new Date(d.getFullYear(),d.getMonth(),1))) * cellSize) + ((week(d) - week(new Date(d.getFullYear(),d.getMonth(),1))) * cellMargin) + cellMargin + 20; })
       .on("mouseover", function(d) {
         d3.select(this).classed('hover', true);
       })
       .on("mouseout", function(d) {
         d3.select(this).classed('hover', false);
       })
      .datum(format);

 rect.append("title")
    .text(function(d) { return titleFormat(new Date(d)); });


  var lookup = d3.nest()
    .key(function(d) { return d.today; })
    .rollup(function(leaves) {
      return leaves.length;
    })
    .object(data);

  var count = d3.nest()
    .key(function(d) { return d.today; })
    .rollup(function(leaves) { return leaves.length; })
    .entries(data);

  var scale = d3.scaleLinear()
    .domain(d3.extent(count, function(d) { return d.value; }))
    .range([0.4,1]); // the interpolate used for color expects a number in the range [0,1] but i don't want the lightest part of the color scheme


  rect.filter(function(d) { return d in lookup; })
      .style("fill", function(d) { return d3.interpolatePuBu(scale(lookup[d])); })
      .classed("clickable", true)
      .on("click", function(d){
        if(d3.select(this).classed('focus')){
          d3.select(this).classed('focus', false);
        } else {
          d3.select(this).classed('focus', true)
        }
        filterMap();
      })
    .select("title")
      .text(function(d) { return titleFormat(new Date(d)) + ":  " + lookup[d]; });

  showInfo();

}

function filterMap(){
  map.removeLayer(locations);
  clearClicked(function(){ showInfo(); });
}



function showInfo(){

  var dates = [];
  d3.selectAll("rect.day.focus").each(function(d){
    dates.push(d)
  })
  var filteredData = data;
  if(dates.length > 0){
    filteredData = data.filter(function(d){ return dates.indexOf(d.today) !== -1 })
  }

  locations = L.featureGroup();
  for(var i=0; i<filteredData.length; i++){
      var lat = parseFloat(filteredData[i].latitude)
      var lng = parseFloat(filteredData[i].longitude)
      if(!isNaN(lat) && !isNaN(lng)) {
        var locationMarker = L.VectorMarkers.icon({
          icon: awesomeIcon(filteredData[i].type),
          markerColor: statusColor(filteredData[i].status)
        });
        L.marker([lat,lng], {
          icon: locationMarker,
          properties: filteredData[i]
        }).on('click', onClick).addTo(locations);
      }
  }
  locations.addTo(map);
  map.fitBounds(locations.getBounds())


  $("#loading").hide();
}




// on window resize
$(window).resize(function(){
  windowH = $(window).height();
  $("#map-container").height(windowH);
  $("#infoWrapper").height(windowH);
})

init();
