var $ = require("jquery");

function main(){
    require("./googlesheet.js").init();
    require("./firebase.js").init();
    require("./totp.js").init();

    require("./ui.totp.table.js").init("#totp-table").fillItems({
        "test": { provider: "Google", secret: "TEST1" },
    });
}

$(main);
