/*
Keep tracks of a few TOTP codes internally, and manage the refresh jobs.
The UI will call this class only, for listing all TOTP accounts, and actuell
codes.

PUBLISH:
    command:firebase.logout
    command:totp.decrypt (mainKey)
    command:ui.totp.table.fillitems (items)

SUBSCRIBE:
    event:googlesheet.refresh
    command:totp.decrypt (mainKey)
*/

var pubsub = require("./pubsub.js"),
    sheet = require("./googlesheet.js"),
    OTP = require("./otp.js"),
    firebase = require("./firebase.js");

var register = {}; // holds where(row + col) access a TOTP entry

module.exports.init = function(){
    pubsub.subscribe("event:googlesheet.refreshed", reloadTOTP);
}


/*
// test code 
pubsub.subscribe("event:googlesheet.refreshed", function(){
    sheet.database.newRow(["Google", "testtesttest"]);
}, "once");*/

//////////////////////////////////////////////////////////////////////////////

function generateTOTPAccessor(itemAccessor, row, col){
    return function(){
        var secret = itemAccessor(row, col);
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
    console.debug("TOTP reloaded.");
    var count = sheet.database.count;
    var itemID, itemRow, itemCol=1, itemName, itemGenerator;
    register = {};
    for(var itemRow=0; itemRow<count; itemRow++){
        itemID = "totp-" + itemRow;
        itemName = sheet.database.item(itemRow, 0);
        if(!itemName) itemName = "Unknown";
        register[itemID] = {
            name: itemName,
            getTOTP: generateTOTPAccessor(
                sheet.database.item,
                itemRow,
                itemCol
            ),
        }
    }
    // call for update
    console.debug(register);
}
