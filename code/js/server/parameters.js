// ANY CHANGE IN THIS FILE HAS TO BE DONE ALSO IN THE OTHER PARAMETERS FILE (js/client/parameters.js)


// the server port and the web socket one
var serverPort = 7020;
var webSocketPort = 7021;

// the folder in which the session files are going to be saved
var sessionsFolder = '/sessions';

// the generic session file name. It is a JSON file whom attributes are specified below
var sessionsFileName = '/sessionFile.json';

// list of the attributes of the session file JSON
var privateParametersNumber = 2;                        // if you add attributes below, remember to update this value
var creationTimeAttr = "_creationTime";                 // creation time
var lastCreatedObjectIDAttr = "_lastCreatedObjectID";   // last created object ID

// list of messages types
var messageTypeHello = "hello";
var messageTypeBye = "bye";
var messageTypeServerJSONResponse = "serverJSONResponse";
var messageTypeServerObjectsResponse = "serverObjectsResponse";
var messageTypeUndoMessage = "undoMessage";
var messageTypeAddObject = "addObject";
var messageTypeModifyObject = "modifyObject";
var messageTypeDeleteObject = "deleteObject";
var messageTypeAddConnection = "addConnection";
var messageTypeDeleteConnection = "deleteConnection";
var messageTypeErrorMessage = "errorMessage";
var messageTypeSendCommand = "sendCommandRequest";
var messageTypeCommandResponde = "commandResponse";

// error strings

// when the server received a bad formatted command
var errorBadCommand = "Your actions produced a bad formatted command. Try again. If the error persists, contact the admin";  
var errorSessionFileCorrupted = "Session file corrupted. Try again. If the error persists, contact the admin";  
var errorUknownCommand = "Your actions produced an uknown command. What are you doing? Try again. If the error persists, contact the admin";  

// export
exports.serverPort = serverPort;
exports.webSocketPort = webSocketPort;



exports.sessionsFolder = sessionsFolder;
exports.sessionsFileName = sessionsFileName;



exports.privateParametersNumber = privateParametersNumber;
exports.creationTimeAttr = creationTimeAttr;
exports.lastCreatedObjectIDAttr = lastCreatedObjectIDAttr;



exports.messageTypeHello = messageTypeHello;
exports.messageTypeBye = messageTypeBye;
exports.messageTypeServerJSONResponse = messageTypeServerJSONResponse;
exports.messageTypeServerObjectsResponse = messageTypeServerObjectsResponse;
exports.messageTypeUndoMessage = messageTypeUndoMessage;
exports.messageTypeAddObject = messageTypeAddObject;
exports.messageTypeModifyObject = messageTypeModifyObject;
exports.messageTypeDeleteObject = messageTypeDeleteObject;
exports.messageTypeAddConnection = messageTypeAddConnection;
exports.messageTypeDeleteConnection = messageTypeDeleteConnection;
exports.messageTypeErrorMessage = messageTypeErrorMessage;
exports.messageTypeSendCommand = messageTypeSendCommand;
exports.messageTypeCommandResponde = messageTypeCommandResponde;



exports.errorBadCommand = errorBadCommand;
exports.errorSessionFileCorrupted = errorSessionFileCorrupted;
exports.errorUknownCommand = errorUknownCommand;
