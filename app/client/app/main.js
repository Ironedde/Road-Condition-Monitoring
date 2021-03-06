

var map, heatmap;
var markers = [];
var positions = [];
var polygon;
var selectionType = 0;
var tmp;
var polygonExists = false;
var allMarkers = [];
var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

var savedFilters = [];

var savedLogic = [];
var selectedLogic = "";

var zoomThreshold;
var visiblePoints;

function initMap() {


    var uluru = {lat: 65.581631, lng: 22.160044};


    zoomThreshold = 6;
    map = new google.maps.Map(document.getElementById('map'), {
        center: uluru,
        zoom: zoomThreshold,
        mapTypeId: "satellite"
    });

    heatmap = new Heatmap(map);
    heatmap.initialize();

    visiblePoints = new VisiblePoints(map, null);
    visiblePoints.onGooglePoints = function() {
        heatmap.update(this.googlePoints);
    };

    var once = false;

    map.addListener("bounds_changed", function() {
        if(!once)
            visiblePoints.getVisiblePoints();
        once = true;
    });

    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['circle', 'polygon', 'rectangle']
        },
        markerOptions: {
            icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'
        },
        circleOptions: {
            fillColor: '#000000',
            fillOpacity: .3,
            strokeWeight: 4,
            strokeColor: '#000000',
            clickable: false,
            draggable: true,
            editable: true,
            zIndex: 1
        },
        rectangleOptions: {
            fillColor: '#000000',
            fillOpacity: .3,
            strokeWeight: 4,
            strokeColor: '#000000',
            clickable: false,
            draggable: true,
            editable: true,
            zIndex: 1
        },
        polygonOptions: {
            fillColor: '#000000',
            fillOpacity: .3,
            strokeWeight: 4,
            strokeColor: '#000000',
            clickable: false,
            draggable: true,
            editable: true,
            zIndex: 1
        }
    });
    drawingManager.setMap(map);



    drawingManager.addListener('overlaycomplete', function (marker) {


        /*
         switch(marker.type) {
         case "circle": {
         var center = marker.getCenter();
         var radius = marker.getRadius();
         marker.setMap(null);

         marker = new google.maps.Circle({
         map: map,
         center: center,
         radius: radius
         });


         break;
         }

         }
         */
        id = "F" + savedFilters.length.toString();
        marker.id = id;

        /*
         marker.labelMarker = new google.maps.Marker({
         position: center,
         label: id,
         map: map
         });
         */

        savedFilters.push({
            type: marker.type,
            id: id,
            name: id,
            marker: marker
        });
        allMarkers.push(marker);
        loadFilters();
    });

    //document.getElementById("selectionButton0").style.background = "#4CAF50";

}

function newLogic () {
    savedLogic.push({
        "id": ("logic_" + savedLogic.length.toString()),
        "string": "text..."
    });
    loadFilters();
    if(savedLogic.length == 1) {
        selectLogic("logic_0");
    }
}

function clearFilters () {
  allMarkers.forEach (function(marker) {
      marker.overlay.setMap(null);
  });
  allMarkers = [];
  savedFilters = [];
  document.getElementById('filter-container').innerHTML = '';

}

function openModal(modalName) {
    var modal = document.getElementById(modalName);
    modal.style.display = "block";
}

function clearLogic () {
    savedLogic = [];
    document.getElementById('logic-container').innerHTML = '';
    selectedLogic = "";
}

function clearGraphs () {
    document.getElementById('graphs_container').innerHTML = '';
}

function deleteFilter(isFilter,i) {
    if(isFilter) {
        if(["circle","polygon","rectangle"].indexOf(savedFilters[i].type) != -1) {
            savedFilters[i].marker.overlay.setMap(null);
        }
        savedFilters.splice(i,1);
        loadFilters();
    } else {
        savedLogic.splice(i,1);
        loadFilters();
    }
}

