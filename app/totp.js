/*
Keep tracks of a few TOTP codes internally, and manage the refresh jobs.
The UI will call this class only, for listing all TOTP accounts, and actuell
codes.

PUBLISH:
    event:totp.refreshed

SUBSCRIBE:
    event:googlesheet.refreshed
*/

var pubsub = require("./pubsub.js"),
    sheet = require("./googlesheet.js"),
    OTP = require("./otp.js");

module.exports.register = {}; // holds how to get a TOTP code

module.exports.init = function(){
    pubsub.subscribe("event:googlesheet.refreshed", reloadTOTP);
}

var clock = function(){
    pubsub.publish("event:totp.refreshed");
    setTimeout(clock, 30000 - (new Date().getTime()) % 30000);
}
clock();

//////////////////////////////////////////////////////////////////////////////

function generateTOTPAccessor(row, col){
    return function(){
        var secret = sheet.database.item(row, col);
        if(!secret) return null;
        try{
            return (new OTP(secret, "base32")).getTOTP();
        } catch(e){
            console.error(e);
            return null;
        }
    }
}

function reloadTOTP(){
    var count = sheet.database.count;
    var itemID, itemRow, itemCol=1, itemName, itemGenerator;
    module.exports.register = {};
    for(var itemRow=0; itemRow<count; itemRow++){
        itemID = "totp-" + itemRow;
        itemName = sheet.database.item(itemRow, 0);
        if(!itemName) itemName = "Unknown";
        module.exports.register[itemID] = {
            name: itemName,
            getTOTP: generateTOTPAccessor(
                itemRow,
                itemCol
            ),
        }
    }
    // call for update
    console.debug("TOTP reloaded.", module.exports.register);
    pubsub.publish("event:totp.refreshed");
}
