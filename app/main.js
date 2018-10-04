var $ = require("jquery");

function main(){
    require("./googlesheet.js").init();
    require("./firebase.js").init();
}

$(main);