/*

{
 "filters": {
     "point": [
         name: "",
         radius: 1,
         point: {
         lat: 1.1,
         lon: 1.1
         }
     ],
     "polygon": [
         {
             "name": "sdad",
             "points": [
                 {
                     "lon": 434.4343,
                     "lat": 43.43232
                 },
                 {

                 },
                 {

                 }
            ]
        }
     ],
     "date": [
         {
             name: "",
             start: "",
             end: ""
         }
     ],
     "signal": [
         {
             name: "",
             signal: 1,
             min: 1,
             max: 1
         }
     ]
 },

     "signal": "1",
     "interval": "100.0",
     "min": 500,
     "max": 5000
 }
 */

function convertFilter () {
    var returnFilters = {
        date: [],
        point: [],
        polygon: [],
        signal: [],
        road_temperature: [],
        friction: [],
        air_temperature: [],
        air_humidity: [],
        swimds: []
    };


    savedFilters.forEach( function (filter) {
        var type = filter.type;
        switch (type) {
            case "polygon": {
                pointsToOutput = [];
                filter.marker.overlay.getPath().getArray().forEach(function(element,index) {
                    pointsToOutput.push({
                        lon: element.lng(),
                        lat: element.lat()
                    });
                });

                returnFilters["polygon"].push({
                    name: filter.name,
                    points: pointsToOutput
                });
                break;
            }

            case "rectangle": {
                var bounds = filter.marker.overlay.getBounds();
                var ne = bounds.getNorthEast(); // LatLng of the north-east corner
                var sw = bounds.getSouthWest(); // LatLng of the south-west corder
                var nw = new google.maps.LatLng(ne.lat(), sw.lng());
                var se = new google.maps.LatLng(sw.lat(), ne.lng());

                returnFilters["polygon"].push({
                    name: filter.name,
                    points: [
                        {
                            lon: nw.lng(),
                            lat: nw.lat()
                        },

                        {
                            lon: ne.lng(),
                            lat: ne.lat()
                        },

                        {
                            lon: se.lng(),
                            lat: se.lat()
                        },

                        {
                            lon: sw.lng(),
                            lat: sw.lat()
                        }

                    ]
                });



                break;
            }

            case "circle": {
                returnFilters["point"].push({
                    name: filter.name,
                    radius: filter.marker.overlay.radius,
                    point: {
                        lon: filter.marker.overlay.center.lng(),
                        lat: filter.marker.overlay.center.lat()
                    }
                });
                break;
            }

            default: {
                returnFilters[filter.type].push(filter);
            }
        }

    });

    [["snow",6],["wet",3],["ice",5],["moist",2],["dry",1],["slush",4]].forEach(function(filterData) {
        returnFilters["swimds"].push({
            name: filterData[0],
            swimds: filterData[1]
        });
    });

    if(document.getElementById(selectedLogic) == null) {
        var exportLogic = "";
    } else {
        if(document.getElementById(selectedLogic).value == "text...") {
            exportLogic = "";
        } else {
            var exportLogic = document.getElementById(selectedLogic).value;
        }
    }

    for(var key in returnFilters){
        if(returnFilters[key].length == 0) {
            delete returnFilters[key];
        }
    }

    returnFilters = {
        filters: returnFilters,
        expression: exportLogic
    };

    return returnFilters;
}

function submit (graph) {
    var filters = convertFilter();

    console.log("Filters: " + JSON.stringify(filters));

    var api = new Api();
    api.request("swimds",filters,{
        onData: function(data) {
            //console.log(JSON.stringify(data));
            drawChart(graph,data);
        }
    });
}


function updateLogic () {
    savedLogic.forEach(function (logic) {
        var logicBox = document.getElementById(logic.id);
        if (logicBox != null) {
            logic.string = logicBox.value;
        }
    });
}


