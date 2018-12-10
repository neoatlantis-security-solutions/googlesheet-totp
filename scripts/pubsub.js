define([], function(){

    return {
        subscribe: function(topic, callback, once){
            function wrappedCallback(eventObject, data){
                callback(data ? data.payload : undefined);
            }
            if(Boolean(once)){
                $(window).one(topic, wrappedCallback);
            } else {
                $(window).on(topic, wrappedCallback);
            }
        },

        publish: function(topic, data){
            $(window).trigger(topic, { payload: data});
        }

    }

});
