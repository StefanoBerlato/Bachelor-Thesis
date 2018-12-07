// the graph and configuration panel container
var myContainer;

// the container object for JSPlumb
var container;

// the configuration panel object
var configurationPanel;

// the configuration panel title
var configurationPanelTitle;

// where to display how many clients are connected to this session right now
var connectedClientsDOMObject;

window.onload = function () {
    
    // get the myContainer element
    myContainer = document.getElementById("myContainer");
    
    // get the container element
    container = document.getElementById("container");
    
    // get the configuration panel element
    configurationPanel = document.getElementById("configurationPanel");
    
    // get the configuration panel title element
    configurationPanelTitle = document.getElementById("configurationPanelTitle");
        
    // get the connectedClients element
    connectedClientsDOMObject = document.getElementById("connectedClients");
        
    // initialize the webSocket
    initWebSocket();
    
    // abilitate the pan functionality
    abilitatePan();
    
}