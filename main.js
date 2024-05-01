window.onload = init



function init(){

    
    
    // adding controls = creating objects than will be put in controls extend of main map class
    // creating full screen button control and giving it label
    const fullScreenControl = new ol.control.FullScreen({
        tipLabel: "Full screen button"
    });
    // creating object for overview map window
    const overViewMapControl = new ol.control.OverviewMap({
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ]
    });//closing overview object
    const scaleLineControl = new ol.control.ScaleLine();
    const zoomSliderControl = new ol.control.ZoomSlider();
    // does not work how i want !! const zoomToExtentControl = new ol.control.ZoomToExtent();

   
    //defining main map class and giving it center, zooms and extent of the map through ol.view class
    const map = new ol.Map({
        view: new ol.View({
            center: [2279653.7662231475, 5590142.462275695],
            zoom: 11,
            minZoom: 1,
            maxZoom: 18,
            // extent: [2204090.819137, 5556339.062366, 2344999.664595, 5623684.661251]
        }),
        target:"js-map",
        
        // adding new controls to default controls
        controls: ol.control.defaults().extend([
            fullScreenControl,
            overViewMapControl,
            scaleLineControl,
            zoomSliderControl,

        ])
      
       
    }) // map class
    
    
    
    // Defining base layers, giving them title so we can connect them to the side bar in html
    //OSM Standard basemap
    const osmStandard =  new ol.layer.Tile({
        source: new ol.source.OSM(),
        visible: false,
        title: 'osmStandard'
    });
    //OSM Humanitarian basemap
    const osmHumanitarian = new ol.layer.Tile({
        source: new ol.source.OSM({
            url: 'https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
        }),
        visible: false,
        title: 'osmHumanitarian'
    });
    // BingMaps basemap
    const bingMaps = new ol.layer.Tile({
        source: new ol.source.BingMaps({
            key: "AkqWGGYpZ1eMISFHfZPH7cu_0GoWbCuyTdUdFPSTm4QfbGuT58W3LIF5Lk_fTuWr",
            imagerySet: 'Aerial',
        }),
        visible: false,
        title: 'bingMaps'
    });
    // Google Satellite basemap
    const googleSatellite = new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}'
        }),
        opacity: 0.5,
        visible: false,
        title: 'googleSatellite'
      })



    // Basemaps Layer groups
    const baseLayerGroup = new ol.layer.Group({
        layers: [
           osmStandard, osmHumanitarian, bingMaps, googleSatellite
        ]
    });
    map.addLayer(baseLayerGroup);

    // Layer swicher - not 100% clear how this works *****
    const baseLayerElements = document.querySelectorAll('.sidebar > input[type=radio]')
    for(let baseLayerElement of baseLayerElements){
        baseLayerElement.addEventListener('change',function(){
           let baseLayerElementValue = this.value;
           baseLayerGroup.getLayers().forEach(function(element, index, array){
            let baseLayerName = element.get('title');
            element.setVisible(baseLayerName === baseLayerElementValue)
           })
        })
    }


    // Style vector layers, last in the fill array is opacity
    // point styling!!!! differs from others, using image as an option of your style!
    const fillStyleBoundary = new ol.style.Fill({
        color: [100,100,100,0]
     });
     const fillStyleBatman = new ol.style.Fill({
        color: [0,0,0,1]
     });
     const strokeStyleBoundary = new ol.style.Stroke({
        color: [45,45,45,1],
        width: 3,
        lineDash: [1,5]
     });
     const strokeStyleMunicipalBoundary = new ol.style.Stroke({
        color: [45,45,45,1],
        width: 0.2,
        
     });
     const BuildingsStyle = new ol.style.RegularShape({
        fill: new ol.style.Fill({
            color: [41,71,223,0]
        }),
        stroke: new ol.style.Stroke({
            color: [41,71,223,0]
         }),
        points: 30,
        radius: 3
     })

     const BuildingsClusterStyle = new ol.style.RegularShape({
        fill: new ol.style.Fill({
            color: [41,71,223,1]
        }),
        stroke: new ol.style.Stroke({
            color: [41,71,223,1]
         }),
        points: 30,
        radius: 3
     })



     const circleDistanceMultiplier = 1;
     const circleFootSeparation = 28;
     const circleStartAngle = Math.PI / 2;
     
     const convexHullFill = new ol.style.Fill({
       color: 'rgba(0, 153, 255, 0.4)',
     });
     const convexHullStroke = new ol.style.Stroke({
       color: 'rgba(102, 153, 0, 0.5)',
       width: 1.5,
     });
     const outerCircleFill = new ol.style.Fill({
       color: 'rgba(102, 153, 0, 0.3)',
     });
     const innerCircleFill = new ol.style.Fill({
       color: 'rgba(0, 165, 255, 0.7)',
     });
     const textFill = new ol.style.Fill({
       color: '#fff',
     });
     const textStroke = new ol.style.Stroke({
       color: 'rgba(0, 0, 0, 0.6)',
       width: 3,
     });
     const innerCircle = new ol.style.Circle({
       radius: 14,
       fill: innerCircleFill,
     });
     const outerCircle = new ol.style.Circle({
       radius: 20,
       fill: outerCircleFill,
     });
     
     const darkIcon = new ol.style.Icon({
       src: './data/emoticon-cool.svg',
     });
     const lightIcon = new ol.style.Icon({
       src: './data/emoticon-cool-outline.svg',
     });
     
     /**
      * Single feature style, users for clusters with 1 feature and cluster circles.
      * @param {Feature} clusterMember A feature from a cluster.
      * @return {Style} An icon style for the cluster member's location.
      */
     function clusterMemberStyle(clusterMember) {
       return new ol.style.Style({
         geometry: clusterMember.getGeometry(),
         image: clusterMember.get('LEISTUNG') > 5 ? BuildingsClusterStyle : BuildingsClusterStyle,
       });
     }
     
     let clickFeature, clickResolution;
     /**
      * Style for clusters with features that are too close to each other, activated on click.
      * @param {Feature} cluster A cluster with overlapping members.
      * @param {number} resolution The current view resolution.
      * @return {Style} A style to render an expanded view of the cluster members.
      */
    function clusterCircleStyle(cluster, resolution) {
       if (cluster !== clickFeature || resolution !== clickResolution) {
         return;
       }
       const clusterMembers = cluster.get('features');
       const centerCoordinates = cluster.getGeometry().getCoordinates();
       return generatePointsCircle(
         clusterMembers.length,
         cluster.getGeometry().getCoordinates(),
         resolution
       ).reduce((styles, coordinates, i) => {
         const point = new Point(coordinates);
         const line = new LineString([centerCoordinates, coordinates]);
         styles.unshift(
           new Style({
             geometry: line,
             stroke: convexHullStroke,
           })
         );
         styles.push(
           clusterMemberStyle(
             new ol.Feature({
               ...clusterMembers[i].getProperties(),
               geometry: point,
             })
           )
         );
         return styles;
       }, []);
    }
     
     /**
      * From
      * https://github.com/Leaflet/Leaflet.markercluster/blob/31360f2/src/MarkerCluster.Spiderfier.js#L55-L72
      * Arranges points in a circle around the cluster center, with a line pointing from the center to
      * each point.
      * @param {number} count Number of cluster members.
      * @param {Array<number>} clusterCenter Center coordinate of the cluster.
      * @param {number} resolution Current view resolution.
      * @return {Array<Array<number>>} An array of coordinates representing the cluster members.
      */
     function generatePointsCircle(count, clusterCenter, resolution) {
       const circumference =
         circleDistanceMultiplier * circleFootSeparation * (2 + count);
       let legLength = circumference / (Math.PI * 2); //radius from circumference
       const angleStep = (Math.PI * 2) / count;
       const res = [];
       let angle;
     
       legLength = Math.max(legLength, 35) * resolution; // Minimum distance to get outside the cluster icon.
     
       for (let i = 0; i < count; ++i) {
         // Clockwise, like spiral.
         angle = circleStartAngle + i * angleStep;
         res.push([
           clusterCenter[0] + legLength * Math.cos(angle),
           clusterCenter[1] + legLength * Math.sin(angle),
         ]);
       }
     
       return res;
     }
     
     let hoverFeature;
    
     
    /**function from:  */
     function monotoneChainConvexHull(points, options = {}) {
        if (!options.sorted) {
            points.sort(byXThenY);
        }
    
        const n = points.length;
        const result = new Array(n * 2);
        var k = 0;
    
        for (var i = 0; i < n; i++) {
            const point = points[i];
            while (k >= 2 && cw(result[k - 2], result[k - 1], point) <= 0) {
                k--;
            }
            result[k++] = point;
        }
    
        const t = k + 1;
        for (i = n - 2; i >= 0; i--) {
            const point = points[i];
            while (k >= t && cw(result[k - 2], result[k - 1], point) <= 0) {
                k--;
            }
            result[k++] = point;
        }
    
        return result.slice(0, k - 1);
    }
    
    function cw(p1, p2, p3) {
        return (p2[1] - p1[1]) * (p3[0] - p1[0]) - (p2[0] - p1[0]) * (p3[1] - p1[1]);
    }
    
    function byXThenY(point1, point2) {
        if (point1[0] === point2[0]) {
            return point1[1] - point2[1];
        }
        return point1[0] - point2[0];
    }
     

    // This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
