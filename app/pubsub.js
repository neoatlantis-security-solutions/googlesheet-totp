var pubsubjs = require('pubsub-js');

module.exports.subscribe = function(topic, callback, once){
    function wrappedCallback(msg, data){
        callback(data);
    }
    pubsubjs.subscribe(topic, wrappedCallback, once);
}

module.exports.publish = function(topic, data){
    pubsubjs.publish(topic, data);
}
