define([], function(){

    return {
        subscribe: function(topic, callback, once){
            function wrappedCallback(eventObject){
                callback(eventObject.data);
            }
            if(Boolean(once)){
                $(window).one(topic, wrappedCallback);
            } else {
                $(window).on(topic, wrappedCallback);
            }
        },

        publish: function(topic, data){
            $(window).trigger(topic, data);
        }

    }

});