function loadFilters () {


    var elementCounter = 0;
    document.getElementById('filter-container').innerHTML = '';
    savedFilters.forEach (function (filter) {
        var element = document.createElement("div");
        var icon = document.createElement("img");
        //icon.src = '../assets/media/filter_map.png';


        switch(true) {
            case (["polygon","circle","rectangle"].indexOf(filter.type) != -1): icon.src = "http://simpleicon.com/wp-content/uploads/map-marker-8.png"; break;
            case (["date"].indexOf(filter.type) != -1): icon.src = "../../assets/media/date.png"; break;
            case (["air_temperature"].indexOf(filter.type) != -1): icon.src = "../../assets/media/air_temp.png"; break;
            case (["road_temperature"].indexOf(filter.type) != -1): icon.src = "../../assets/media/road_temp.png"; break;
            case (["air_humidity"].indexOf(filter.type) != -1): icon.src = "../../assets/media/humidity.png"; break;
            case (["signal"].indexOf(filter.type) != -1): icon.src = "../../assets/media/signal.png"; break;
            case (["friction"].indexOf(filter.type) != -1): icon.src = "../../assets/media/signal.png"; break;
            default: icon.innerHTML = "??"; break;
        }


        //When someone clicks on a created filter.
        /* WORK IN PROGRESS, UPDATE FILTERS.
        element.onclick = function() {
           // console.log(this.id);
            openModal("update_filter_modal");
            viewSavedFilter(savedFilters[this.id]);
        }; */



        var closeButton = document.createElement("button");
        closeButton.value = elementCounter;
        closeButton.onclick = function() {
            deleteFilter(true,this.value);
        };


        element.appendChild(icon);
        element.appendChild(document.createTextNode(filter.name));
        element.appendChild(closeButton);
        document.getElementById('filter-container').appendChild(element);

        element.id = elementCounter;    //this is the index in the list
        elementCounter++;
    });

    updateLogic();

    elementCounter = 0;
    document.getElementById('logic-container').innerHTML = '';
    savedLogic.forEach (function (logic) {
        var logicElement = document.createElement("div");
        var logicIcon = document.createElement("img");
        var textField = document.createElement("input");
        textField.value = logic.string;
        textField.id = logic.id;
        if(selectedLogic == logic.id) {
            logicIcon.src = "../assets/media/logic_green.png";
        } else {
            logicIcon.src = "../assets/media/logic.png";
        }

        logicIcon.addEventListener('click', function (e) {
            selectLogic(logic.id);
        });
        logicIcon.id = "icon_" + logic.id;

        /*var closeButton = document.createElement("button");
        closeButton.value = elementCounter;
        closeButton.onclick = function() {
            deleteFilter(false,this.value);
        };*/

        logicElement.appendChild(logicIcon);
        logicElement.appendChild(textField);
        //logicElement.appendChild(closeButton);
        document.getElementById('logic-container').appendChild(logicElement);
        elementCounter++;
    });
}



function selectLogic(logicID) {
    if(selectedLogic == logicID) {
        selectedLogic = "";
        heatmap.replace([]);
    } else {
        selectedLogic = logicID;

        var theFilter = convertFilter();
        visiblePoints = new VisiblePoints(map, theFilter);

        visiblePoints.getVisiblePoints();
        visiblePoints.onGooglePoints = function() {
            heatmap.replace(this.googlePoints);
        };

        /*
        var api = new Api();
        var theFilter = convertFilter();
        api.request("points", theFilter, {
            onData: function(data) {
                console.log(data);
                heatmap.replace(data);
            }
        });
        */

    }
    loadFilters();
}

function saveFilter(filterObj) {
    filterObj.name = "F" + savedFilters.length.toString();
    savedFilters.push(filterObj);
    loadFilters();
}


function toggleMenu (btn) {
    //$('submit1').height($('submit1').width());
    var submitButton = document.getElementById('submit1');
    //console.log(JSON.stringify($('submit1').height()));
    submitButton.style.width = submitButton.style.height.toString();
    $(btn).toggleClass("menu-button-open");
    $("#side-nav").toggleClass("side-nav-open");

}

function toggleGraphs (btn) {
    $(btn).toggleClass("graphs-button-open");
    $("#graphs_div").toggleClass("graphs-div-open");
}
