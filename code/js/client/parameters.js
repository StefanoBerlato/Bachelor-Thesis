// ANY CHANGE IN THIS FILE HAS TO BE DONE ALSO IN THE OTHER PARAMETERS FILE (js/server/parameters.js)

// the server port and the web socket one
var serverPort = 7020;
var webSocketPort = 7021;

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

var connectionClassType = "connection";