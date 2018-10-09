function main(){
    require("./ui.tabs.js");
    require("./ui.totp.table.js").init("#totp-table");
    require("./ui.dialog.decrypt-in-progress.js");

    require("./googlesheet.js").init();
    require("./firebase.js").init();
    require("./totp.js").init();

}

$(main);
