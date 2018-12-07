/**
 *  Class SQLDatabase
 *  generic SQL database
 *  @parameters : list of DOM parameters to append to the object
 */
var SQLDatabase = objectClass.extend(function (parameters) {

    // here the JSON of object data.
    // for a complete list of input types see https://www.w3schools.com/tags/att_input_type.asp. 
    // There is also the possibility of have a "select" type input
    // JSON FORMAT:
    // "ID" : { "type" : inputType(text,password,checkbox,...), "label" : inputLabel, "value" : defaultInputValue}
    this.configurationData =  {
        
        "databaseSourceName":{"type":"text",     "label":"Data Source Name",   value:"",   "placeholder": "insert database name"        },
        "databaseSourceURL" :{"type":"url",      "label":"Data Source URL",    value:"",   "placeholder": "insert database url"         },
        "databaseSourcePort":{"type":"number",   "label":"Data Source port",   value:"",   "placeholder": "insert database host port"   },
        "databaseUsername"  :{"type":"text",     "label":"DataBase username",  value:"",   "placeholder": "insert username"             },
        "databasePassword"  :{"type":"password", "label":"DataBase password",  value:"",   "placeholder": "insert password"             },
        "queryToExecute"    :{"type":"text",     "label":"Query to execute",   value:"",   "placeholder": "insert query to execute"     }

    };
    
    // set the class name
    this.className = "SQLDatabase";
    
    // database data that this instance object will contain
    this.databaseReceivedData = undefined;
    
    // has the object already sent a request for fetching data?
    this.sendedRequest = false;
    
    // call the setUp method
    this.setUp ( parameters, SQLDatabase.className, {inputs:SQLDatabase.inputs, outputs:SQLDatabase.outputs} );
    
})

  .statics({
      // the class name
      className : "SQLDatabase",
      
      // there are at most 9 anchors available: Top - TopRight - Right - BottomRight -Bottom - BottomLeft - Left - TopLeft - Center
      inputs : [],
      outputs : [{ anchor:"Right", maxConnections:Number.MAX_SAFE_INTEGER }],
      
      // func_name: function () {}  if you need a static function, this is the syntax
  })

  .methods({

    /**
     *  This function is invoked whenever a data property of the instance is modified
     *  @param modifiedPropertyID : the modified property ID
     *  @param modifiedPropertyValue : the modified property value
     *  @param sendMessageToServer : should this function send a message to the server
     */
    setValueOfDataProperty: function (modifiedPropertyID, modifiedPropertyValue, sendMessageToServer) {

        // call the supr method, that handles messages and logic
        this.supr(modifiedPropertyID, modifiedPropertyValue, sendMessageToServer);

        var dbURL = this.configurationData["databaseSourceURL"].value;
        var dbName = this.configurationData["databaseSourceName"].value;
        var dbURLPort = this.configurationData["databaseSourcePort"].value;
        var user = this.configurationData["databaseUsername"].value;
        var pass = this.configurationData["databasePassword"].value;
        var query = this.configurationData["queryToExecute"].value;
        
        // if the change was user-made and there is not already a request that has been sent
        if (sendMessageToServer && !this.sendedRequest) {
            
            // if each configuration data property is set
            if (dbURL != "" && dbName != "" && dbURLPort != "" && user != "" && pass != "" && query != "") {
                
                // send the request, so set this true
                this.sendedRequest = true;

                // disable the button
                document.getElementById("sendConfButton").setAttribute("class", "btn btn-success active disabled");
                document.getElementById("sendConfButton").innerHTML = "loading ...";

                // send the request data message to the server
                sendMessage({   "applicantObjectID"  :  this.id,
                                "messageType"        :  messageTypeSendCommand, 
                                "databaseSourceURL"  :  dbURL,
                                "databaseSourceName" :  dbName,
                                "databaseSourcePort" :  dbURLPort,
                                "databaseUsername"   :  user,
                                "databasePassword"   :  pass,
                                "queryToExecute"     :  query
                });
            }
        }
    },
   
      
    /**
     *  This function is invoked when the requested data are sent back by the server
     *  It stores the data and call "displayData"
     */    
    handleReceivedData : function (data) {

        // requested data are back, so set this false
        this.sendedRequest = false;
        
        // reset the button original status      
        document.getElementById("sendConfButton").setAttribute("class", "btn btn-success");
        document.getElementById("sendConfButton").innerHTML = "Send configuration";
        
        // if data contains no data, but an error string
        if (data.constructor == "string".constructor) {

            // store the error as an array
            this.databaseReceivedData = [{"Error":"error"}];
            
            // alert the error to the user
            swal({
                title: "Error!",
                text: (this.className + " " + this.id + ": \n " + data),
                type: "error",
                confirmButtonColor: "#e74c3c",
                confirmButtonText: "Sorry"
            });
        }
        // if no data match the given query
        else if (data.length == 0) {

            // store just this string
            this.databaseReceivedData = [{"No Data":"no matching data"}];
            
            // alert the result to the user
            swal({
                title: "Warning!",
                text: (this.className + " " + this.id + ": \nno mathing entries" ),
                type: "warning",
                confirmButtonColor: "#f39c12",
                confirmButtonText: "Ok"
            });
            
        }
        // else
        else {
            
            // store the data
            this.databaseReceivedData = data;
            
            // alert the result to the user
            swal({
                title: "Success!",
                text: (this.className + " " + this.id + ": \nentries appended in configuration panel" ),
                type: "success",
                confirmButtonColor: "#2ecc71",
                confirmButtonText: "Gotcha"
            });
            
        }
        
        // display the data
        this.appendConfPanel();
        
    },

      
    /**
     *  This function calls the supr function, then inserts the data in a 
     *  tabular format and appends it in the right configuration panel (if there are data)
     */  
    appendConfPanel : function () {

        // call the supr function
        this.supr();
        
        // if previously a request has been sent to the server, the button should appear disabled
        if (this.sendedRequest) {
            
            // disable the button
            document.getElementById("sendConfButton").setAttribute("class", "btn btn-success active disabled");
            document.getElementById("sendConfButton").innerHTML = "loading ...";
            
        }

        // if there are data stored in the object instance
        if (this.databaseReceivedData != undefined) {
            
            // assign the data to a util var
            var data = this.databaseReceivedData;

            // create a table
            var table = document.createElement('table');

            // set bootstrap CSS class
            table.setAttribute("class", "table table-striped");

            // create the table body
            var tableBody = document.createElement('tbody');

            // for each entry
            data.forEach(function(rowData) {

                // create a row element
                var row = document.createElement('tr');

                // for each column in the entry
                for (var key in rowData){

                    // for avoiding inherited properties
                    if (rowData.hasOwnProperty(key)) {  

                        // create a cell
                        var cell = document.createElement('td');

                        // append the data
                        cell.appendChild(document.createTextNode(rowData[key]));

                        // append the cell to the row
                        row.appendChild(cell);
                    }
                }

                // append the built row to the table
                tableBody.appendChild(row);

            });

            // append the table body to the table element
            table.appendChild(tableBody);

            // inally append the table to the configuration panel
            configurationPanel.appendChild(table);

            // space
            configurationPanel.append(document.createElement("br"));
            configurationPanel.append(document.createElement("br"));
            configurationPanel.append(document.createElement("br"));
            configurationPanel.append(document.createElement("br"));
            configurationPanel.append(document.createElement("br"));
            configurationPanel.append(document.createElement("br"));

        }
    }
  })