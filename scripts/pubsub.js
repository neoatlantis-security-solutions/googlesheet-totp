var pubsubjs = require('pubsub-js');

module.exports.subscribe = function(topic, callback, once){
    function wrappedCallback(msg, data){
        callback(data);
    }
    if(Boolean(once)){
        pubsubjs.subscribeOnce(topic, wrappedCallback);
    } else {
        pubsubjs.subscribe(topic, wrappedCallback);
    }
}

module.exports.publish = function(topic, data){
    pubsubjs.publish(topic, data);
}
