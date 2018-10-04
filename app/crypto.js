var nacl = require("tweetnacl");
nacl.util = require("tweetnacl-util");

function deriveKeyFromPassword(password){
    return password; // XXX wrong! for simplicity just for now.
}


module.exports.generateMainKey = function(password){
    var mainkey = nacl.box.keyPair().secretKey;

}
