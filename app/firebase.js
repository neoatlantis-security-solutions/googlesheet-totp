/*
PUBLISH:
    event:firebase.login
    event:firebase.logout
    event:firebase.accesstoken

SUBSCRIBE: Nothing
*/

var firebase = require('firebase'),
    firebaseui = require('firebaseui'),
    pubsub = require("./pubsub.js");

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

var inited = false;


function onFirebaseAuthStateChanged(user){
    console.debug("auth state changed", user);
    if(user){
        pubsub.publish("event:firebase.login");
    } else {
        pubsub.publish("event:firebase.logout");
    }
}

function onRedirectResult(result){
    if(!result.user) return false;
    console.debug("redirect result", result);
    var token = result.credential.accessToken;
    pubsub.publish("event:firebase.accesstoken", token);
    return false;
}


module.exports.init = function(){
    if(inited) return;
    firebase.initializeApp(CONFIG);
    
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start("#firebaseui-auth-container", options);

    firebase.auth().onAuthStateChanged(onFirebaseAuthStateChanged);
    firebase.auth().getRedirectResult().then(onRedirectResult).catch(console.error);
    inited = true;
}
