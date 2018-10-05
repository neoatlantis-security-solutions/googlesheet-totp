/*
PUBLISH:
    command:firebase.logout
    command:totp.decrypt (mainKey)

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

var mainKey = null, sheetID = null;

function startTOTP(_sheetID){
    sheetID = _sheetID;
    console.debug("Loading spreadsheet", sheetID);

    loadData()
        .then(readOrSetMainKey)
    ;

}


function loadData(){
    /* Try to load or initialize a user's main key. If main key exists, load
    that, see if encrypted with user's uid, or prompt and wait for user's
    PIN entry. If key cannot be encrypted due to invalid or nonexistent data,
    prompt and wait for user's decision to reset. */

    var user = firebase.getUser();
    if(!user) throw Error("No such user.");

    return sheet.values("get")({ range: "totp!A:B" })
        .then(function(ret){ return ret.result; })
    ;
}

function readOrSetMainKey(snapshot){
    console.log(arguments);
    var array = snapshot.values;
    var mainKeyExists = array && array[0][0];

    if(mainKeyExists){
        pubsub("command:totp.decrypt", array[0][0]);
        return snapshot;
    } else {
        
    }

}
