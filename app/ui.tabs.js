/*
SUBSCRIBE:
    event:googlesheet.unavailable
*/

var pubsub = require("./pubsub.js");


var tabIDs = [
    "unavailable", "login", "display", "add"
];

var tabs = $("#tabs").tabs();

function enableOnly(){
    var enableTabs = [];
    for(var i in arguments){
        enableTabs.push(arguments[i]);
        tabs.tabs("enable", "#tab-" + arguments[i]);
    }
    if(enableTabs.length > 0){
        tabs.find('a[href="#tab-' + enableTabs[0] + '"]').click();
    }
    for(var i in tabIDs){
        if(enableTabs.indexOf(tabIDs[i]) < 0){
            tabs.tabs("disable", "#tab-" + tabIDs[i]);
        }
    }
}

enableOnly("login");


pubsub.subscribe("event:googlesheet.unavailable", function(){
    enableOnly("unavailable");
});
