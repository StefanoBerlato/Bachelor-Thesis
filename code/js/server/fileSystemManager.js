var fs = require('fs');     // file system library

var util = require('./util.js');            // utilities functions
var param = require('./parameters.js');     // global parameters
var wsh = require('./webSocketHandler.js'); // web socket handler class


var modifyHistory = {}; // this is a JSON that, for each session, contains an array. The array has
                        // as value of an index the number of changes made to the relative session 
                        // object with ID equal to the index itself

/**
 *  SYNC This function creates the directory to the given path, if it doesn't already exist
 *  @param directoryPath : the directory path
 *  @return returningValue : -1 it the directoryPath is not suitable, 0 if an error occured, 1 if the operation is supposed to be successful
 */
function createDirectory (directoryPath) {
    
    // the returning value
    var returningValue = doesDirectoryOrFileExist(directoryPath);
    
    // if the directory does not already exist
    if (returningValue == 0) {
        
        try {
            
            // create it
            fs.mkdirSync(directoryPath);

            // set the returning value
            returningValue = 1;
            
        }
        catch (err) {
            
            // log the error
            console.log(err);

        }
        
    }
    
    // return returningValue
    return returningValue;
}


/**
 *  SYNC This function creates the session json file to the specified path
 *  @param data : string data to be written as a pair "key:value". "value" can be a JSON too, but cannot nest other JSON
 *                If this parameter is not specified, the function just initializes the file (if it doesn't exist)
 *  @param sessionFileName : the session file name
 *  @return returningValue : 1 is everything went well, -1 is there was an error
 */
function createJSONFile (filePath, sessionFileName) {
    
    // returning value
    var returningValue = 1;
    
    // the file descriptor
    var fileDescriptor;

    // file status
    var fileStatus = doesDirectoryOrFileExist(filePath);
    
    // if the file does not already exist
    if (fileStatus == 0) {

        try {

            // initialize the session configuration file
            // initialize the session configuration file
            fs.writeFileSync(filePath, 
                             
                             // the first attribute is the creation timestamp
                             '{\"' + param.creationTimeAttr + '\":\"' + util.getCurrentDate() + '\",\"' +
                             
                             // the second attribute is the last created object ID (the file is a brand new one, so 0)
                             param.lastCreatedObjectIDAttr + '\":\"0\"'
                             
                            );
            
        }
        
        catch (err) {

            // set the returning value to -1
            returningValue = -1;
            
            // log the error
            console.log(err);

        }
     
    }
    
    // return returningValue
    return returningValue;

}


/**
 *  ASYNC This function append data to the JSON file. 
 *  It can be used for appending and updating the JSON file
 *  NOTE : If the data to be written contains a key that already exists in the JSON (i.e. we are saving a change
 *    made on an object), it will be written anyway, because for now it's just string data. Instead, when the file 
 *    is read, in case of duplicated keys, all the occurrences are joined in a single pair "key":"value", and obviously
 *    the last values will be preserved and will override the previous. When the JSON is going to be written on the file 
 *    system again, the duplicated keys will be therefore deleted.
 *  @param filePath : the path of the file
 *  @param sessionFileName : the session file name
 *  @param data : string data to be written as a pair "key:value". "value" can be a JSON too, but cannot nest other JSONs
 *                This is the parameters that change from the previous object state, not ALL the properties of the object
 *  @param ws : the client that want's to update the JSON file
 */
function updateJSONFile (filePath, sessionFileName, data, ws) {

    // the file descriptor
    var fileDescriptor;

    // if there are data to be written down
    if (data != undefined) {

        // remove all whitespaces from data (for SQL query not good)
        var elaboratedData = data;  //data.replace(/\s/g,'');

        // split "key" from "value"
        var jsonUpdate = elaboratedData.split(/:(.+)/);
        
        // the "key"
        var key = jsonUpdate[0];
        
        // the "value"
        var value = jsonUpdate[1];
        
        // elaborated data
        var dataToAppend;

        // instantiating the history of the session if its the case
        if ((modifyHistory[sessionFileName]) == undefined) {
            
            // assign an empy array
            modifyHistory[sessionFileName] = [];
            
        }
        
        // if the index of the history array for this session is undefined, create it and initialite with 0
        if ( modifyHistory[sessionFileName][key] == undefined ) {
            
            modifyHistory[sessionFileName][key] = 0;
            
        }
        // otherwise just incrementi it
        else {
           
            modifyHistory[sessionFileName][key] ++;
            
        }
        
        // concat the ID with its history
        key += ("_" + modifyHistory[sessionFileName][key])
        
        // if the value of the JSON attributes is itself a JSON
        if (value.charAt(0) == '{') {

            // append jsonUpdate[1] as JSON, so without ""
            dataToAppend = (", \"" + key + "\" : " + value);

        }

        // otherwise
        else {
            
            // append jsonUpdate[1] as string, so with ""
            dataToAppend = (", \"" + key + "\" : \"" + value + "\"");
            
        }

        // append the value of the data as JSON
        fs.appendFile(filePath, dataToAppend, (err) => {
            if (err) {

                // log the error
                console.log(err);

                // send the undo message
                wsh.sendErrorMessage(ws, "Error updating the changes on the server. Refresh the page and try again");
                
            }
        });        
    }

}
   

