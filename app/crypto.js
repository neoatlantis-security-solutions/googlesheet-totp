/*
PUBLISH:
    event:crypto.kdf.progress (progress)
    event:crypto.unlocked
    event:crypto.locked

*/

var pubsub = require("./pubsub.js");
var nacl = require("tweetnacl");
nacl.util = require("tweetnacl-util");
var scryptlib = require("scrypt-js");

function concatUint8Array(a, b){
    var ret = new Uint8Array(a.length + b.length);
    ret.set(a);
    ret.set(b, a.length);
    return ret;
}

function encrypt(key, data){
    // both arguments must be Uint8Array
    var nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    var ciphertext = nacl.secretbox(data, nonce, key);
    return nacl.util.encodeBase64(concatUint8Array(nonce, ciphertext));
}

function decrypt(key, data){
    // key -> Uint8Array, data -> Base64 string 
    try{
        var data = nacl.util.decodeBase64(data);
        var nonce = data.slice(0, nacl.secretbox.nonceLength),
            data = data.slice(nonce.length);
        return nacl.secretbox.open(data, nonce, key);
    } catch(e){
        console.error(e);
        return null;
    }
}

function scrypt(password, salt, progressCallback){
    return new Promise(function(resolve, reject){
        var N = 65536, r = 8, p = 1, dkLen = 32;
        scryptlib(password, salt, N, r, p, dkLen, function(e, prog, key){
            if(e){
                console.debug("KDF failed.");
                reject(e);
            } else if(key){
                console.debug("KDF done.");
                resolve(new Uint8Array(key));
            } else {
                progressCallback(prog);
            }
        });
    });
}

function deriveKeyFromPassword(sheetID, password){
    // both inputs are ASCII strings
    var salt = nacl.util.decodeUTF8(sheetID),
        password = nacl.util.decodeUTF8(password);
    return scrypt(password, salt, function(p){
        pubsub.publish("event:crypto.kdf.progress", p);
    });
}


class Crypto {

    constructor (sheetID, loadExistingMainKey) {
        this.sheetID = sheetID;
        this.encryptedMainKey = loadExistingMainKey;
    }

    generate (password) {
        var self = this;
        return deriveKeyFromPassword(this.sheetID, password)
            .then(function(key){
                var randomPlainMainKey = nacl.randomBytes(32);
                self.encryptedMainKey = encrypt(key, randomPlainMainKey);
                self.__plainMainKey = randomPlainMainKey;
                pubsub.publish("event:crypto.unlocked");
                console.debug("Crypto engine unlocked.");
                return self.encryptedMainKey;
            })
        ;
    }

    unlock (password) {
        var self = this;
        if(!this.encryptedMainKey){
            throw Error("Crypto not initialized with a main key.");
        }
        if(!password){
            // If password not supplied, fails automatically without trying
            // to derive any key. Used to inform other services asking for
            // user password input.
            pubsub.publish("event:crypto.locked");
            return;
        }
        return deriveKeyFromPassword(this.sheetID, password)
            .then(function(key){
                var plainMainKey = decrypt(key, self.encryptedMainKey);
                if(plainMainKey){
                    self.__plainMainKey = plainMainKey;
                    pubsub.publish("event:crypto.unlocked");
                    console.debug("Crypto engine unlocked.");
                } else {
                    pubsub.publish("event:crypto.locked");
                }
            })
        ;
    }

}

module.exports = Crypto;
