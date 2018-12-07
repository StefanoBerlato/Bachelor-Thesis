// util function that return the current date as string "yyyy-MM-dd hh:mm:ss"
function getCurrentDate () {
    var today = new Date();
    var ss = today.getSeconds();
    var mm = today.getMinutes();
    var hh = today.getHours();
    var dd = today.getDate();
    var MM = today.getMonth()+1;    //January is 0!
    var yyyy = today.getFullYear();

    ss = ss < 10 ? '0'+ss : ss;
    mm = mm < 10 ? '0'+mm : mm;
    hh = hh < 10 ? '0'+hh : hh;
    dd = dd < 10 ? '0'+dd : dd;
    MM = MM < 10 ? '0'+MM : MM;

    return ( yyyy + "-" + MM + "-" + dd + " " + hh + ":" + mm + ":" + ss);
}


// util function that merge the attributes in json2 into json1
function mergeJSONs (json1, json2) {
      
    // if the JSONs are not the same
    if (json1 != json2) {
    
        // for each key in json2
        for (var key in json2){

            // for avoiding inherited properties
            if (json2.hasOwnProperty(key)) {

                // add the key to json1
                json1[key] = json2[key];

            }
        }
    }
}

// export
exports.getCurrentDate = getCurrentDate;
exports.mergeJSONs = mergeJSONs;