<!DOCTYPE html>

<html>
    
    <head>  
        
        <title>(:sessionName:)</title>

        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        
        <script type="text/javascript" src="/libs/jsplumb.js"></script> 
        <script type="text/javascript" src="/libs/klass.js"></script>  
        <script type="text/javascript" src="/libs/sweetalert.js"></script> 
        <script type="text/javascript" src="/parameters.js"></script> 
        <script type="text/javascript" src="/objectClass.js"></script> 
        <script type="text/javascript" src="/TPLWorkbench/workBench_init.js"></script> 
        <script type="text/javascript" src="/TPLWorkbench/workBench_utils.js"></script> 
        <script type="text/javascript" src="/TPLWorkbench/workBench_websocket.js"></script> 
        <script type="text/javascript" src="/TPLWorkbench/workBench_JSPlumb.js"></script> 
        
        <link rel="stylesheet" href="/sweetalert.css">
        <link rel="stylesheet" href="/TPLWorkbench/workBenchStyle.css">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
        
    </head>

    <body>
    
        <div class="myContainer" id="myContainer">
            <div class="main" id="container">
            </div>

            <div class="configurationPanel">
                <h3 id="configurationPanelTitle">Configuration panel</h3>
                <div class="verticalscrollmenu">
                    <div id="configurationPanel">

                    </div>
                </div>
            </div>
        </div>
        
        <div class="toolbar">
            <div class="horizontalScrollMenu">
                <div id="toolbar">

                </div>
            </div>
            <span id="connectedClients" onclick="window.history.back()"></span>
        </div>

    </body>
    
</html>