// Variable to hold current primary touch event identifier.
// iOS needs this since it does not attribute
// identifier 0 to primary touch event.
var primaryTouchId = null;
// Variable to hold mouse pointer captures.
var mouseCaptureTarget = null;
if (!("PointerEvent" in window)) {
    // Define {set,release}PointerCapture
    definePointerCapture();
    // Create Pointer polyfill from mouse events only on non-touch device
    if (!("TouchEvent" in window)) {
        addMouseToPointerListener(document, "mousedown", "pointerdown");
        addMouseToPointerListener(document, "mousemove", "pointermove");
        addMouseToPointerListener(document, "mouseup", "pointerup");
    }
    // Define Pointer polyfill from touch events
    addTouchToPointerListener(document, "touchstart", "pointerdown");
    addTouchToPointerListener(document, "touchmove", "pointermove");
    addTouchToPointerListener(document, "touchend", "pointerup");
}
// Function defining {set,release}PointerCapture from {set,releas}Capture
function definePointerCapture() {
    Element.prototype.setPointerCapture = Element.prototype.setCapture;
    Element.prototype.releasePointerCapture = Element.prototype.releaseCapture;
}
// Function converting a Mouse event to a Pointer event.
function addMouseToPointerListener(target, mouseType, pointerType) {
    target.addEventListener(mouseType, function (mouseEvent) {
        var pointerEvent = new MouseEvent(pointerType, mouseEvent);
        pointerEvent.pointerId = 1;
        pointerEvent.isPrimary = true;
        pointerEvent.pointerType = "mouse";
        pointerEvent.width = 1;
        pointerEvent.height = 1;
        pointerEvent.tiltX = 0;
        pointerEvent.tiltY = 0;
        // pressure is 0.5 if a button is holded
        "buttons" in mouseEvent && mouseEvent.buttons !== 0
            ? (pointerEvent.pressure = 0.5)
            : (pointerEvent.pressure = 0);
        // if already capturing mouse event, transfer target
        // and don't forget implicit release on mouseup.
        var target = mouseEvent.target;
        if (mouseCaptureTarget !== null) {
            target = mouseCaptureTarget;
            if (mouseType === "mouseup") {
                mouseCaptureTarget = null;
            }
        }
        target.dispatchEvent(pointerEvent);
        if (pointerEvent.defaultPrevented) {
            mouseEvent.preventDefault();
        }
    });
}
// Function converting a Touch event to a Pointer event.
function addTouchToPointerListener(target, touchType, pointerType) {
    target.addEventListener(touchType, function (touchEvent) {
        var changedTouches = touchEvent.changedTouches;
        var nbTouches = changedTouches.length;
        for (var t = 0; t < nbTouches; t++) {
            var pointerEvent = new CustomEvent(pointerType, {
                bubbles: true,
                cancelable: true
            });
            pointerEvent.ctrlKey = touchEvent.ctrlKey;
            pointerEvent.shiftKey = touchEvent.shiftKey;
            pointerEvent.altKey = touchEvent.altKey;
            pointerEvent.metaKey = touchEvent.metaKey;
            var touch = changedTouches.item(t);
            pointerEvent.clientX = touch.clientX;
            pointerEvent.clientY = touch.clientY;
            pointerEvent.screenX = touch.screenX;
            pointerEvent.screenY = touch.screenY;
            pointerEvent.pageX = touch.pageX;
            pointerEvent.pageY = touch.pageY;
            var rect = touch.target.getBoundingClientRect();
            pointerEvent.offsetX = touch.clientX - rect.left;
            pointerEvent.offsetY = touch.clientY - rect.top;
            pointerEvent.pointerId = 1 + touch.identifier;
            // Default values for standard MouseEvent fields.
            pointerEvent.button = 0;
            pointerEvent.buttons = 1;
            pointerEvent.movementX = 0;
            pointerEvent.movementY = 0;
            pointerEvent.region = null;
            pointerEvent.relatedTarget = null;
            pointerEvent.x = pointerEvent.clientX;
            pointerEvent.y = pointerEvent.clientY;
            // Pointer event details
            pointerEvent.pointerType = "touch";
            pointerEvent.width = 1;
            pointerEvent.height = 1;
            pointerEvent.tiltX = 0;
            pointerEvent.tiltY = 0;
            pointerEvent.pressure = 1;
            // First touch is the primary pointer event.
            if (touchType === "touchstart" && primaryTouchId === null) {
                primaryTouchId = touch.identifier;
            }
            pointerEvent.isPrimary = touch.identifier === primaryTouchId;
            // If first touch ends, reset primary touch id.
            if (touchType === "touchend" && pointerEvent.isPrimary) {
                primaryTouchId = null;
            }
            touchEvent.target.dispatchEvent(pointerEvent);
            if (pointerEvent.defaultPrevented) {
                touchEvent.preventDefault();
            }
        }
    });
}
//# sourceMappingURL=elm-pep.js.map

     function clusterHullStyle(cluster) {
       if (cluster !== hoverFeature) {
         return;
       }
       const originalFeatures = cluster.get('features');
       const points = originalFeatures.map((feature) =>
         feature.getGeometry().getCoordinates()
       );
       return new ol.style.Style({
         geometry: new ol.geom.Polygon([monotoneChainConvexHull(points)]),
         fill: convexHullFill,
         stroke: convexHullStroke,
       });
     }
     
     function clusterStyle(feature) {
       const size = feature.get('features').length;
       if (size > 1) {
         return [
           new ol.style.Style({
             image: outerCircle,
           }),
           new ol.style.Style({
             image: innerCircle,
             text: new ol.style.Text({
               text: size.toString(),
               fill: textFill,
               stroke: textStroke,
             }),
           }),
         ];
       }
       const originalFeature = feature.get('features')[0];
       return clusterMemberStyle(originalFeature);
     }
     
     
     
     // layers definition
     const BuildingsVectorSource = new ol.source.Vector({
        
            format: new ol.format.GeoJSON(),
            url: './data/all_buildings.geojson',
        
     });
     const BuildingsClusterSource = new ol.source.Cluster({
       attributions:
       './data/all_buildings.geojson', 
       distance: 35,
       source: BuildingsVectorSource,
     });
     
     // Layer displaying the convex hull of the hovered cluster.
     const clusterHulls = new ol.layer.Vector({
        source: BuildingsClusterSource,
        style: clusterHullStyle,
        title: 'clustersHulls',
     });
     
     // Layer displaying the clusters and individual features.
     const clusters = new ol.layer.Vector({
       source: BuildingsClusterSource,
       style: clusterStyle,
       title: 'clusters',
     });
     
     // Layer displaying the expanded view of overlapping cluster members.
     const clusterCircles = new ol.layer.Vector({
       source: BuildingsClusterSource,
       style: clusterCircleStyle,
       title: 'clustersCircles',
     });
     

    // Style vector layers, last in the fill array is opacity
    // point styling!!!! differs from others, using image as an option of your style!


    // Defining vector layers hosted local as geojson
    const belgradeBoundaryLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            url: './data/belgrade_boundary.geojson',
        }),
        crossOrigin: null,
        visible: true,
        title: 'belgradeBoundaryLayer',
        style: new ol.style.Style({
            fill: fillStyleBoundary,
            stroke: strokeStyleBoundary
           
        })
     });
     const municipalBoundaryLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            url: './data/municipal_boundary.geojson',
        }),
        crossOrigin: null,
        visible: true,
        title: 'municipalBoundaryLayer',
        style: new ol.style.Style({
            fill: fillStyleBoundary,
            stroke: strokeStyleMunicipalBoundary
           
        })
     });
    
     const buildings = new ol.layer.Vector({
        source: new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            url: './data/all_buildings.geojson',
        }),
        visible: true,
        title: 'Buildings',
        style: new ol.style.Style({
            image: BuildingsStyle
        })
     });
     const batman = new ol.layer.Vector({
        source: new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            url: './data/batman.geojson',
        }),
        visible: false,
        title: 'batman',
        style: new ol.style.Style({
            fill: fillStyleBatman,
            stroke: strokeStyleMunicipalBoundary
           
        })
     });
     
     // Vector layers group
     const vectorLayerGroup = new ol.layer.Group({
        layers:[
            belgradeBoundaryLayer, municipalBoundaryLayer, buildings, clusterHulls, clusters, clusterCircles, batman
        ]
     })
     map.addLayer(vectorLayerGroup);

     // Vector layer switcher logic, ceating new variable which will corresponds to the checkboxes in the layer list
     //creating another variable and putting in it the value of event listener function
     //adding event listeners when checkers changes, when 'change' than do what is specifed in the function
     const vectorLayerElements = document.querySelectorAll('.sidebar > input[type=checkbox]');
     for(let vectorLayerElement of vectorLayerElements){
        vectorLayerElement.addEventListener('change', function(){
            let vectorLayerElementValue = this.value;
            let vectorLayer;

            vectorLayerGroup.getLayers().forEach(function(element, index, array){
                if(vectorLayerElementValue === element.get('title')){
                    vectorLayer = element;
                }

            })
            this.checked ? vectorLayer.setVisible(true) : vectorLayer.setVisible(false)
        })
     }




    // connecting overlay to html DOM
    const container = document.getElementById('popup');
    const content = document.getElementById('popup-content');
    const closer = document.getElementById('popup-closer');

    const overlayPopup = new ol.Overlay({
        element: container
    });
    map.addOverlay(overlayPopup);



    // pop up logic 
    map.on('dblclick',function(e){
        const feature = map.forEachFeatureAtPixel(e.pixel, function(feature,layer){
            if (layer == buildings){
                return feature;
            }
        });
        if(feature){
            var popupContent = '<h3>' + 'Building information' + '</h3>';
            popupContent += '<p> Type: ' + feature.get('amenity') + '<p>';
            popupContent += '<p> Name: ' + feature.get('name') + '<p>';
            popupContent += '<p> Routes: ' + feature.get('routes') + '<p>';
            popupContent += '<p> Elevators: ' + feature.get('elevators') + '<p>';
            popupContent += '<p> Parking: ' + feature.get('parking') + '<p>';
            popupContent += '<p> Ramps: ' + feature.get('ramps') + '<p>';
            popupContent += '<p> Entrances: ' + feature.get('entrances') + '<p>';
            popupContent += '<p> Restrooms: ' + feature.get('restrooms') + '<p>';

            content.innerHTML = popupContent;
            const coordinate =e.coordinate;
            overlayPopup.setPosition(coordinate);
        }
     })

     closer.onclick = function(){
        overlayPopup.setPosition(undefined)
     }

    
     
     
     map.on('pointermove', (event) => {
       clusters.getFeatures(event.pixel).then((features) => {
         if (features[0] !== hoverFeature) {
           // Display the convex hull on hover.
           hoverFeature = features[0];
           clusterHulls.setStyle(clusterHullStyle);
           // Change the cursor style to indicate that the cluster is clickable.
           map.getTargetElement().style.cursor =
             hoverFeature && hoverFeature.get('features').length > 1
               ? 'pointer'
               : '';
         }
       });
     });
     
      
      map.on('click', (event) => {
        clusters.getFeatures(event.pixel).then((features) => {
          if (features.length > 0) {
            const clusterMembers = features[0].get('features');
            if (clusterMembers.length > 1) {
              // Calculate the extent of the cluster members.
              const extent = ol.extent.createEmpty();
              clusterMembers.forEach((feature) =>
                ol.extent.extend(extent, feature.getGeometry().getExtent())
              );
              const view = map.getView();
              const resolution = map.getView().getResolution();
              if (
                view.getZoom() === view.getMaxZoom() ||
                (ol.extent.getWidth(extent) < resolution && ol.extent.getHeight(extent) < resolution)
              ) {
                // Show an expanded view of the cluster members.
                clickFeature = features[0];
                clickResolution = resolution;
                clusterCircles.setStyle(clusterCircleStyle);
              } else {
                // Zoom to the extent of the cluster members.
                view.fit(extent, {duration: 500, padding: [50, 50, 50, 50]});
              }
            }
          }
        });
      });















      

