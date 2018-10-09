/*
SUBSCRIBE:
    event:crypto.kdf.progress (progress)
*/

var pubsub = require("./pubsub.js");

var dialog = $("#decrypt-in-progress").dialog({
    dialogClass: "no-close",
    autoOpen: false,
});

dialog.find("div").progressbar({ value: 0, max: 100 });

var oldValue = 0, value = 0;
pubsub.subscribe("event:crypto.kdf.progress", function(progress){
    value = progress * 100;
    if(value - oldValue < 9) return;
    if(value > 95){
        dialog.dialog("open").find("div").progressbar({ value: 100 });
        dialog.dialog("close");
        oldValue = 0;
        return;
    } else {
        dialog.dialog("open").find("div").progressbar({ value: value });
        oldValue = value;
    }
});
