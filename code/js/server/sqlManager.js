// require the mysql package
var mysql = require('mysql');

var param = require('./parameters.js');         // global parameters
var wsh = require('./webSocketHandler.js');     // web socket handler

// A JSON of requestes made by SQL objects. Firstly it 
// contains the connection, then the data received
// from the remote server if any
// JSON FORMAT
// {"sessionName1" : {"objectID1" : data, "objectID2" : data, ...}, "sessionName2" : ... }
var applicantObjects = {}; 

/**
 *  This function connects to a remote SQL database, queries it and return the data as an array of JSON
 *  @param client : the client that requested this SQL database connection. The data should be send back to him
 *  @param applicantObjectID : the ID of the object that requested the data
 *  @param url : the host database url
 *  @param dbName : the database name
 *  @param port : the host database url port
 *  @param username : username
 *  @param password : password
 *  @param query : the query to execute (SQL)
 */
function getData (client, applicantObjectID, url, dbName, port, username, password, query) {
    
    // the value that will be returned via socket (either data or error message )
    var returningValue = undefined;
    
    // store for convenience
    var currentSession = client.sessionName;
    
    // if the session is not already present in the JSON
    if (!applicantObjects.hasOwnProperty(currentSession)) {
        
        // initialize it
        applicantObjects[currentSession] = {};
    }
    
    // create a connection with the given parameters
    applicantObjects[currentSession][applicantObjectID] = mysql.createConnection({
        host     : url,
        user     : username,
        password : password,
        port     : port,
        database : dbName   
    });

    // connect
    applicantObjects[currentSession][applicantObjectID].connect(function(err, results) {
        
        // if there was an error
        if (err) {
            
            // set the returning value as the error message
            returningValue = err.message;
            
        }
        
        // if there were no errors while connecting to the DB
        if (returningValue == undefined) {
            
            // execute the query
            applicantObjects[currentSession][applicantObjectID].query(query, function (err, result) {
                
                // close the connection
                applicantObjects[currentSession][applicantObjectID].end(); 
                
                // if there was an error
                if (err) {

                    // set the returning value as the error message
                    applicantObjects[currentSession][applicantObjectID] = err.message;

                }
                
                // otherwise
                else {
                    
                    // set the returning value AND now the data are stored in the server
                    applicantObjects[currentSession][applicantObjectID] = result;

                }
                
                // send back the message
                wsh.sendMessage(client, {"messageType" : param.messageTypeCommandResponde, 
                                         "applicantObjectID" : applicantObjectID, 
                                         "data" : applicantObjects[currentSession][applicantObjectID]})
                
            });
        }
        
        //otherwise
        else {
            
            // close the connection
            applicantObjects[currentSession][applicantObjectID].end(); 

            // send back the message
            // TODO for now, all the data are returned to the client. Should not be like that of course.
            wsh.sendMessage(client, {"messageType" : param.messageTypeCommandResponde, "applicantObjectID" : applicantObjectID, "data" : returningValue})
            
        }
    });     
}


/**
 *  This function deletes an SQL applicant object. from the "applicantObjects" JSON 
 *  It's invoked when the user delete an object of class "SQLDatabase"
 *  @param objectSession : deleted object session
 *  @param objectID : deleted object ID. if undefined, delete all the objects in the JSON
 */
function deleteSQLObject (objectSession, objectID) {
    
    // if there is such an object to eliminate
    if (applicantObjects[objectSession] != undefined) {
        
        // if no ID was provided
        if (objectID == undefined) {
            
            // delete all the objects
            delete applicantObjects[objectSession]
            
        }
        
        else {
        
            if (applicantObjects[objectSession][objectID] != undefined) {

                // for now, remove the object from the list of applicant objects
                delete applicantObjects[objectSession][objectID];

            }
        }
    }
}


exports.getData = getData;
exports.deleteSQLObject = deleteSQLObject;