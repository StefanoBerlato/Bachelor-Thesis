// generic source style configuration
var sourceStyle = {
    
    // obviously it's a source
    isSource:true,
    
    // can accept 1 connection at most
    maxConnections : 1,
    
    // source endpoint style, both here and in jsPlumbDefaults (it's NOT reduntant)
    endpoint : [ "Image", { src:"connections/source.png", height:"20", width:"20" } ] 
};   

// generic target style configuration
var targetStyle = {
    
    // obviously it's a target
    isTarget:true,
        
    // can accept 1 connection at most
    maxConnections : 1,
    
    // target endpoint style, both here and in jsPlumbDefaults (it's NOT reduntant)
    endpoint : [ "Image", { src:"connections/target.png", height:"20", width:"20" } ]
};   

// default JSplumb configuration
var jsPlumbDefaults = {
    
    // obviously the connection is detachable
    ConnectionsDetachable : true,
    
    // the container html object ID, where JSplumb will append everything
    Container : "container",

    // connector line shape
    Connector : ["Flowchart", { stub:30, alwaysRespectStubs:false, gap:0, midpoint:0.5, cornerRadius:0 } ],
    
    // connector line style
    PaintStyle : { strokeWidth:2, stroke: '#2980b9' },
    
    // default max connections number
    MaxConnections : 1,
    
    // endpoint [source,target] style, both here and in sourceStyle, targetStyle (it's NOT reduntant).
    Endpoints : [ [ "Image", { src:"connections/source.png", height:"20", width:"20" } ], [ "Image", { src:"connections/target.png", height:"20", width:"20" } ] ]
}


jsPlumb.ready(function() {
    
    // import our defaults
    jsPlumb.importDefaults(jsPlumbDefaults);
    

    /**
     *  This event listener is triggered whenever a connection is made.
     *  Avoiding programmatically connections, it sends the notification to the server
     *  Finally, communicates to the two involved objects the connection
     *  @param info : object containing all info regarding the connection
     *  @param originalEvent : the mouse event that created the connection 
     *         (undefined if the connection was created programmatically)
     */
    jsPlumb.bind("connection", function(info, originalEvent) {

        // just storing useful variables
        var sourceID = info.sourceId;
        var targetID = info.targetId;
        var sourceAnchorType = info.sourceEndpoint.anchor.type;
        var targetAnchorType = info.targetEndpoint.anchor.type;

        // so the connection was estabilished using the mouse, not programmatically at page load or because of a server message
        if (originalEvent != undefined) {

            // increment the last object ID
            updateLastCreatedObjectID(1);
            
            // componing the message to send to the server
            var messageToSend = { "messageType" : messageTypeAddConnection,
                                  "objectClass" : connectionClassType,
                                  "objectID" : lastCreatedObjectID,
                                  "DOMParameters" : {
                                     "objectClass" : connectionClassType,
                                     "id" : lastCreatedObjectID,
                                     "sourceObjID" : sourceID,
                                     "targetObjID" : targetID,
                                     "sourceAnchorType" : sourceAnchorType,
                                     "targetAnchorType" : targetAnchorType
                                  }
                                }

            // send the message to the server
            sendMessage(messageToSend);

            // store the ID to the connection object
            info.connection.setParameter("myID", lastCreatedObjectID);
            
        }
        
        // connection ID
        var connID = info.connection.getParameter("myID");

        // store the connection in our JSON file
        referenceFromDOMToJSObjects[connID] = info.connection;
        
        // notify the connection to the source object
        referenceFromDOMToJSObjects[sourceID].connectedAsSource(connID, sourceAnchorType, targetAnchorType, targetID);
               
        // notify the connection to the target object
        referenceFromDOMToJSObjects[targetID].connectedAsTarget(connID, targetAnchorType, sourceAnchorType, sourceID);

    });


    /**
     *  This event listener is triggered whenever a connection is detached.
     *  Avoiding programmatically connections, it sends the notification to the server
     *  Finally, communicates to the two involved objects the connection detach
     *  @param info : object containing all info regarding the connection
     *  @param originalEvent : the mouse event that detached the connection 
     *         (undefined if the connection was detached programmatically)
     */
    jsPlumb.bind("connectionDetached", function(info, originalEvent) { 
        
        // so the connection was detached using the mouse, not programmatically because of a server message
        if ( (originalEvent != undefined) || (referenceFromDOMToJSObjects[info.connection.getParameter("myID")] != undefined) ) {

            // call the handling function for client-generated event
            connectionDetached(info);
        } 
    });


    /**
     *  This event listener is triggered whenever a connection is moved from one endpoint to another one.
     *  The code is the same as "connectionDetached" event handler, because, after that 
     *  a connection is moved, this event listener and the "connection" event listener are triggered.
     *  So here we have just to delete the connection as it was made by the user.
     *  @param info : object containing all info regarding the connection
     *  @param originalEvent : the mouse event that moved the connection 
     */
    jsPlumb.bind("connectionMoved", function(info, originalEvent) {

        // call the handling function for client-generated event
        connectionDetached(info);

    });    
});


/**
 *  Code for handling the user-delete connection
 *  Send the message to the server and notify it to the classesw
 *  @param info : connection object info
 */
function connectionDetached (info) {

    // just storing useful variables   
    var sourceID = info.sourceId | info.originalSourceId;
    var targetID = info.targetId | info.originalTargetId;
    
    // the connection ID
    var connID = info.connection.getParameter("myID");
    
    // componing the message to send to the server
    var messageToSend = { "messageType" : messageTypeDeleteConnection,
                          "objectID" : connID
                        }

    // send the message to the server
    sendMessage(messageToSend);

    // delete the connection from our JSON var
    delete referenceFromDOMToJSObjects[connID];

    // notify the connection to the source object
    referenceFromDOMToJSObjects[sourceID].disconnectedAsSource(connID);

    // notify the connection to the target object
    referenceFromDOMToJSObjects[targetID].disconnectedAsTarget(connID);
}