<!DOCTYPE html>

<html >
    <head>

        <title>Choose session</title>

        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />

        <script type="text/javascript" src="TPLChooseSession/chooseSession.js"></script>
        
        <link rel="stylesheet" href="TPLChooseSession/chooseSessionStyle.css">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">

    </head>

    <body>

        (:errorMessage:)

        <div class="login">
            <div class="login-screen">

                <div class="app-title">
                    <h1>Enter Session</h1>
                    <br />
                </div>

                <div class="login-form">
                    <form method="GET" action="/workBench">
                        <input type="text" name="session" class="login-field" placeholder="session name" id="session" required/>
                        <input type="submit" value="go" class="mybtn btn-primary btn-large btn-block" />
                    </form>
                </div>
                <img id="arrow" src="chooseSession/down-arrow.png" heigth="15" width="15" onclick="displayList()">
                <div id="myList" style="display:none;">
                    <br />
                    <br />

                    <select id="sessionsList" class="form-control" onChange="OnSelectedIndexChange()">
                      <option style="display:none;" disabled selected value> select a session </option>
                      (:data ~ <option value="[:fileExtension:]">[:fileExtension:]</option>:)
                    </select>
                </div>
            </div>
        </div>
        
    </body>
    
</html>