var OTP = require("./otp.js");
var totp = require("./totp.js"),
    pubsub = require("./pubsub.js");

var target = $("#tab-add");

target.find('[name="confirm"]').click(function(){
    var provider = target.find('input[name="provider"]').val().trim();
    var secret = target.find('input[name="secret"]').val().trim();
    totp.add(provider, secret);
    resetForm();
});

target.find('[name="test"]').click(function(){
    var secret = target.find('input[name="secret"]').val().trim();
    target.find('[name="testcode-container"]').show()
        .find('[name="testcode"]').text((new OTP(secret, "base32")).getTOTP());
    target.find('[name="confirm"]').attr("disabled", false);
});

function resetForm(){
    target.find('[name="testcode-container"]').hide();
    target.find('[name="confirm"]').attr("disabled", true);
    target.find('input').val("");
}

resetForm();
