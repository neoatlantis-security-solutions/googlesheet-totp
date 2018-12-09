require(["firebase"], function(firebase){
/****************************************************************************/


var options = {
    signInFlow: 'popup',
    signInOptions: [
        {
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets'
            ]
        }
    ],
    callbacks: {
        signInSuccessWithAuthResult: onRedirectResult, 
    }
};

function redirectToDisplay(){
    window.location.href = "/display/";
}
/*function onFirebaseAuthStateChanged(user){
    console.debug("auth state changed", user);
    if(user){
        pubsub.publish("event:firebase.login");
    } else {
        pubsub.publish("event:firebase.logout");
    }
}*/


function onRedirectResult(result){
    if(!result.user) return false;
    //console.debug("redirect result", result);
    var token = result.credential.accessToken;
    window.sessionStorage.setItem("token", token);
    window.sessionStorage.setItem("sheet", $("#sheeturl").val());
    redirectToDisplay();
    return false;
}


$(function(){
    if(
        window.sessionStorage.getItem("token") &&
        window.sessionStorage.getItem("sheet")
    ){
        return redirectToDisplay();
    }
    
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start("#firebaseui-auth-container", options);

    if(window.location.hash){
        $("#sheeturl").val(window.location.hash.slice(1));
    }

    //firebase.auth().onAuthStateChanged(onFirebaseAuthStateChanged);
    firebase.auth().getRedirectResult().then(onRedirectResult);
});


/*
module.exports.logout = function(){
    return firebase.auth().signOut();
}
pubsub.subscribe("command:firebase.logout", module.exports.logout);


module.exports.getUser = function(){
    return firebase.auth().currentUser;
}
*/



/****************************************************************************/
});