// Declare variables for GeoJSON and feature overlay
var geojson;
var featureOverlay;

// Get the button element with ID 'myButtonDiv'
var qryElement = document.getElementById('myButtonDiv');

// Set the flag for attribute query to false initially
var qryFlag = false;

// Add event listener for click on the query button
qryButton.addEventListener("click", () => {
  // Toggle the class of the button
  qryButton.classList.toggle('clicked');

  // Toggle the flag
  qryFlag = !qryFlag;

  // Set the cursor style to default
  document.getElementById("js-map").style.cursor = "default";

  // If attribute query is enabled
  if (qryFlag) {
    // Clear existing GeoJSON and feature overlay
    if (geojson) {
      geojson.getSource().clear();
      map.removeLayer(geojson);
    }
    if (featureOverlay) {
      featureOverlay.getSource().clear();
      map.removeLayer(featureOverlay);
    }

    // Display the attribute query div
    document.getElementById("attQueryDiv").style.display = "block";

    // Set the identify flag to false
    bolIdentify = false;

    // Add map layer list
    addMapLayerList();
  } else { // If attribute query is disabled
    // Hide the attribute query and attribute list divs
    document.getElementById("attQueryDiv").style.display = "none";
    document.getElementById("attListDiv").style.display = "none";

    // Clear existing GeoJSON and feature overlay
    if (geojson) {
      geojson.getSource().clear();
      map.removeLayer(geojson);
    }
    if (featureOverlay) {
      featureOverlay.getSource().clear();
      map.removeLayer(featureOverlay);
    }
  }
});

