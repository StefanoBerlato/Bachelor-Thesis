var WebSocket  = require('./../../node_modules/ws')     // web socket library

var param = require('./parameters.js');                 // global parameters
var fsm = require('./fileSystemManager.js');            // fyle system manager class
var sql = require('./sqlManager.js');                   // sql manager class for remote connection

// the web socket (server side)
var wss = undefined; 

// how frequently should we check the status of the client's websocket connections (in milliseconds)?
var checkStatusInterval = 30000;

// the function that will check the webSocket status connection each 'checkStatusInterval' time
var checkClientsStatusIntervalFunction;

// to cache the json files for each session opened
var jsonFilesCache = {};

// the cache of the object classes files cache. Obviously it's unique for all sessions
var objectClassesFilesCache;

// the sessions container directory path
var sessionDirPath = __dirname + "/../.." + param.sessionsFolder + '/';


/**
 *  initialize the webSocket object and methods
 */
function initialize () {
   
    // read the object classes and cache them
    objectClassesFilesCache = fsm.getNamesFromDir( __dirname + "/../client/classes", ["txt"]);
    
    // if there was an error reading the classes files
    if (objectClassesFilesCache == -1) {
        
        console.log("FATAL ERROR while reading the files of classes");
        
        // TODO what to do? Obviously cannot go on
        return;
    }
    

    // if the webSocket is not initialized
    if (wss == undefined) {
        
        // initialize the webSocket
        wss = new WebSocket.Server({port : param.webSocketPort});
    
        // when the socket is ready
        wss.on('connection', function (ws) {

            // the client is alive (of course, he has just connected)
            ws.isAlive = true;
            
            // on pong, set alive = true throught the heartbeat function
            ws.on('pong', heartbeat);
            
            // set the interval function
            checkClientsStatusIntervalFunction = setInterval(ping, checkStatusInterval);
            
            // on connection closed
            ws.on('close', function () {
                
                // close connection handling
                closeConnectionHandling(this);
                
            });
           
            // on message received
            ws.on('message', function (message) {

                // try to parse and get the received message
                var messageJSON = checkMessageIntegrity(message);
                
                // if the message is well formatted
                if (messageJSON != null && messageJSON != undefined) {

                    // log for debug purposes
                    console.log("received message " + messageJSON.messageType);

                    // set the client session
                    ws.sessionName = messageJSON.sessionName
                    
                    // initialize the session if it's the case
                    // If return true... (so, no errors)
                    if (initializeSession (ws)) { 
                        
                        // call the function to resolve the message
                        // if it returns true ... (so, broadcast)
                        if (resolveMessage (messageJSON, ws)) {

                            // ... broadcast the message to everyone else in that session
                            broadCast(message, [ws]); 

                        }
                    }
                }
                
                // otherwise
                else {
                    
                    // log for debug purposes
                    console.log("error parsing the received json");
                    
                    // set the proper error message
                    sendErrorMessage(ws, param.errorBadCommand);
                }
            });
        });
    }
}


/**
 *  This utility function sends messages to the given client
 *  @param ws : the websocket which has to receive the message
 *  @param message : the JSON message
 */
function sendMessage (ws, message) {

    // send the message to the client
    ws.send(JSON.stringify(message));
    
}


/**
 *  This utility function sends error messages to the given client
 *  @param ws : the websocket which has to receive the error message
 */
function sendErrorMessage (ws, errorMessage) {

    // send the message to the client
    ws.send(JSON.stringify({"messageType" : param.messageTypeErrorMessage, "errorMessage" : errorMessage}));
    
}


/**
 *  This utility function sends undo messages to the given client
 *  @param ws : the websocket which has to receive the error message
 *  @param objectClass : the object class
 *  @param objectID : the object ID
 */
function sendUndoMessage (ws, objectClass, objectID) {

    // send the message to the client
    ws.send(JSON.stringify({"messageType" : param.messageTypeUndoMessage, "objectClass" : objectClass, "objectID" : objectID}));
    
}


// export
exports.init = initialize;
exports.sendMessage = sendMessage;
exports.sendErrorMessage = sendErrorMessage;
exports.sendUndoMessage = sendUndoMessage;



