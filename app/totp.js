/*
PUBLISH:
    command:firebase.logout
    command:totp.decrypt (mainKey)
    command:ui.totp.table.fillitems (items)

SUBSCRIBE:
    event:googlesheet.ready (sheetID)
    command:totp.decrypt (mainKey)
*/

var pubsub = require("./pubsub.js"),
    sheet = require("./googlesheet.js"),
    firebase = require("./firebase.js");

module.exports.init = function(){
    pubsub.subscribe("event:googlesheet.ready", startTOTP);
}

//////////////////////////////////////////////////////////////////////////////

function startTOTP(){
    console.debug("TOTP refresh engine started.");
    
    loadData();
}


function loadData(){


    return sheet.values("get")({ range: "totp!A2:B" })
    .then(function(ret){ return ret.result; })
    .then(function(data){
        var ret = {};
        var values = data.values || [];
        for(var i in values){
            ret["item-" + i] = {
                provider: values[i][0],
                secret: values[i][1].trim(),
            };
        }
        console.log(ret);
        pubsub.publish("command:ui.totp.table.fillitems", ret);
    });

    return sheet.values("get")({ range: "totp!A2:B" })
        .then(function(ret){ return ret.result; })
    ;
}
