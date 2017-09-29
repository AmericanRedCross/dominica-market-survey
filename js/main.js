
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

function showInfo(data, tabletop){
  locations = L.featureGroup();
  data.forEach(function(d, i) {
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