/**
 *  This checks whether the received message is well formatted or not
 *  @param message : the received message as a string
 *  @return messageJSON : the message as a JSON if it's well formatted, null otherwise
 */
function checkMessageIntegrity (message) {
    
    // the received message will be parsed into a JSON
    var messageJSON;

    try {

        // try to parse the received JSON
        messageJSON = JSON.parse(message);

        // if the result of the parse is not a JSON
        if (messageJSON.constructor !== {}.constructor) {

            // throw error
            throw "errorNotJSON";

        }
    }
    catch(err) {
        
        // set the value to null
        messageJSON = null;

    }
    
    // eventually return the message as a JSON, or null if there was an error
    return messageJSON;
}


/**
 *  This function is invoked whenever a message is received,
 *  and checks if the file session of reference is loaded or not.
 *  If it is the case, it loads it into jsonFilesCache variable
 *  @param ws : the client that has requested this session
 *  @return ws : the client that has requested this session
 */
function initializeSession (ws) {
    
    // returning value, so there are no errors
    var returningValue = true;
    
    // the current session to initialize
    var currentSession = ws.sessionName;
    
    // session file path
    var sessionFilePath = sessionDirPath + currentSession + param.sessionsFileName;

    // now retrieving the session JSON file if it's not cached yet
    if ((jsonFilesCache[currentSession] == undefined) || 
        (jsonFilesCache[currentSession] != undefined && jsonFilesCache[currentSession].file == undefined)) {

        // now read the json file
        var jsonFile = fsm.readJSONFile(sessionFilePath);

        // if everything was successful
        if (jsonFile != null) {

            // set the json file and the number of connected clients relative to this session
            jsonFilesCache[currentSession] = {file : jsonFile, clientsConnected : 0};

        }

        // otherwise
        else {

            // log for debug purposes
            console.log("error parsing the session file json, or wrong ID numbers");

            // set the proper error message
            var errorMessage = {"messageType" : param.messageTypeErrorMessage, "errorMessage" : param.errorSessionFileCorrupted}

            // send the message to the client
            ws.send(JSON.stringify(errorMessage));

            // set the value to false
            returningValue = false;
        }
    }
    
    // return the value
    return returningValue;
}


/**
 *  This function elaborates the received message and performs the proper action
 *  @param messageJSON : the received message
 *  @param ws : the client that sent the message
 *  @return returningValue : true if the message is to broadcast, false otherwise
 */
