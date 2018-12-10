define(["pubsub"], function(pubsub){
/****************************************************************************/

$("#decrypt-in-progress").modal({ show: false });


var oldValue = 0, value = 0;
pubsub.subscribe("event:crypto.kdf.progress", function(progress){
    const dialog = $("#decrypt-in-progress");

    value = progress * 100;
    if(value - oldValue > 15){
        dialog.find(".progress-bar")
            .attr("aria-valuenow", value)
            .css({ width: value + "%" })
        ;
        oldValue = value;
    }

    if(value > 98){
        dialog.modal("hide");
        oldValue = 0;
    } else {
        dialog.modal("show");
    }
});

/****************************************************************************/
});
