/*
SUBSCRIBE:
    event:googlesheet.unavailable
    event:googlesheet.available
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

function hideTab(){
    for(var i in arguments){
        tabs.find('[href="#tab-' + arguments[i] + '"]').closest("li").hide();
    }
}

enableOnly("login", "add"); // TODO remove "add"
//enableOnly("login");


pubsub.subscribe("event:googlesheet.available", function(){
    hideTab("unavailable");
});

pubsub.subscribe("event:googlesheet.unavailable", function(){
    enableOnly("unavailable");
});

pubsub.subscribe("event:crypto.unlocked", function(){
    enableOnly("display", "add");
});

pubsub.subscribe("event:crypto.locked", function(){
    enableOnly("login");
});
