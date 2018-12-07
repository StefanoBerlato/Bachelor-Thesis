/**
 *  Class DataSplitte
 *  split the received data into "training" and "test" dataset
 *  @parameters : list of DOM parameters to append to the object
 */
var DataSplitter = objectClass.extend(function (parameters) {

    // here the JSON of object data.
    // for a complete list of input types see https://www.w3schools.com/tags/att_input_type.asp. 
    // There is also the possibility of have a "select" type input
    // JSON FORMAT:
    // "ID" : { "type" : inputType(text,password,checkbox,...), "label" : inputLabel, "value" : defaultInputValue}
    this.configurationData =  {
        
        "url11":{"type":"number",   "label":"Training set percentage",   "value":"0"      }
        
    };
    
    // set the class name
    this.className = "DataSplitter";
    
    // call the setUp method
    this.setUp ( parameters, DataSplitter.className, {inputs:DataSplitter.inputs, outputs:DataSplitter.outputs} );

})

  .statics({
      // the class name
      className : "DataSplitter",
      
      // there are at most 9 anchors available: Top - TopRight - Right - BottomRight -Bottom - BottomLeft - Left - TopLeft - Center
      inputs : [{ anchor:"Left", maxConnections:1 }],
      outputs : [{ anchor:"TopRight", maxConnections:Number.MAX_SAFE_INTEGER }, { anchor:"BottomRight", maxConnections:Number.MAX_SAFE_INTEGER }]
      
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

    },
  })