function resolveMessage (messageJSON, ws) {
    
    // broadcast or not the message?
    returningValue = true;
    
    // store for convenience the current session
    var currentSession = ws.sessionName;
    
    // store for convenience the object ID, if any
    var objectID = messageJSON.objectID;
    
    // store for convenience the DOMParameters, if any
    var DOMParameters = messageJSON.DOMParameters;

    // the path to the session file in the file system
    var sessionFilePath = sessionDirPath + (ws.sessionName) + param.sessionsFileName;
    
    // swich by message type
    switch (messageJSON.messageType) {

        case param.messageTypeHello:

            // increment by 1 the connected clients
            jsonFilesCache[currentSession].clientsConnected ++;

            // send the object classes
            ws.send(JSON.stringify({messageType : param.messageTypeServerObjectsResponse, 
                     JSONFile : objectClassesFilesCache}));

            // send the json file to the client that said "hello"
            ws.send(JSON.stringify({messageType : param.messageTypeServerJSONResponse, 
                     JSONFile : jsonFilesCache[currentSession].file, 
                     clientsConnected : jsonFilesCache[currentSession].clientsConnected}));

            break;


        case param.messageTypeAddObject:

            // if the ID of the new file is, properly, the next one (good thing)
            if (jsonFilesCache[currentSession].file[param.lastCreatedObjectIDAttr] == (objectID - 1) ) {

                // choose the current session file, take the last id param and increment it by 1
                jsonFilesCache[currentSession].file[param.lastCreatedObjectIDAttr]++;

                // choose the current session file, add a new key (object ID) and assign the DOM parameters
                jsonFilesCache[currentSession].file[objectID] = DOMParameters;

                // updating the file in the file system, giving the pair "key:value" as specified 
                fsm.updateJSONFile(sessionFilePath, 
                                   currentSession,
                                   objectID + ":" + JSON.stringify(DOMParameters), 
                                   ws);

            }

            // So the client created an object with the same ID of another one. This scenario may happen if the server
            // has not already broadcasted the first "addObject" message, and meanwhile another client has created another
            // object (not knowing about the first "addObject" message, the ID will be the same of the last one)
            // In this case, the client itself will delete its object by replacing it with the proper one, so no need
            // to send the UNDO message.
            else if (jsonFilesCache[currentSession].file[param.lastCreatedObjectIDAttr] == objectID ) {

            }

            // otherwise
            else  {

                // communicate to the client to undo its action
                sendUndoMessage(ws, messageJSON.objectClass, objectID);

                // to avoid broadcast
                returningValue = false;
            }

            break;


        case param.messageTypeModifyObject:

            // if someone else has already deleted the object
            if (jsonFilesCache[currentSession].file[objectID] == undefined) {

                // to avoid broadcast
                returningValue = false;
            }

            // otherwise
            else {

                // get the list of the modified params
                var modifiedParams = DOMParameters;

                // for each parameter in the list
                for (var parameter in modifiedParams){

                    // for avoiding inherited properties
                    if (modifiedParams.hasOwnProperty(parameter)) {

                        // choose the current session file, add modify the object parameter
                        jsonFilesCache[currentSession].file[objectID][parameter] = modifiedParams[parameter];
                    }
                }

                // updating the file in the file system, giving the pair "key:value" as specified
                // "key" is the ID of the involved object, "value" is the JSON of modified parameters
                fsm.updateJSONFile(sessionFilePath, 
                                   currentSession,
                                   objectID + ":" + JSON.stringify(modifiedParams), 
                                   ws);

            }
            break;


        case param.messageTypeDeleteObject:

            // if someone else has already deleted the object
            if (jsonFilesCache[currentSession].file[objectID] == undefined) {

                // to avoid broadcast
                returningValue = false;
            }

            // otherwise
            else {

                // action to perform basing on the object class
                switch (jsonFilesCache[currentSession].file[objectID]["objectClass"]) {
                    
                    case "SQLDatabase": 
                        
                        // call the function to delete the object
                        delete sql.deleteSQLObject(currentSession, objectID);
                        
                        break;
                        
                }
                
                // choose the current session JSON file, and delete the object with that ID
                delete jsonFilesCache[currentSession].file[objectID];

                // updating the file in the file system, giving the pair "key:value" as specified 
                fsm.updateJSONFile(sessionFilePath,
                                   currentSession,
                                   objectID + ":null", 
                                   ws);
            }

            break;


        case param.messageTypeAddConnection:

            // if the ID of the new file is, properl, the next one (good thing)
            if (jsonFilesCache[currentSession].file[param.lastCreatedObjectIDAttr] == (objectID - 1) ) {

                // choose the current session file, take the last id param and increment it by 1
                jsonFilesCache[currentSession].file[param.lastCreatedObjectIDAttr]++;

                // choose the current session file, add a new key (object ID) and assign the DOM parameters
                jsonFilesCache[currentSession].file[objectID] = DOMParameters;

                // updating the file in the file system, giving the pair "key:value" as specified 
                fsm.updateJSONFile(sessionFilePath, 
                                   currentSession,
                                   objectID + ":" + JSON.stringify(DOMParameters), 
                                   ws);
            }

            // otherwise
            else {

                // communicate to the client to undo its action
                sendUndoMessage(ws, messageJSON.objectClass, objectID);

                // to avoid broadcast
                returningValue = false;
            }

            break;


        case param.messageTypeDeleteConnection:

            // if someone else has already deleted the object
            if (jsonFilesCache[currentSession].file[objectID] == undefined) {

                // to avoid broadcast
                returningValue = false;
            }

            // otherwise
            else {

                // choose the current session JSON file, and delete the object with that ID
                delete jsonFilesCache[currentSession].file[objectID];

                // updating the file in the file system, giving the pair "key:value" as specified 
                fsm.updateJSONFile(sessionFilePath,
                                   currentSession,
                                   messageJSON["objectID"] + ":null", 
                                   ws);

            }

            break;


        case param.messageTypeSendCommand:

            // call the function that will handle this request
            sql.getData(ws,
                        messageJSON["applicantObjectID"], 
                        messageJSON["databaseSourceURL"], 
                        messageJSON["databaseSourceName"], 
                        messageJSON["databaseSourcePort"], 
                        messageJSON["databaseUsername"], 
                        messageJSON["databasePassword"], 
                        messageJSON["queryToExecute"]);

            break;


        default :
            // log for debug purposes
            console.log("error received command unknown");

            // set the proper error message
            var errorMessage = {"messageType" : param.messageTypeErrorMessage, "errorMessage" : param.errorUknownCommand}

            // send the message to the client
            ws.send(JSON.stringify(errorMessage));

            // to avoid broadcast
            returningValue = false;

    }
    
    // finally return
    return returningValue;
    
}


