var $ = require("jquery"),
    OTP = require("tiny-otp");

var target = null;

function updateTOTPTable(target){
    $(target).find('[data-totp-id]').each(function(){
        var secret = $(this).attr('data-totp-secret');
        if(secret){
            $(this).data('secret', secret);
            $(this).removeAttr('data-totp-secret');
        } else {
            secret = $(this).data('secret');
        }
        if(!secret) return;
        $(this).find('[data-totp-code]').text((new OTP(secret)).getTOTP());
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
    $("<tr>")
        .attr("data-totp-id", totpID)
        .data("secret", totpSecret)
        .append($("<td>").text(totpProvider))
        .append($("<td>").attr("data-totp-code", true))
        .appendTo($(target).find("table"))
    ;
}


function clearItems(){
    $(target).find("[data-totp-id]").remove();
}


module.exports.init = function(t){
    if(target) return; // cannot init for second time
    target = t;
    initUI();
    function updater(){
        updateTOTPTable(target);
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
