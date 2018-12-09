define([
    'pubsub',
    'firebase',
    'nacl',
    'ext/scrypt'
], function(
    pubsub,
    firebase,
    nacl,
    scryptlib
){
/****************************************************************************/


var scryptlib = require("ext/scrypt");

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

    pubsub.publish("event:crypto.kdf.progress", 0);
    return scrypt(password, salt, function(p){
        pubsub.publish("event:crypto.kdf.progress", p);
    });
}

function encloseCredentials(mainKey, password){
    var ret = {};
    var failedAttempts = 0;
    ret.encryptMainKey = function(p){ return encrypt(p, mainKey); }
    ret.setNewPassword = function(p){
        ret.verifyPassword = function(x){
            var result = (p == x);
            if(!result){
                failedAttempts += 1;
                if(failedAttempts >= 3){
                    mainKey = null;
                    pubsub.publish("command:crypto.lock");
                }
            } else {
                failedAttempts = 0;
            }
            return result;
        }
    }
    ret.setNewPassword(password);
    ret.encrypt = function(data){ return encrypt(mainKey, data); }
    ret.decrypt = function(data){ return decrypt(mainKey, data); }
    return ret;
}


class Crypto {

    constructor (sheetID, loadExistingMainKey) {
        var self = this;
        this.sheetID = sheetID;
        this.encryptedMainKey = loadExistingMainKey;
    }

    generate (password) {
        var self = this;
        return deriveKeyFromPassword(this.sheetID, password)
            .then(function(key){
                var randomPlainMainKey = nacl.randomBytes(32);
                self.encryptedMainKey = encrypt(key, randomPlainMainKey);
                self.credentialHolder = encloseCredentials(
                    randomPlainMainKey, password);
                console.debug("Crypto engine unlocked.");
                return self.encryptedMainKey;
            })
        ;
    }

    reencrypt (oldPassword, newPassword){
        /* Generate another storagable credential that protects the random
        plain main key in another user password. Used for setting user's
        personal password instead of default. Returns a Promise.
          
          DO NOT call this method from UI, use methods in `googlesheet.js`
          instead, which take cares of sync to server.
        */
        var self = this;
        return new Promise(function(resolve, reject){
            if(!self.credentialHolder) return reject("Crypto not unlocked.");
            if(!self.credentialHolder.verifyPassword(oldPassword))
                return reject("Old password incorrect.");
        }).then(function(){
            return deriveKeyFromPassword(this.sheetID, password);
        }).then(function(key){
            var encryptedMainKey = self.credentialHolder.encryptMainKey(key);
            self.credentialHolder.setNewPassword(newPassword);
            self.encryptedMainKey = encryptedMainKey;
            return encryptedMainKey;
        });
    }

    unlock (password) {
        var self = this;
        if(this.credentialHolder) return;
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
                    self.credentialHolder = encloseCredentials(
                        plainMainKey, password);
                    pubsub.publish("event:crypto.unlocked");
                    console.debug("Crypto engine unlocked.");
                } else {
                    pubsub.publish("event:crypto.locked");
                }
            })
        ;
    }

    lock(self) {
        if(!self) self = this;
        self.credentialHolder = null;
        pubsub.publish("event:crypto.locked");
        console.debug("Crypto engine locked up.");
    }

    get unlocked(){
        return Boolean(this.credentialHolder);
    }

    encrypt(string) {
        // encrypt any UTF8-plaintext into Base64-ciphertext
        if(!this.credentialHolder) throw Error("Crypto engine not unlocked.");
        var data = nacl.util.decodeUTF8(string);
        return this.credentialHolder.encrypt(data);
    }

    decrypt(string) {
        // decrypt any Base64-ciphertext to UTF8-plaintext
        if(!this.credentialHolder) throw Error("Crypto engine not unlocked.");
        try{
            return nacl.util.encodeUTF8(this.credentialHolder.decrypt(string));
        } catch(e){
            return null;
        }
    }

}


return Crypto;
/****************************************************************************/
});
