var $ = require("jquery"),
    OTP = require("./otp.js"),
    pubsub = require("./pubsub.js");

var target = null;
var secrets = {};

function updateTOTPTable(){
    $(target).find('[data-totp-id]').each(function(){
        var tid = $(this).attr("data-totp-id");
        var secret = secrets[tid];
        if(!secret) return;
        $(this).find('[data-totp-code]').text(
            (new OTP(secret, "base32")).getTOTP());
    });
}


function initUI(){
    $("<table>")
        .append($("<thead>")
            .append("<tr><th>Provider</th><th>Code</th></tr>")
        )
        .append($("<tbody>"))
        .appendTo(target)
    ;
}


function addItem(totpID, totpProvider, totpSecret){
    secrets[totpID] = totpSecret;
    $("<tr>")
        .attr("data-totp-id", totpID)
        .append($("<td>").text(totpProvider))
        .append($("<td>").attr("data-totp-code", true))
        .appendTo($(target).find("table"))
    ;
}


function clearItems(){
    $(target).find("[data-totp-id]").remove();
    secrets = {};
}


module.exports.init = function(t){
    if(target) return; // cannot init for second time
    target = t;
    initUI();
    function updater(){
        updateTOTPTable();
        setTimeout(updater, 30000);
    }
    setTimeout(updater, 30000 - (new Date().getTime()) % 30000);
    updater();
    return module.exports;
}


module.exports.fillItems = function(items){
    clearItems();
    for(var id in items){
        addItem(id, items[id].provider, items[id].secret);
    }
    updateTOTPTable();
    return module.exports;
}

pubsub.subscribe("command:ui.totp.table.fillitems", module.exports.fillItems);
