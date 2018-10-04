/*
PUBLISH:
    event:firebase.login
    event:firebase.logout
    event:firebase.accesstoken

SUBSCRIBE:
    command:firebase.logout
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


var inited = false;
module.exports.init = function(){
    /* Initialize firebase and associated event handlers, etc. Should be called
    only once. */

    if(inited) return;
    firebase.initializeApp(CONFIG);
    
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start("#firebaseui-auth-container", options);

    firebase.auth().onAuthStateChanged(onFirebaseAuthStateChanged);
    firebase.auth().getRedirectResult()
        .then(onRedirectResult)
        .catch(module.exports.logout);
    inited = true;
}


module.exports.logout = function(){
    return firebase.auth().signOut();
}
pubsub.subscribe("command:firebase.logout", module.exports.logout);


module.exports.getUser = function(){
    return firebase.auth().currentUser;
}
