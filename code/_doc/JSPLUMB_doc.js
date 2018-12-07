// jsPlumb has no external dependencies
// The 1.7.x line of releases were the last ones to support IE8. 
// From version 2.0.0, the Community edition works only in modern browsers that support SVG.


// jsPlumb is registered on the browser's window by default, providing one static instance for the whole page to use. 
// You can also instantiate independent instances of jsPlumb, using the getInstance method, for example:
// var firstInstance = jsPlumb.getInstance();
// The variable firstInstance can now be treated exactly as you would treat the jsPlumb variable.
// So, you can set defaults, call the connect method, whatever
// getInstance optionally takes an object that provides the defaults
// HTML DOC REFERENCE : https://jsplumbtoolkit.com/community/doc/home.html#multiple
// It is recommended to use separate instances of jsPlumb wherever possible.


// for a list of default values that can be set, referring to an instance
// REFERENCE: https://jsplumbtoolkit.com/community/doc/defaults.html

// You should not start making calls to jsPlumb until the DOM has been initialized (no surprise)
// HTML DOC REFERENCE https://jsplumbtoolkit.com/community/doc/home.html
jsPlumb.ready(function() {

    //You should instruct jsPlumb to use an element as the parent of everything jsPlumb adds to the UI
    //jsPlumb.setContainer(document.getElementById("container"));

    // DRAGGABLE - REFERENCE: https://jsplumbtoolkit.com/community/doc/dragging.html
    //You must set "position:absolute" CSS style on elements that you mean to be draggable
    jsPlumb.draggable("element_id or directly the DOM element", { containment:false, grid:[50,50]});

    // A Connection in jsPlumb consists of two Endpoints, a Connector, and zero or more Overlays.
    // But this call to 'connect' supplied none of those things, so jsPlumb uses the default values wherever it needs to
    jsPlumb.connect({

        // CONNECTOR - REFERENCE: https://jsplumbtoolkit.com/community/doc/connectors.html
        // connector: ["Bezier"],                        // default for connectors
        // connector: ["Bezier", { curviness:150 } ],    // default parameters for Bezier
        // connector: ["Straight", { stub:0, gap:0 } ],  // default parameters for Straight
        // connector: ["Flowchart", { stub:30, alwaysRespectStubs:false, gap:0, midpoint:0.5, cornerRadius:0 } ],  // default parameters for Flowchart
        // connector: ["StateMachine", { margin:5, curviness:10, proximityLimit:80} ],  // default parameters for StateMachine


        // ANCHOR - REFERENCE: https://jsplumbtoolkit.com/community/doc/anchors.html . Anchor can be Static - Dynamic - Perimeter - Continuos
        // Static 
        // anchor:"x" where x is Top - TopRight - Right - BottomRight -Bottom - BottomLeft - Left - TopLeft - Center or [x, y, dx, dy, offset]
        // Dynamic - Dynamic Anchors and Draggable Connections can interoperate well together
        // anchor:x where x is an array of static anchors. The one that is most appropriate each time something moves will be chose
        // Perimeter - anchor locations are chosen from the perimeter of some given shape
        // anchor:[ "Perimeter", { shape:"x", anchorCount:60 } ] where x is one among Circle - Ellipse - Triangle - Diamond - Rectangle - Square
        // Continuos - don't believe are mandatory


        // ENDPOINT - REFERENCE: https://jsplumbtoolkit.com/community/doc/endpoints.html
        // endpoint: "x" (taken from Dot - Rectangle - Blank - Image). Each one has its parameters


        // OVERLAYS - REFERENCE: https://jsplumbtoolkit.com/community/doc/overlays.html - UI elements that are painted onto Connections (label-arrows...)
        // Arrow - Label - PlainArrow - Diamond - Custom
        // overlays:["x", {attributes},

        source:"img1",
        target:"img2"
    });




    // DRAG AND DROP CONNECTIONS
    // To support drag and drop connections, you first need to set a few things up. 
    // Every drag and drop connection needs at least a source Endpoint that the user can drag a connection from. 
    // This Endpoint will act as a source for new Connections, and will use the jsPlumb defaults


    // ELEMENTS AS SOURCES & TARGETS (not suitable for our needs, because does not have an anchor. The object itself is an anchor)
    jsPlumb.makeSource("img4", {
      anchor:"Continuous",
      endpoint:["Rectangle", { width:40, height:20 }],
      maxConnections:1,
      onMaxConnections : function (params, originalEvent) { alert("no more"); }
    });    

    // from now, the element is a source of connections, that can be estabilished either via drag 'n' drop or by using the .connect method
    //jsPlumb.connect({source:"el1", target:"el2"});

    var endpointOptions2 = { 
      isTarget:true, 
      uniqueEndpoint:true, // unique for every future connection?
      endpoint:"Rectangle", 
      paintStyle:{ fill:"green" } 
    };

    jsPlumb.makeTarget("img5", endpointOptions2);
    

//});         

// MISCELLANEOUS
// 1 - Because of the fact that jsPlumb uses element ids, you need to tell jsPlumb if an element id changes.

// 2 - if you are performing some kind of "bulk" operation - like loading data on page load perhaps - 
//  it is recommended that you suspend drawing before doing so:
//  jsPlumb.setSuspendDrawing(true);
//  - load up all your data here -
//  jsPlumb.setSuspendDrawing(false, true);    


// 3 - zoom functionality
//  REFERENCE: https://jsplumbtoolkit.com/community/doc/zooming.html
/*  window.setZoom = function(zoom, instance, transformOrigin, el) {
          transformOrigin = transformOrigin || [ 0.5, 0.5 ];
          instance = instance || jsPlumb;
          el = el || instance.getContainer();
          var p = [ "webkit", "moz", "ms", "o" ],
              s = "scale(" + zoom + ")",
              oString = (transformOrigin[0] * 100) + "% " + (transformOrigin[1] * 100) + "%";

          for (var i = 0; i < p.length; i++) {
            el.style[p[i] + "Transform"] = s;
            el.style[p[i] + "TransformOrigin"] = oString;
          }

          el.style["transform"] = s;
          el.style["transformOrigin"] = oString;

          instance.setZoom(zoom);    
    };

    setZoom(1.5, jsPlumb, [0.2,0.2],document.getElementById("container"));
*/

// 4 - jsPlumb allows you to group elements
//  REFERENCE: https://jsplumbtoolkit.com/community/doc/groups.html

// 5 - jsPlumb has a mechanism that allows you to set/get parameters on a per-connection basis. 
//  These are not parameters that affect the appearance of operation of the object on which they are set; 
//  they are a means for you to associate information with jsPlumb objects. 
//  REFERENCE: https://jsplumbtoolkit.com/community/doc/parameters.html

// 6 - you can change the appearance of a connection or endpoint through the "Types".
//  Simply, you associate different styles for the colors, lines, ... and toggle them whenever you want
//  REFERENCE: https://jsplumbtoolkit.com/community/doc/types.html

// 7 - jsPlumb offers animations
//  REFERENCE: https://jsplumbtoolkit.com/community/doc/animation.html

// 8 - querying jsPlumb
//  REFERENCES: https://jsplumbtoolkit.com/community/doc/querying.html

// 9 - examples
//  REFERENCES: https://jsplumbtoolkit.com/community/doc/connect-examples.html
//  REFERENCES: https://jsplumbtoolkit.com/community/doc/draggable-connections-examples.html
//  REFERENCES: https://jsplumbtoolkit.com/community/doc/miscellaneous-examples.html    