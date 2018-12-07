// how many clients are connected to this session right now?
var connectedClients = 0;

// the last created object ID
var lastCreatedObjectID = "0";

// bind the JS class object or connections with the ID of the DOM one 
// in case of connections, the ID does not corrispond to the DOM object connection
var referenceFromDOMToJSObjects = {};

// have the page loaded all the classes files?
var loadedAllJSClassesFiles = false;

// if there's need to store a message in order to elaborate it later
var temporaryStoredMessage = {};

// the websocket object
var ws;


/**
 *  This function is invoked on page load
 *  It initializates the websocket with the server
 */
function initWebSocket () {
    

    // create the socket with the server
    ws = new WebSocket('ws://127.0.0.1:' + webSocketPort);
 
    // on message received
    ws.onmessage = function (event) {

        // store the message
        var message = checkMessageIntegrity (event);
        
        // if the message is well formatted
        if (message != null && message != undefined) {
                    
            // call the function to resolve the message
            resolveMessage(message);
        }
    };

    // hello message, to let the server initialize the session for this client
    ws.onopen = function () {
        
        // send "hello" message to the server, to initialize session
        sendMessage({messageType : messageTypeHello});
    
    }
}


/**
 *  This checks whether the received message is well formatted or not
 *  @param event : the info regarding the received message. In event.data the message itsef
 *  @return message : the message itself if it's well formatted, null otherwise
 */
function checkMessageIntegrity (event) {
    
    // the received message
    var message;

    try {

        // try to parse the message into a json
        var message = JSON.parse(event.data);

        // log for debug purposes
        console.log(message);

    }
    catch (err) {

        // alert the error to the user
        swal({
            title: "Error!",
            text: ("received wrong formatted message from server, contact the system admin giving him this information: \n " + err),
            type: "error",
            confirmButtonColor: "#e74c3c",
            confirmButtonText: "Ok"
        });

        // set the value to false
        message = null;
    }
    
    // return it
    return message;
}


/**
 *  This function elaborates the received message and performs the proper action
 *  @param message : the received message
 */
