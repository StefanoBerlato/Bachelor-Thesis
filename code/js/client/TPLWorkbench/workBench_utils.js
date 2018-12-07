/**  
 *  This utility function modifies an HTML element, looping over the given attributes.
 *  @param type : either a string HTML tag to create an object from OR the object to modify
 *  @param attr : attributes (JSON) that are going to be assigned to the object
 *  @return object : the object just modified (and maybe just created)
 */
function shapeHTMLElement (type, attr) { 
    
    // the object
    var object;
    
    // if the user provided no object
    if ((typeof type) === "string") {
        
        // creating the element of specified type (parameterized in the json)
        object =  document.createElement(type);    
        
    }
    
    // otherwise
    else {
        
        // just copy the reference
        object = type;
        
    }

    // loop for each attribute in the json
    for (var temp in attr) {
        
        // if the attribute to set it the style one
            if (temp === "style") {

                // the style attribute is [style.top, style.left]
                object.style.top = attr[temp][0];
                
                // so apply the two values
                object.style.left = attr[temp][1];
                
            }
            
            // otherwise is a normal attribute
            else {

                // so set it through the method "setAttribute"
                object.setAttribute(temp, attr[temp]); 
                
            }
    }
    
    // if type is select input
    if (type === "select") {
        
        // for each option
        for (var i = 0; i < attr["options"].length; i++) {
            
            // create the option tag
            var tempOption = document.createElement("option");
            
            // set its value attribute
            tempOption.setAttribute("value", attr["options"][i]);
            
            // set the innerHTML
            tempOption.innerHTML = attr["options"][i]
            
            // finally append the objet 
            object.appendChild(tempOption);
        }
    }
    
    // return the object
    return object;                                                                 
}


/**
 *  This utility function load dinamically a JS file
 *  @param src : path file to be loaded
 *  @param callback : callback function to be invoked
 */
function loadJSFile (src, callback) {
    
    // build the file
    var script = shapeHTMLElement("script", {"src":src, "type":"application/javascript"});
    
    // loaded boolean variable
    var loaded;
    
    // if there is a callback function
    if (callback) {
        
        // on file complete load
        script.onreadystatechange = script.onload = function() {
            
            // if not loaded
            if (!loaded) {
                
                // call callback function
                callback();
            }
            
            // set loaded equal to true
            loaded = true;
        };
    }
    
    // append the file to the body
    document.body.appendChild(script);
  }


/**
 *  This function creates a connection with the given parameters.
 *  Remember that, after the connection creation, the JSPlumb event 
 *  listener "connection" will be triggered
 *  @param parameters : connection parameters
 */
function createConnection (parameters) {

    // create the connection
    var conn = jsPlumb.connect({
        source: parameters["sourceObjID"], 
        target: parameters["targetObjID"],
        anchors:[parameters["sourceAnchorType"], parameters["targetAnchorType"] ],
        parameters:{
        "myID": parameters["id"]
        }
    });

}


/**
 *  This function adds the givent amount to the clientsConnected
 *  and apply the changes to the DOM element
 *  @param amount : (string or int) the number to add to clientsConnected
 */
function updateConnectedClientsNumber (amount) {
                
    // add the number to the connected clients
    connectedClients += parseInt(amount);

    // update the number of connected clients in the DOM object
    connectedClientsDOMObject.innerHTML = connectedClients.toString();
}


/**
 *  This function adds the givent amount to the (parsed into int) lastCreatedObjectID string
 *  @param amount : (string or int) the number to add
 */
function updateLastCreatedObjectID (amount) {
                
    // parse both to int, add them, and parse again into string
    lastCreatedObjectID = (parseInt(lastCreatedObjectID) + parseInt(amount)).toString();
    
}


/**
 *  This function creates an object of the given class, 
 *  increments the last created object ID and store the JS reference
 *  @param objectClass : the object class type
 *  @param params : object initialization parameters
 *  @param scope : was the object created on page load (0), from a server message (1) or from the user (2)
 */
