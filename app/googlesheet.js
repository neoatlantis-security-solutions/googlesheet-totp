/*
PUBLISH:
    event:googlesheet.ready

SUBSCRIBE:
    event:firebase.accesstoken
*/


var pubsub = require("./pubsub.js");

function initGoogleSheet(accessToken){
    console.debug("set access token to gapi.");
    gapi.client.setToken({ access_token: accessToken });
    pubsub.publish("event:googlesheet.ready");
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

module.exports.values = function(){
    // should only be called after "event:googlesheet.ready" heard
    return gapi.client.sheets.spreadsheets.values;
    // is simply a shortcut, can be used for read/writes
    // TODO catch internal errors
}
