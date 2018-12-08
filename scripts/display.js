(function(){
/****************************************************************************/

var token = window.sessionStorage.getItem("token");
if(!token){
    window.location.href = "/";
    return;
}

console.log(token);


/****************************************************************************/
})();
