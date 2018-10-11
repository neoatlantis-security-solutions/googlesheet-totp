var sheet = require("./googlesheet.js");

window.onbeforeunload = function(){
    var secret = Boolean(
        $("#tab-add").find('input[name="secret"]').val().trim());
    var unsynced = (sheet.database ? !sheet.database.synced : false);
    console.debug("Exit confirm", secret, unsynced);
    if(secret || unsynced){
        return "Warning: you have unsaved TOTP entry! Confirm to leave the page?";
    }
    return undefined;
}