/**
 *  Heartbeat function
 */
function heartbeat() {
  this.isAlive = true;
}


/**
 *  ping function, for checking clients status
 */
function ping() {

    // for each connected client
    wss.clients.forEach(function each(ws) {

    // if he is no more alive
    if (ws.isAlive === false) {

        // close connection handling
        return closeConnectionHandling(ws);

    }

    // the client's webSocket is not alive until we have checked it
    ws.isAlive = false;

    // ping request
    ws.ping('', false, true);

    });
}


/**
 *  This function handles the close of a connection
 *  @param ws : the disconnected client
 */
function closeConnectionHandling (ws) {
   
    // log for debug purposes
    console.log("client disconnected");
    
    // store it for convenience
    var currentSession = ws.sessionName;
    
    // the cached file is undefined only if there were errors while 
    // trying to read it from the file system (either JSON parse error or ID errors)
    if (jsonFilesCache[currentSession] != undefined) {
        
        // decrement the number of clients connected to this session
        jsonFilesCache[currentSession].clientsConnected -- ;

        // if there are no more client connected
        if (jsonFilesCache[currentSession].clientsConnected == 0) {

            console.log("close the session " + currentSession + " file");

            // save the file, giving the path, the stringified JSON (without the last char, so '}')
            fsm.writeClosedJSONFile(sessionDirPath + currentSession + param.sessionsFileName, 
                                    currentSession,
                                    jsonFilesCache[currentSession].file             
                                    );
            
            // clear the SQL data from the closing session, if any
            sql.deleteSQLObject(currentSession);
            
            // delete the file from the cache. It is useful no more
            delete jsonFilesCache[currentSession];
        }
    }
    
    // broadcast the message to everyone else
    broadCast(JSON.stringify({"messageType" : param.messageTypeBye}), [ws]);

    // terminate
    return ws.terminate();
    
}


/**
 *  This function broadcasts a message to the clients connected to the same sessions
 *  of the ones in "allButThisClients" parameter but these.
 *  @param message : the message to be broadcasted
 *  @param allButThisClients : array of clients that have not to receive this message,
 *  but that limits also the sessions where the message is forwarded to.
 */
function broadCast (message, allButThisClients) {
   
    // just put here all the working sessions that are 
    // bounded to the clients in "allButThisClients"
    var clientsSessions = [];
    
    // just a simple check. If the parameter is undefined,
    if (allButThisClients == undefined) {
        
        // set it as an empty array
        allButThisClients = [];

    } 
    // otherwise
    else {
        
        // for each client in allButThisClients
        for (var i = 0 ; i < allButThisClients.length ; i++) {
            
            /// store the current session for convenience
            var currentSession = allButThisClients[i].sessionName;
            
            // if the session is not already in the array
            if (clientsSessions.indexOf(currentSession) == -1) {
                
                // push it in
                clientsSessions.push(currentSession);
            }
        }
    }
    
    // broadcast to everyone else
    wss.clients.forEach(function (client) {

        // if the client is different and he's listening and they belong to the same session
        if (allButThisClients.indexOf(client) == -1 && 
            client.readyState === WebSocket.OPEN && 
            clientsSessions.indexOf(client.sessionName) != -1) {

            // send the message
            client.send(message);
        }
    });
}