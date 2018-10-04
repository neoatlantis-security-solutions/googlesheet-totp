/*
PUBLISH:
    event:googlesheet.ready (sheetID)
    event:googlesheet.unavailable

SUBSCRIBE:
    event:firebase.accesstoken
*/

var sheetID = null;
var pubsub = require("./pubsub.js");

function fetchSheetID(){
    var search = /\/d\/([0-9a-zA-Z\-_]{30,})\/{0,1}/g.exec(
        window.location.toString());
    if(search && search.length > 1){
        return search[1];
    } else {
        return null;
    }
}

function initGoogleSheet(accessToken){
    console.debug("set access token to gapi.");
    gapi.client.setToken({ access_token: accessToken });
    sheetID = fetchSheetID();
    if(!sheetID){
        pubsub.publish("event:googlesheet.unavailable");
        return;
    }
    pubsub.publish("event:googlesheet.ready", sheetID);
}

function initGAPIClient(){
    gapi.client.init({
        discoveryDocs: [
            "https://sheets.googleapis.com/$discovery/rest?version=v4",
        ],
    }).then(function(){
        pubsub.subscribe("event:firebase.accesstoken", initGoogleSheet);
    });
}

module.exports.init = function(){
    return gapi.load('client', initGAPIClient);
}

module.exports.values = function(method){
    return function(opts){ 
        opts.spreadsheetId = sheetID;
        return gapi.client.sheets.spreadsheets.values[method](opts);
    }
    // should only be called after "event:googlesheet.ready" heard
    // TODO catch internal errors
}