// Function to add map layer list
function addMapLayerList() {
  // On document ready
  $(document).ready(function () {
    // Send GET request to GeoServer for capabilities
    $.ajax({
      type: "GET",
      url: "http://localhost:8081/geoserver/wfs?request=getCapabilities",
      dataType: "xml",
      success: function (xml) {
        // Get the select element for map layer
        var select = $('#selectLayer');

        // Add an empty option
        select.append("<option class='ddindent' value=''></option>");

        // For each FeatureType element in the XML
        $(xml).find('FeatureType').each(function () {
          // Get the Name element
          $(this).find('Name').each(function () {
            var value = $(this).text();
            // Add an option with the name value
            select.append("<option class='ddindent' value='" + value + "'>" + value + "</option>");
          });
        });
      }
    });
  });
}

$(function () {

    // Event listener for layer selection dropdown
    document.getElementById("selectLayer").onchange = function () {

        // Clear attribute selection dropdown
        var select = document.getElementById("selectAttribute");
        while (select.options.length > 0) {
            select.remove(0);
        }

        // Get the selected layer value
        var value_layer = $(this).val();

        // Make an AJAX request to get the feature type description
        $(document).ready(function () {
            $.ajax({
                type: "GET",
                url: "http://localhost:8081/geoserver/wfs?service=WFS&request=DescribeFeatureType&version=1.1.0&typeName=" + value_layer,
                dataType: "xml",
                success: function (xml) {

                    // Populate attribute selection dropdown with attributes from feature type description
                    var select = $('#selectAttribute');
                    select.append("<option class='ddindent' value=''></option>");
                    $(xml).find('xsd\\:sequence').each(function () {
                        $(this).find('xsd\\:element').each(function () {
                            var value = $(this).attr('name');
                            var type = $(this).attr('type');
                            if (value != 'geom' && value != 'the_geom') {
                                select.append("<option class='ddindent' value='" + type + "'>" + value + "</option>");
                            }
                        });
                    });
                }
            });
        });
    }

    // Event listener for attribute selection dropdown
    document.getElementById("selectAttribute").onchange = function () {

        // Clear operator selection dropdown
        var operator = document.getElementById("selectOperator");
        while (operator.options.length > 0) {
            operator.remove(0);
        }

        // Get the selected attribute type
        var value_type = $(this).val();

        // Get the selected attribute name
        var value_attribute = $('#selectAttribute option:selected').text();

        // Populate operator selection dropdown based on attribute type
        operator.options[0] = new Option('Select operator', "");
        if (value_type == 'xsd:short' || value_type == 'xsd:int' || value_type == 'xsd:double') {
            var operator1 = document.getElementById("selectOperator");
            operator1.options[1] = new Option('Greater than', '>');
            operator1.options[2] = new Option('Less than', '<');
            operator1.options[3] = new Option('Equal to', '=');
        }
        else if (value_type == 'xsd:string') {
            var operator1 = document.getElementById("selectOperator");
            operator1.options[1] = new Option('Like', 'Like');
            operator1.options[2] = new Option('Equal to', '=');
        }
    }

    // This function is assigned to the click event of the "attQryRun" button
    document.getElementById('attQryRun').onclick = function () {
        // Set a property in the "map" object to indicate that data is being loaded
        map.set("isLoading", 'YES');

        // Clear the featureOverlay source and remove the layer from the map, if it exists
        if (featureOverlay) {
            featureOverlay.getSource().clear();
            map.removeLayer(featureOverlay);
        }

        // Get the selected values from the drop-down lists and input box
        var layer = document.getElementById("selectLayer");
        var attribute = document.getElementById("selectAttribute");
        var operator = document.getElementById("selectOperator");
        var txt = document.getElementById("enterValue");

        // Validate that all required inputs are selected/entered
        if (layer.options.selectedIndex == 0) {
            alert("Select Layer");
        } else if (attribute.options.selectedIndex == -1) {
            alert("Select Attribute");
        } else if (operator.options.selectedIndex <= 0) {
            alert("Select Operator");
        } else if (txt.value.length <= 0) {
            alert("Enter Value");
        } else {
            // Build a URL for querying the WFS service using the selected inputs
            var value_layer = layer.options[layer.selectedIndex].value;
            var value_attribute = attribute.options[attribute.selectedIndex].text;
            var value_operator = operator.options[operator.selectedIndex].value;
            var value_txt = txt.value;
            if (value_operator == 'Like') {
                value_txt = "%25" + value_txt + "%25";
            } else {
                value_txt = value_txt;
            }
            var url = "http://localhost:8081/geoserver/belgrade_postgres/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=" + value_layer + "&CQL_FILTER=" + value_attribute + "+" + value_operator + "+'" + value_txt + "'&outputFormat=application/json"
            
            // Call the "newaddGeoJsonToMap" function to add the queried data to the map
            newaddGeoJsonToMap(url);
            
            // Populate the query table with the queried data
            newpopulateQueryTable(url);
            
            // Add click event handlers to the query table rows
            setTimeout(function () { newaddRowHandlers(url); }, 300);
            
            // Set the "isLoading" property in the "map" object to indicate that data loading is complete
            map.set("isLoading", 'NO');
        }
    }
    });

    // This function adds a GeoJSON layer to the map based on the queried data
    function newaddGeoJsonToMap(url) {
        // Clear the existing GeoJSON layer and remove it from the map
        if (geojson) {
            geojson.getSource().clear();
            map.removeLayer(geojson);
        }

        // Define a style for the GeoJSON layer
        var style = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#FFFF00',
                width: 3
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#FFFF00'
                })
            })
        });

        // Create a new GeoJSON layer with the queried data and add it to the map
        geojson = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: url,
                format: new ol.format.GeoJSON()
            }),
            style: style,
        });

        // Fit the map view to the extent of the GeoJSON

        geojson.getSource().on('addfeature', function () {
            map.getView().fit(
                geojson.getSource().getExtent(),
                { duration: 1590, size: map.getSize(), maxZoom: 21 }
            );
        });
        map.addLayer(geojson);
    };

