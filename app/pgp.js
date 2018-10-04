var openpgp = require("openpgp");

module.exports.generateKey = function(email, password){
    var options = {
        userIds: [{ email: email }],
        curve: "ed25519",
        passphrase: password,
    };
    return openpgp.generateKey(options)
        .then(function(result){ return result.privateKeyArmored; });
};


