// collecting modules for node js
var bind = require('bind');                   // bind library (to responde with file)
var express = require('express');             // express library
var app = express();                          // instantiate express

// internal libraries
var param = require('./js/server/parameters.js');         // global parameters
var fsm = require('./js/server/fileSystemManager.js');    // file system manager
var wsh = require('./js/server/webSocketHandler.js');     // webSocket handler

var errorHTML = ["<div class=\"error\">" +                  // the HTML code for errors
                    "<div class=\"error-screen\">" + 
                        "<div class=\"error-message\">" +
                            "<h4>",
                            "</h4> </div> </div> </div>" ];


// add these contents to the data sent to the user
app.use(express.static(__dirname + '/tpl'));
app.use(express.static(__dirname + '/css'));
app.use(express.static(__dirname + '/js/client'));
app.use(express.static(__dirname + '/media/'));
var favicon = require('serve-favicon');
app.use(favicon(__dirname + '/media/favicon.ico'));


// this sorts the requestes for the '/' route in get
app.get('/', function(req, res) {
    
    // http response code
    var httpResponseCode = 200;
    
    // header
    res.header("Access-Control-Allow-Origin", "*");
    
    // retrieving the already existent sessions
    var sessionDirectory = fsm.getNamesFromDir (__dirname + param.sessionsFolder, []);
    
    // data that will be binded to the TPL
    var bindingData = sessionDirectory == -1 ? {} : {"data" :sessionDirectory};
    
    // bind the chooseSession file
    bind.toFile(__dirname + '/tpl/chooseSession.tpl', bindingData, 
        function(data) 
        {
            res.writeHead(httpResponseCode, {'Content-Type': 'text/html'});
            res.end(data);  

        }
    );
    
});


// these sort the requestes for the '/workBench' routes in GET
app.get('/workBench', function(req, res) { 
    
    // params binded with the returned file
    var bindingParams = {};      
    
    // http response code
    var httpResponseCode = 200;
    
    // where the user will be redirected
    var responseFile = '/tpl/workBench.tpl';
    
    // the given session directory
    var sessionDirectory = req.query.session;
    
    // if the name given by the user is not suitable (or it's undefined)
    if (sessionDirectory == undefined || (!fsm.verifyPathName(sessionDirectory)) ) {
                
        // set the http code / BAR REQUEST
        httpResponseCode = 400;

        // where the user will be redirected
        var responseFile = '/tpl/chooseSession.tpl';
        
        // set up the error message
        bindingParams.errorMessage = errorHTML[0] + "Session name not suitable.<br />Try again" + errorHTML[1];
    }

    // if the sessions container folder doesn't exist, create it. If everything it's ok, go on
    else if (fsm.createDirectory (__dirname + param.sessionsFolder) == 1) {
        
        // add the session name to the parameters binded to the page
        bindingParams.sessionName = sessionDirectory;
        
        // the path to the session JSON file
        var sessionDirPath = __dirname + param.sessionsFolder + '/' + sessionDirectory;
        
        // create the directory, if it is a brand new one
        if (fsm.createDirectory (sessionDirPath) == 1) { 
            
            // the path to the session JSON file
            var sessionFilePath = sessionDirPath + param.sessionsFileName;
        
            // if there was an error while creating the JSON file
            if (fsm.createJSONFile (sessionFilePath, sessionDirectory) != 1) {
                
                // set the http code / INTERNAL SERVER ERROR
                httpResponseCode = 500;

                // where the user will be redirected
                var responseFile = '/tpl/chooseSession.tpl';

                // set up the error message
                bindingParams.errorMessage = errorHTML[0] + "Server error : session file not created.<br />Contact the admin or try again" + errorHTML[1];
                
            }

        }
        
        // if there was an error while creating the session folder
        else {
                
                // set the http code / INTERNAL SERVER ERROR
                httpResponseCode = 500;

                // where the user will be redirected
                var responseFile = '/tpl/chooseSession.tpl';

                // set up the error message
                bindingParams.errorMessage = errorHTML[0] + "Server error : session directoy not created.<br />Contact the admin or try again" + errorHTML[1];
            
        }
        
    }
    
    // if there was an error while creating the sessions container folder
    else {

        // set the http code / INTERNAL SERVER ERROR
        httpResponseCode = 500;

        // where the user will be redirected
        var responseFile = '/tpl/chooseSession.tpl';

        // set up the error message
        bindingParams.errorMessage = errorHTML[0] + "Server error : sessions container folder not created.<br />Contact the admin or try again" + errorHTML[1];
            
    }

    // header
    res.header("Access-Control-Allow-Origin", "*"); 
    
    // bind the response file
    bind.toFile(__dirname + responseFile, bindingParams,  
        function(data) 
        {
            res.writeHead(httpResponseCode, {'Content-Type': 'text/html'});
            res.end(data);

        }
   );
});

    



app.set('port', (process.env.PORT || param.serverPort));    // set the port of the application

app.listen(app.get('port'), function() {                    //let the server waiting for connections
    
    // log for debug purposes
    console.log('Node app is running on port', app.get('port'));
    
    // init the webSocket
    wsh.init();
    
});