/**
 *  REFERENCE for klass library : https://github.com/ded/klass
 *  Class objectClass. Is the class all other object class should inherit from
 *  @param parameters : object parameters (HTML and configuration)
 */
var objectClass = klass(function (parameters) {
    
    // creating the DOM object from the parameters
    this.DOMObject = shapeHTMLElement ("img", parameters);

    // setting some attributes to the object
    this.DOMObject.heigth = 50;
    this.DOMObject.width = 50;
    this.DOMObject.style.position = "absolute";   // JSPlumb require this

    // append the object to the container
    container.appendChild(this.DOMObject);
    
    // initialize the configuration panel 
    this.configurationPanel = undefined;

    // set the click listener for both setting the position and the configuration panel
    this.DOMObject.addEventListener("click", this.clickEvent);

    // storing the ID
    this.id = parameters["id"].toString();

    // set the draggable behaviour
    jsPlumb.draggable(this.id);
    

})

  .statics({
    // attrName : value if you need a static attribute, this is the syntax
    //func_name: function () {}  if you need a static function, this is the syntax
  })

  .methods({
    
    /** 
     *  Set up of the object, in terms of endpoints and icon src
     *  @param parameters : object parameters (HTML and configuration)
     *  @param childClassName : the name of the child class that has been created
     *  @param endPoints : {inputs : array of JSON of input endpoints, outputs : array of JSON of output endpoints}
     */
    setUp: function ( parameters, childClassName, endPoints ) {

        this.DOMObject.src = "classesIcons/" + childClassName + "_toolbar.png";
        
        // for each input endpoint
        for (var i = 0 ; i < endPoints.outputs.length ; i++) {

            // add the source endPoint
            jsPlumb.addEndpoint(this.id, endPoints.outputs[i], sourceStyle);
        }

        // for each input endpoint
        for (var i = 0 ; i < endPoints.inputs.length ; i++) {

            // add the source endPoint
            jsPlumb.addEndpoint(this.id, endPoints.inputs[i], targetStyle);
        }
        
        // in case there are some data attributes to modify
        this.setValueOfDataProperties(parameters);
    },
      
      
    /**
     *  This function modifies the attributes of the DOM object element
     *  @param JSONAttributes : the list of json attributes to modify
     *  @param sendMessageToServer : does the function have to send the update to the server
     */
    modify: function (JSONAttributes, sendMessageToServer) {

        // modify the object parameters
        shapeHTMLElement(this.DOMObject, JSONAttributes);
        
        // if we have to send the message to the server
        if (sendMessageToServer) {
            
            // send the message to the server
            sendMessage({messageType : messageTypeModifyObject, objectID : this.id, DOMParameters : JSONAttributes});
        
        }
        
        // else, we have to apply the changes by call jsplumb repaint function
        else {

            // in case there are some data attributes to modify
            this.setValueOfDataProperties(JSONAttributes);
            
            // repaint the object. cannot use jsPlumb.repaint(this.id) 
            // because it doesn't repaint the endpoints (even if it should)
            jsPlumb.repaintEverything();
            
        }
    },
      
      
    /**
     *  This function deletes an object an all its connections
     *  @param sendMessageToServer : should this function send a message to the server
     */
    delete: function (sendMessageToServer) { 

        // first of all, remove the old configuration panel
        this.clearConfPanel();
        
        // remove the object forom the DOM and detach all the connections
        jsPlumb.remove(this.id);
        
        // if the delete was a local one, we have to notify it to the server
        if (sendMessageToServer) {
            
            // send the message to the server
            sendMessage({messageType : messageTypeDeleteObject, objectID : this.id});
        }
        
    },
      
    
    /**
     *  This function just updates the object position through the "modify" method
     */
    updatePosition : function () {

        // just invoke the modify method
        this.modify ({"style" : [this.DOMObject.style.top, this.DOMObject.style.left]}, true);
    },
      
         
    /**
     *  This function update the object position by calling the proper function "updatePosition".
     *  Then set up the configuration panel for this object
     *  NOTE: because this function is invoked by an event listener, "this" 
     *        is the event, not the JS class instance
     */ 
    clickEvent: function () {

        // get the reference to "this" object
        var thisObject = referenceFromDOMToJSObjects[this.id];
        
        // firstly, update the position
        thisObject.updatePosition();
        
        // tell that the current selected object ID is this
        currentSelectedObjectID = this.id;
        
        // append the configuration panel
        thisObject.appendConfPanel();
        
    },
      
      
    /**
     *  This function is invoked whenever there are more changes to do to the object data
     *  @param JSONParameters : the JSON of modified parameters
     */
    setValueOfDataProperties: function (JSONParameters) {

        // for each modified attribute
        for (attr in JSONParameters) {

            // for avoiding inherited properties
            if (this.configurationData.hasOwnProperty(attr)) {
            
                // set value of data property
                this.setValueOfDataProperty(attr, JSONParameters[attr], false);
            }
             
        }
             
    },
      
      
    /**
     *  This function is invoked whenever a data property of the instance is modified
     *  @param modifiedPropertyID : the modified property ID
     *  @param modifiedPropertyValue : the modified property value
     *  @param sendMessageToServer : should this function send a message to the server
     */
    setValueOfDataProperty: function (modifiedPropertyID, modifiedPropertyValue, sendMessageToServer) {

        // if the configuration panel was not build yet
        if (this.configurationPanel == undefined) {
            
            // build it
            this.buildConfPanel();
            
        }
        
        // if the property is one that actually exists
        if (this.configurationPanel.hasOwnProperty(modifiedPropertyID)){
            
            // update the value in the configuration panel
            this.configurationPanel[modifiedPropertyID][1].value = modifiedPropertyValue;
            
            // set the change of value also in the instance JSON object
            this.configurationData[modifiedPropertyID].value = modifiedPropertyValue;
        }
        
        // if the change was a local one, we have to notify it to the server
        if (sendMessageToServer) {
            
            // create the changed parameter JSON
            var ChangedParameter = {};
            ChangedParameter[modifiedPropertyID] = modifiedPropertyValue;
            
            // send the message to the server
            sendMessage({messageType : messageTypeModifyObject, objectID : this.id, DOMParameters : ChangedParameter });
        }

    },
      
      
    /**
     *  This function build the configuration panel for the current object
     *  The configuration panel is a JSON of couple (as described below)
     */
    buildConfPanel: function () {
        
        // the json ({ inputID : [ input label, HTML input object], ... })
        this.configurationPanel = {};
        
        // for each data attribute this object has
        for (key in this.configurationData) {

            // for avoiding inherited properties
            if (this.configurationData.hasOwnProperty(key)) {
                
                // store the current data object
                var currentData = this.configurationData[key];

                // set on change function
                currentData["onchange"] = "changedDataValuOfObject(this.id)";
                
                // set input element id
                currentData["id"] = key;

                // shape the property label and set its innerHTML
                var label = shapeHTMLElement("span", {});
                label.innerHTML = currentData["label"];
                
                // what kind of input? if there is a "options" parameter, it's a select input! Otherwise, simple input
                var inputType = currentData["options"] == undefined ? "input" : "select";
                
                // shape the input element and store the array [label, inputHTMLObject]
                this.configurationPanel[key] = [label, shapeHTMLElement(inputType, currentData)];
     
            }
        }
    },
      
      
    /**
     *  This function appends the configuration panel for the current object
     *  If it is the case, it builds the conf panel from the instance object data
     */ 
    appendConfPanel: function () {
        
        // first of all, remove the old configuration panel
        this.clearConfPanel();

        // if the configuration panel was not build yet
        if (this.configurationPanel == undefined) {
            
            // build it
            this.buildConfPanel();
            
        }
        
        // set the title of the configuration panel
        configurationPanelTitle.innerHTML = this.className + " " + this.id;
        
        // for each data attribute this object has
        for (key in this.configurationPanel) {

            configurationPanel.append(document.createElement("br"));
            
            // for avoiding inherited properties
            if (this.configurationPanel.hasOwnProperty(key)) {
                
                // store the current input object
                var currentInput = this.configurationPanel[key];
             
                // append the label
                configurationPanel.append(currentInput[0]);
                
                // space
                configurationPanel.append(document.createElement("br"));
                
                // append the input object
                configurationPanel.append(currentInput[1]);
            }
            
            // space twice
            configurationPanel.append(document.createElement("br"));
            configurationPanel.append(document.createElement("br"));
            
        }
        
        // space twice
        configurationPanel.append(document.createElement("br"));
        configurationPanel.append(document.createElement("br"));

        // create the delete button
        var sendConfButton = shapeHTMLElement("button", {"class":"btn btn-success", onclick:"changedDataValuOfObject(null)", id:"sendConfButton"});
        sendConfButton.innerHTML = "send configuration";

        // and append it
        configurationPanel.append(sendConfButton);

        // space twice
        configurationPanel.append(document.createElement("br"));
        configurationPanel.append(document.createElement("br"));

        // create the delete button
        var deleteButton = shapeHTMLElement("button", {"class":"btn btn-danger", onclick:"deleteObject()", id:"deleteButton"});
        deleteButton.innerHTML = "delete object";

        // and append it
        configurationPanel.append(deleteButton);
        
        // space again
        configurationPanel.append(document.createElement("br"));
        configurationPanel.append(document.createElement("br"));
        configurationPanel.append(document.createElement("br"));
        configurationPanel.append(document.createElement("br"));
        configurationPanel.append(document.createElement("br"));
        configurationPanel.append(document.createElement("br"));
        configurationPanel.append(document.createElement("br"));
        configurationPanel.append(document.createElement("br"));
        
    },

      
    /**
     *  This function clear the configuration panel from all its childs
     */   
    clearConfPanel: function () {
      
        // so, while there is a "firstChild"
        while (configurationPanel.firstChild) {

            // remove it
            configurationPanel.removeChild(configurationPanel.firstChild);

        }
        
        // reset the title of the configuration panel
        configurationPanelTitle.innerHTML = "Configuration Panel";
    }, 
      
      
    /**
     *  Notify to this class instance that has been connected with another class instance as "source"
     *  @param connID : the connection ID (not of DOM object, but the key of referenceFromDOMToJSObjects)
     *  @param thisAnchor : the anchor type (so "Bottom", "Left", ...) used for the connection by this instance
     *  @param targetAnchor : the anchor type used for the connection by the target instance object
     *  @param targetClassInstance : the other instance "target" of the connection
     */
    connectedAsSource: function (connID, thisAnchor, targetAnchor, targetClassInstance) { 
        // abstract
    },
      
      
    /**
     *  Notify to this class instance that has been connected with another class instance as "target"
     *  @param connID : the connection ID (not of DOM object, but the key of referenceFromDOMToJSObjects)
     *  @param thisAnchor : the anchor type (so "Bottom", "Left", ...) used for the connection by this instance
     *  @param sourceAnchor : the anchor type used for the connection by the source instance object
     *  @param targetClassInstance : the other instance "source" of the connection
     */ 
    connectedAsTarget: function (connID, thisAnchor, sourceAnchor, sourceClassInstance) { 
        // abstract        

    },
      
      
    /**
     *  Notify to this class instance that has been disconnected with another class instance as "source"
     *  @param connID : the connection ID (not of DOM object, but the key of referenceFromDOMToJSObjects)
     */
    disconnectedAsSource: function (connID) { 
        // abstract
    },
    
      
    /**
     *  Notify to this class instance that has been disconnected with another class instance as "target"
     *  @param connID : the connection ID (not of DOM object, but the key of referenceFromDOMToJSObjects)
     */ 
    disconnectedAsTarget: function (connID) { 
        // abstract
    },
  })