function createObject (objectClass, params, scope) {

    switch (scope) {
            
        // PAGE LOAD
        case 0 : 
            
            // create the object
            var obj = new window[objectClass](params);
            
            // store the reference to the JS object
            referenceFromDOMToJSObjects[params["id"]] = obj;
            break;
            
            
        // SERVER MESSAGE
        case 1 : 
            
            // just increment the last created object ID
            updateLastCreatedObjectID(1);
               
            // the scenario is: here we have previously created an object with ID "X"; this info
            // has not arrived to the server yet. Meanwhile, another client has created his own object
            // with ID "X", sent the info to the server that has broadcasted it, and the message has
            // reached this client (because of it we are in this branch of code). So what to do?
            // The right object to preserve is our one or the one arrived from the server? Obviously the latter one. 
            // So we have to delete our object and replace it with the received one
            // There will not come an "UNDO" message from the server
            if (lastCreatedObjectID == (params["id"] + 1) ) {
                
                // decrement the last object ID
                updateLastCreatedObjectID(-1);

                // call the "delete" method of the involved object
                referenceFromDOMToJSObjects[LastCreatedObjectID].delete();

                // delete the object from the JSON
                delete referenceFromDOMToJSObjects[LastCreatedObjectID];

            }
            
            // create the object
            var obj = new window[objectClass](params);
            
            // store the reference to the JS object
            referenceFromDOMToJSObjects[lastCreatedObjectID] = obj;
            
            break;
            
            
        // USER ACTION   
        case 2 : 

            // increment the last created object ID
            updateLastCreatedObjectID(1);
            
            // set the ID in the params
            params["id"] = lastCreatedObjectID;
            
            // create the object
            var obj = new window[objectClass](params);

            // send the message to the server
            sendMessage({"messageType":messageTypeAddObject, "objectClass":objectClass, "objectID":lastCreatedObjectID, "DOMParameters":params});
            
            // store the reference to the JS object
            referenceFromDOMToJSObjects[lastCreatedObjectID] = obj;
            
            break;
            
    }


}


// to store initial mouse event coordinates
var initialEventCoordinates = [0,0];

/**
 *  This function attaches the proper event listeners in order to make the graph pannable
 */
function abilitatePan() {

    // set some style property to the container, 
    // needful for the pan functionality
    container.style.position = "absolute";
    container.style.top = 0;
    container.style.left = 0;
    
    // add a mousedown event listener to "myContainer"
    myContainer.addEventListener('mousedown', function (event) {
        
        // if the target of the event was "myContainer"
        if (event.target.id === "myContainer") {
            
            // store the initial event coordinates
            initialEventCoordinates = [event.clientX - parseInt(container.style.left.slice(0,-2)), 
                                       event.clientY - parseInt(container.style.top.slice(0,-2))];
            
            // add a mousemove event listener
            myContainer.addEventListener('mousemove', mousemoveEventListener);
        }
    });

    
    // add a mouseup event listener to "myContainer"
    document.body.addEventListener('mouseup', function (event) {
        
        // remove the mousemove event listener
        myContainer.removeEventListener('mousemove', mousemoveEventListener);
    });
}


/**
 *  This is the mousemove event listener function
 */
function mousemoveEventListener () {
    
    // if the first target of the event was "myContainer"
    if (event.target.id === "myContainer") {
        
        // set left e top style property in order to pan the container
        container.style.left = ((event.clientX - initialEventCoordinates[0]).toString()) + "px";
        container.style.top  = ((event.clientY - initialEventCoordinates[1]).toString()) + "px";
        
    }
}


// the ID of the object that has its data currently shown on the configuration panel
var currentSelectedObjectID;

/**
 *  This function is invoked on any property data change from the configuration panel
 *  It retrieves its ID and, basing on the currentSelectedObjectID variable, call the 
 *  "setValueOfDataProperty" function of the proper instance object
 *  @param modifiedPropertyID : the ID of the modified property
 */
function changedDataValuOfObject (modifiedPropertyID) {

    // the property value
    var propertyValue = (modifiedPropertyID == null || modifiedPropertyID == undefined) ? null : document.getElementById(modifiedPropertyID).value;
    
    // call the proper method
    referenceFromDOMToJSObjects[currentSelectedObjectID].setValueOfDataProperty(modifiedPropertyID, propertyValue, true);
}

/**
 *  This function is invoked when the "delete" button on the configuration panel is clicked
 *  Basing on the currentSelectedObjectID variable, call the "delete" proper instance object
 */
function deleteObject () {

    // call the proper delete method
    referenceFromDOMToJSObjects[currentSelectedObjectID].delete(true);
}