function resolveMessage (message) {
    
    // swith on the message type
    switch (message.messageType) {

        // display the new number of incremented clients
        case messageTypeHello:

            // increment the number of connected clients
            updateConnectedClientsNumber(1);

            break;


        // display the new number of decremented clients
        case messageTypeBye:
            
            // decrement the number of connected clients
            updateConnectedClientsNumber(-1)

            break;


        // loop over the array and create the DOM and JS objetcs, adding them to referenceFromDOMToJSObjects
        case messageTypeServerJSONResponse:

            // only if all the files have been loaded
            if (loadedAllJSClassesFiles) {
                
                // suspend the JSPlumb drawing (performance issues). But this creates some problems, so it's commented
                //jsPlumb.setSuspendDrawing(true);

                // the JSON of objects
                var objectsJSON = message.JSONFile;

                // to store the connections that will be obviously instantied AFTER the other objects
                var connections = {};

                // storing the last created object ID
                updateLastCreatedObjectID(objectsJSON[lastCreatedObjectIDAttr]);
                
                // for each element in the JSON file
                for (var object in objectsJSON) {

                    // if the attribute is a private one
                    if (object.charAt(0) === "_") {
                        
                        // nothing to do until now
                                
                    }

                    // else the attribute is an object or a connection
                    else {

                        // the object class
                        var objectClass = objectsJSON[object]["objectClass"];

                        // the object ID
                        var objectID = objectsJSON[object]["id"];
                        
                        // if the element is a connection
                        if (objectClass === "connection") {

                            // add the connection to the variable
                            connections[objectID] = objectsJSON[object];

                        }

                        // else, if it's an object
                        else {

                            // creating the object
                            createObject (objectClass, objectsJSON[object], 0 );

                        }

                    }

                }

                // for each connection
                for (var connection in connections) {

                    // creating the connection
                    createConnection (connections[connection]);

                }

                // set the number of connected clients
                updateConnectedClientsNumber (message["clientsConnected"]);
                
                // resume the JSPlumb drawing (performance issues). But this creates some problems, so it's commented
                //jsPlumb.setSuspendDrawing(false, true);
                
                // repaint everything
                jsPlumb.repaintEverything();
                
            }
            
            // else, if the files are not ready yet
            else {
                
                // store the message for later use
                temporaryStoredMessage["messageTypeServerJSONResponse"] = message;
            }

            break;

            
        // get the array of classes, create an icon for each one and load the classes code (js file)
        case messageTypeServerObjectsResponse:

            var loadedFile = 0;

            // store the object classes array
            var objectClassArray = message.JSONFile;

            // the toolbar DOM element
            var DOMToolbar = document.getElementById("toolbar");

            // for each class
            for (var objectClass in objectClassArray) {

                // the file class name
                var objectClassName = objectClassArray[objectClass].fileName;

                // the file extension (should be JS)
                var objectClassExt = objectClassArray[objectClass].fileExtension;

                // create its icon through the utility method "shapeHTMLElement"
                var objectIcon = shapeHTMLElement('img', 
                                                  {"id": objectClassName, 
                                                   "src": "classesIcons/" + objectClassName + "_toolbar.png"
                                                  });
                
                // click event listener, in order to create the object
                objectIcon.addEventListener("click", function() { createObject(this.id, {"objectClass" : this.id}, 2) } );

                // append the element to the DOMToolbar
                DOMToolbar.appendChild(objectIcon);

                // load the relative js file
                loadJSFile(("classes/" + objectClassName + "." + objectClassExt), function() {

                    // another file has been loaded
                    loadedFile++;

                    // if all files has been loaded
                    if (loadedFile == objectClassArray.length) {

                        // set the boolean to true
                        loadedAllJSClassesFiles = true;

                        // if there is a message to be resolved
                        if (temporaryStoredMessage.hasOwnProperty("messageTypeServerJSONResponse") ) {
                            
                            // get the message to resolve
                            var message = temporaryStoredMessage["messageTypeServerJSONResponse"];
                            
                            // delete it from the array
                            delete temporaryStoredMessage["messageTypeServerJSONResponse"];

                            // resolve the message
                            resolveMessage(message);
                        
                        }
                    }
                });
            }

            break;

            
        // create the object received from the server
        case messageTypeAddObject:

            // create the object
            createObject(message["objectClass"], message["DOMParameters"], 1);

            break;


        case messageTypeModifyObject:

            // call the "modify" method of the involved object
            referenceFromDOMToJSObjects[message["objectID"]].modify(message["DOMParameters"], false);

            break;


        case messageTypeDeleteObject:

            // the ID of the object
            var id = message["objectID"];

            // call the "delete" method of the involved object
            referenceFromDOMToJSObjects[id].delete(false);

            // delete the object from the JSON
            delete referenceFromDOMToJSObjects[id];

            break;


        case messageTypeAddConnection:
            
            // increment the last object ID
            updateLastCreatedObjectID(1);
            
            // creating the connection
            createConnection (message["DOMParameters"]);

            break;
            

        case messageTypeDeleteConnection:

            // storing the ID
            var id = message["objectID"];
            
            // identifying the connection
            var connection = referenceFromDOMToJSObjects[id];
            
            // delete here the connection from the JSON so that, when the "connectionDetach" event listener
            // will be invoked, it will know that he has not to send back to the server the "deleteConnection" message
            delete referenceFromDOMToJSObjects[id];
            
            // detach the connection
            jsPlumb.deleteConnection(connection);

            
            break;


        case messageTypeErrorMessage:

            // alert the error to the user
            swal({
                title: "Error!",
                text: (message["errorMessage"]),
                type: "error",
                confirmButtonColor: "#e74c3c",
                confirmButtonText: "Ok"
            });

            break;


        case messageTypeUndoMessage:

            // alert the situation to the user
            swal({
                title: "Warning!",
                text: ("due to session cooperative working conflict, your last action has been undone"),
                type: "warning",
                confirmButtonColor: "#f39c12",
                confirmButtonText: "Ok"
            });
            
            // get the id
            var id = message["objectID"];
            
            // if the object has not been deleted yet
            if (referenceFromDOMToJSObjects[id] != undefined) {

                // decrement the last object ID
                updateLastCreatedObjectID(-1);

                // if the object was a connection
                if (message["objectClass"] === "connection") {

                    // detach the connection
                    jsPlumb.deleteConnection(referenceFromDOMToJSObjects[id]);

                }

                // otherwise
                else {

                    // call the "delete" method of the involved object
                    referenceFromDOMToJSObjects.objectsID.delete();

                    // delete the object from the JSON
                    delete referenceFromDOMToJSObjects[id];

                }
            }
            
            break;
            
            
        case messageTypeCommandResponde:
            
            // call the method of the SQL class instance that requested previously the data
            referenceFromDOMToJSObjects[message["applicantObjectID"]].handleReceivedData(message["data"]);
            
            break;


        default :
            // log for debug purposes
            console.log("error received command unknown");

    }
}


/**
 *  Generic utility function for sending a message to the server
 *  @param message : JSON message to be sent. the session attribute will be appended here
 */
function sendMessage (message) {

    // get the session
    var sessionName = new URL(window.location.href).searchParams.get("session");

    // set the session in the message
    message.sessionName = sessionName;
    
    // stringify the message
    message = JSON.stringify(message);

    // if the socket is open
    if(ws.readyState === ws.OPEN){
        
        // send the message
        ws.send(message);
        
        // log for debug purposes
        console.log( "sent message: " + JSON.stringify(message) );
    }
    
    // if the socket is not open
    else {
        
        // alert the warning to the user
        swal({
            title: "Warning!",
            text: ("No server connection. Try refreshing the page. Contact the server admin if necessary"),
            type: "warning",
            confirmButtonColor: "#f39c12",
            confirmButtonText: "Ok"
        });

    }
}