// This function takes in a URL parameter and populates a table on the page with data from that URL.
function newpopulateQueryTable(url) {
    // Check if the attributePanel variable is defined and if its parent element is not null.
    if (typeof attributePanel !== 'undefined') {
        if (attributePanel.parentElement !== null) {
            // Close the attributePanel if it exists and has a parent element.
            attributePanel.close();
        }
    }

    // Make an AJAX call to the specified URL to get the data.
    $.getJSON(url, function (data) {
        // Create an array to hold the column headers for the table, starting with 'id'.
        var col = [];
        col.push('id');

        // Loop through each feature in the data to find all the properties and add them to the column array if they aren't already there.
        for (var i = 0; i < data.features.length; i++) {
            for (var key in data.features[i].properties) {
                if (col.indexOf(key) === -1) {
                    col.push(key);
                }
            }
        }

        // Create a new table element and set its attributes.
        var table = document.createElement("table");
        table.setAttribute("class", "table table-bordered table-hover table-condensed");
        table.setAttribute("id", "attQryTable");

        // Create the table header row by looping through the column array and creating a new table header element for each column.
        var tr = table.insertRow(-1);
        for (var i = 0; i < col.length; i++) {
            var th = document.createElement("th");
            th.innerHTML = col[i];
            tr.appendChild(th);
        }

        // Populate the table with data by looping through each feature and adding a new row to the table for each feature. Then, for each row, loop through each column and add a new cell to the row for each column.
        for (var i = 0; i < data.features.length; i++) {
            tr = table.insertRow(-1);
            for (var j = 0; j < col.length; j++) {
                var tabCell = tr.insertCell(-1);
                if (j == 0) {
                    // If this is the first column (i.e. the 'id' column), populate the cell with the feature's 'id' property.
                    tabCell.innerHTML = data.features[i]['id'];
                } else {
                    // Otherwise, populate the cell with the value of the corresponding property for this feature.
                    tabCell.innerHTML = data.features[i].properties[col[j]];
                }
            }
        }

        // Get a reference to the container element for the table.
        var tabDiv = document.getElementById('attListDiv');

        // Remove any existing table element from the container element (if one exists).
        var delTab = document.getElementById('attQryTable');
        if (delTab) {
            tabDiv.removeChild(delTab);
        }

        // Add the new table element to the container element.
        tabDiv.appendChild(table);

        // Display the container element (which should now contain the table).
        document.getElementById("attListDiv").style.display = "block";
    });
};

