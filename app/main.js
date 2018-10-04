var $ = require("jquery");

function main(){
    require("./googlesheet.js").init();
    require("./firebase.js").init();
    require("./totp.js").init();
}

$(main);
