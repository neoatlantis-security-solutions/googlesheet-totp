require(["googlesheet"], function(getGoogleSheet){
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

async function main(){
    console.log("JS start.");
    try{
        var googlesheet = await getGoogleSheet(token, sheetURL);
        console.log("Googlesheet access ok.");
    } catch(e){
        console.error(e);
        return logout();
    }


};


main();

/****************************************************************************/
});