/**
 *  ASYNC This function just write the specified data to the specified path
 *  Should be invoked when no one is working on the session file
 *  NOTE: because of the ID incremental assign mechanism, if an object is deleted,
 *  there's a hole (1,2, ,4,5,...). The idea is to compact the IDs again -> (1,2,3,4,...)
 *  @param filePath : the path of the file
 *  @param sessionFileName : the session file name
 *  @param data : JSON data to be written
 */
function writeClosedJSONFile (filePath, sessionFileName, data) {
    
    // new ID for objects
    var contNewID = 0;
    
    // id mapping {oldId : newID}
    var iDMap = {};
    
    // new temporary data
    var newData = {};
    
    // for each id in json data
    for (var id in data){
        
        // for avoiding inherited properties
        if (data.hasOwnProperty(id)) {
            
            // if the property is not a private one (examples in parameters.js)
            if (id.charAt(0) != "_") {
                
                // increment cont new ID
                contNewID++;
                
                // set the mapping
                iDMap[id] = contNewID;

            }
        }
    }
    
    
    // again, for each id in json data
    for (var id in data) {
        
        // for avoiding inherited properties
        if (data.hasOwnProperty(id)) {
            
            // if the property is not a private one (examples in parameters.js)
            if (id.charAt(0) != "_") {
                
                // if the object is a connection
                if (data[id]["objectClass"] === "connection") {
                    
                    //we have to modify also its internal attributes "sourceObjID" and "targetObjID"
                    data[id]["sourceObjID"] = (iDMap[data[id]["sourceObjID"]]).toString();
                    data[id]["targetObjID"] = (iDMap[data[id]["targetObjID"]]).toString();
                    
                }

                // set the ID of the object
                data[id]["id"] = iDMap[id].toString();
                
                // property contNewID of new data is data.id
                newData[iDMap[id]] = data[id];

            }
            
            // otherwise
            else {
                
                // just copy the value
                newData[id] = data[id];
            }
        }
    }
    
    // update the last created object ID
    newData[param.lastCreatedObjectIDAttr] = contNewID;
    
    // remove the last char, so '}', in order to have the possibility to 
    // append other stuff at the end of the file 
    var dataToBeWritten = JSON.stringify(newData).slice(0, -1);
    
    // simply write down the data
    fs.writeFile(filePath, dataToBeWritten, (err) => {

        if (err) {
            // TODO decide what to do
            // log the error
            console.log(err);
        }
        
        else {
            
            // remove the reference to the cached data
            data = undefined;
        }

    });
    
    // delete the history of the session file
    delete modifyHistory[sessionFileName];

}
 

/**
 *  ASYNC This function just write the specified data to the specified path
 *  Should be invoked when the file is growing too big
 *  @param filePath : the path of the file
 *  @param data : whole JSON data to be written
 */
function writeJSONFile (filePath, data) {
    
    // remove the last char, so '}', in order to have the possibility to 
    // append other stuff at the end of the file 
    var dataToBeWritten = JSON.stringify(data).slice(0, -1);
    
    // simply write down the data
    fs.writeFile(filePath, dataToBeWritten, (err) => {

        if (err) {
            // TODO decide what to do
            // log the error
            console.log(err);
            
        }
    });
}


/**
 *  SYNC This function read the coontent of the JSON file. 
 *  If it doesn't exist, return null
 *  Teorically, should be invoked only the first time a session file is requested
 *  This join
 *  @param filePath : the path of the file
 *  @return returningValue : null if the file doesn't exists or there was an error, the parsed JSON otherwise
 */
