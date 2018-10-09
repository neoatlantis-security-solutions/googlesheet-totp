/*
SUBSCRIBE:
    event:totp.refreshed

*/

var totp = require("./totp.js"),
    pubsub = require("./pubsub.js");

var target = null;


function initUI(){
    $("<table>")
        .append($("<thead>")
            .append("<tr><th>Provider</th><th>Code</th></tr>")
        )
        .append($("<tbody>"))
        .appendTo(target)
    ;
}

function addItem(totpID, totpProvider, totpCode){
    $("<tr>")
        .attr("data-totp-id", totpID)
        .append($("<td>").text(totpProvider))
        .append($("<td>").text(totpCode))
        .appendTo($(target).find("table"))
    ;
}


function clearItems(){
    $(target).find("[data-totp-id]").remove();
}

function updateTOTPTable(){
    clearItems();
    for(var id in totp.register){
        var item = totp.register[id];
        addItem(id, item.name, item.getTOTP());
    }
}


module.exports.init = function(t){
    if(target) return; // cannot init for second time
    target = t;
    initUI();
    pubsub.subscribe("event:totp.refreshed", updateTOTPTable);
    return module.exports;
}
