require([
    "pubsub",
    "googlesheet",
    "ui.table",

    "ui.dialog.decrypt-in-progress"
], function(
    pubsub,
    getGoogleSheet,
    table
){
/****************************************************************************/

function logout(){
    var sheetURL = window.sessionStorage.getItem("sheet");
    if(confirm("Logout and go back?")){
        window.sessionStorage.removeItem("token");
        window.location.href = "/" + (sheetURL ? "#" + sheetURL : "");
    }
}


var token = window.sessionStorage.getItem("token");
var sheetURL = window.sessionStorage.getItem("sheet");
if(!token || !sheetURL){
    console.log("Token or spreadsheet URL not recorded. Logout.");
    return logout();
}

function onGooglesheetRefreshed(googlesheet, updater){
    var count = sheet.database.count;
    var itemID, itemRow, itemName, itemGenerator;
    for(var itemRow=0; itemRow<count; itemRow++){

    };
}



async function main(){
    
    console.log("JS start.");
    try{
        var googlesheet = await getGoogleSheet(token, sheetURL);
        console.log("Googlesheet access ok.");
    } catch(e){
        console.error(e);
        return logout();
    }

    var updateTable = table("#displayTable");
    pubsub.subscribe("event:googlesheet.refreshed", function(){
        onGooglesheetRefreshed(googlesheet, updateTabler);
    });
};


main();

/****************************************************************************/
});