function readJSONFile (filePath) {
    
    // the returning value
    var returningValue = null;
    
    // the file descriptor
    var fileDescriptor;
    
    // has the server crashed last time,
    // so the file has to be restored?
    var isFileToBeRestored = false;

    try {

        // read the content of the file
        var data = fs.readFileSync(filePath, 'utf8');

        // the returning value is the content of the file parsed into a JSON
        returningValue = JSON.parse( (data + ' } ') );
        
        // if the result of the parse is not a JSON
        if (returningValue.constructor !== {}.constructor) {

            // throw error
            throw ("errorSessionFileJSONParse, path " + filePath);

        }

        // here we delete the "null" values in the JSON.
        // If the server have crashed, in the read file there will be a "null" value
        // for each deleted object/connection in the previous work session
        for (obj in returningValue) {
            
            var objID = obj.charAt(0);
            
            // if the ID contains an underscore, therefore the 
            // file was not closed properly the last time
            if (objID !== "_" && obj.indexOf("_") !== -1) {
                
                // set the boolean to true
                isFileToBeRestored = true;
                
            }
            
            // if the value is null
            if (returningValue[obj] == "null") {
                
                // remove the attribute from the JSON
                delete returningValue[objID];
                
            }
            
            // otherwise if the property is not a private one
            else if (objID != "_") {
                
                // if returningValue[objID] is undefined
                if (returningValue[objID] == undefined) {

                    // initialize it
                    returningValue[objID] = {};

                }

                // merge the JSONs
                util.mergeJSONs(returningValue[objID], returningValue[obj]);
                
                // if the JSONs were note sthe same
                if (objID != obj) {
                    
                    // delete the old JSON
                    delete returningValue[obj];
                    
                }
                
            }
            
        }

        // set the last created object ID attribute
        returningValue[(param.lastCreatedObjectIDAttr)] = Object.keys(returningValue).length - param.privateParametersNumber;

    }
    catch (err) {

        // log the error
        console.log(err);

        returningValue = null;

    }
    
    // is the file is to be restored
    if (isFileToBeRestored) {
        
        // write the just restored json file
        writeJSONFile(filePath, returningValue);
    
    }
        
    // return
    return returningValue;

}
   

/**
 *  this function verifies the suitability of the given name, 
 *  for both directories and files
 *  @param dirOrFileName : the directory or file name to be analyzed
 *  @return true if the name is suitable to be used as directory or file name, false otherwise
 */ 
function verifyPathName (dirOrFileName) {
    
    // regular expression to check if the given name is suitable to a directory or file name
    var re = /^[a-zA-Z_-][a-zA-Z0-9_-]*$/;

    // return the test
    return re.test(dirOrFileName)

}


/**
 *  this function retrieves all the names of the files present in the given dir
 *  if there are subDirectories, there will be an element {fileName:"", fileExtension:"sub directory name"}
 *  @param path : the dir path
 *  @param filters : array of file extensions ("txt, "js" ...) to exclude from the returning value
 *  @return returningValue : a JSON array {fileName, fileExtension} , -1 if there was an error or directory doesn't exist
 */
function getNamesFromDir (path, filters) {

    // variable for files
    var files;
    
    // returning list of files
    var returningValue = [];
    
    try {
        
        // retrieving the files
        files = fs.readdirSync(path);
        
        // for each file
        for (var i = 0 ; i < files.length ; i++) {
            
            // if the file to be excluded?
            var isFileToExclude = false;
            
            // the current file
            var currentFile = files[i];
            
            // the file name
            var fileName = currentFile.substring(0, currentFile.lastIndexOf("."));
            
            // the file extension
            var fileExtension = currentFile.substring(currentFile.lastIndexOf(".") + 1);
            
            // for each extension filter
            for (var j = 0 ; j < filters.length ; j++) {

                // if the filter match the file extension
                if (filters[j] === fileExtension) {
                    
                    // exclude the file
                    isFileToExclude = true;
                    
                }
            }
            
            // if the file has NOT to be excluded
            if (!isFileToExclude) {
                
                // add it to the list
                returningValue.push( {fileName: fileName, fileExtension : fileExtension} );
                
            }
        }
        
    }
    catch (err) { 
        
        // set the error value
        returningValue = -1;
    }

    // return
    return returningValue;
    
}


// exports
exports.createDirectory = createDirectory;
exports.createJSONFile = createJSONFile;
exports.updateJSONFile = updateJSONFile;
exports.readJSONFile = readJSONFile;
exports.verifyPathName = verifyPathName;
exports.writeClosedJSONFile = writeClosedJSONFile;
exports.writeJSONFile = writeJSONFile;
exports.getNamesFromDir = getNamesFromDir;



/**
 *  Simply check if the given path corresponds to a directory or a file
 *  @param path : the directory or file path
 *  @return returningValue : -1 if the directory path is incorrect, 0 if the directory doesn't exist, 1 if it exists
 */
function doesDirectoryOrFileExist (path) {
    
    // the value that will be returned
    var returningValue = -1;
        
    try {

        // return the sync call value that checks if the directory exists
        returningValue = (fs.existsSync(path) ? 1 : 0);

    }
    catch (err) {

        // log the error
        console.log(err);

    }
    
    // return
    return returningValue;
}