// Define a style for highlighting features on the map
var highlightStyle = new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255,0,255,0.3)',
    }),
    stroke: new ol.style.Stroke({
        color: '#FF00FF',
        width: 3,
    }),
    image: new ol.style.Circle({
        radius: 10,
        fill: new ol.style.Fill({
            color: '#FF00FF'
        })
    })
});

// Create a new vector layer to overlay on the map for highlighting selected features
var featureOverlay = new ol.layer.Vector({
    source: new ol.source.Vector(),
    map: map,
    style: highlightStyle
});

// Add event handlers to each row in the attribute query table
function newaddRowHandlers() {
    var table = document.getElementById("attQryTable");
    var rows = document.getElementById("attQryTable").rows;
    var heads = table.getElementsByTagName('th');
    var col_no;
    for (var i = 0; i < heads.length; i++) {
        // Find the column number of the 'id' field
        var head = heads[i];
        if (head.innerHTML == 'id') {
            col_no = i + 1;
        }
    }
    for (i = 0; i < rows.length; i++) {
        rows[i].onclick = function () {
            return function () {
                // Clear any existing features from the highlight layer
                featureOverlay.getSource().clear();

                // Reset the background color of all rows in the table to white
                $(function () {
                    $("#attQryTable td").each(function () {
                        $(this).parent("tr").css("background-color", "white");
                    });
                });

                // Highlight the row of the clicked feature by setting its background color
                var cell = this.cells[col_no - 1];
                var id = cell.innerHTML;
                $(document).ready(function () {
                    $("#attQryTable td:nth-child(" + col_no + ")").each(function () {
                        if ($(this).text() == id) {
                            $(this).parent("tr").css("background-color", "#d1d8e2");
                        }
                    });
                });

                // Get all the features from the GeoJSON source
                var features = geojson.getSource().getFeatures();

                // Loop through all the features to find the one with the same ID as the clicked row
                for (i = 0; i < features.length; i++) {
                    if (features[i].getId() == id) {
                        // Add the matching feature to the highlight layer
                        featureOverlay.getSource().addFeature(features[i]);

                        // Fit the map view to the extent of the highlight layer with a maximum zoom of 24
                        featureOverlay.getSource().on('addfeature', function () {
                            map.getView().fit(
                                featureOverlay.getSource().getExtent(),
                                { duration: 1500, size: map.getSize(), maxZoom: 24 }
                            );
                        });
                    }
                }
            };
        }(rows[i]);
    }
}

// end : attribute query




      
      
      
     
} // whole code