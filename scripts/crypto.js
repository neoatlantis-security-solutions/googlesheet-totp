define([
    'pubsub',
    'firebase',
    'openpgp.min',
    'ext/scrypt'
], function(
    pubsub,
    firebase,
    openpgp,
    scryptlib
){
/****************************************************************************/

var scryptlib = require("ext/scrypt");


function scrypt(password, salt, progressCallback){
    return new Promise(function(resolve, reject){
        var N = 16384, r = 8, p = 1, dkLen = 32;
        console.log("KDF start...this may take a while.");
        scryptlib(password, salt, N, r, p, dkLen, function(e, prog, key){
            if(e){
                console.debug("KDF failed.");
                reject(e);
            } else if(key){
                console.debug("KDF done.");
                resolve(openpgp.util.Uint8Array_to_b64(new Uint8Array(key)));
            } else {
                progressCallback(prog);
            }
        });
    });
}

function deriveKeyFromPassword(salt, password){
    // both inputs are ASCII strings
    var salt = openpgp.util.encode_utf8(salt),
        password = openpgp.util.encode_utf8(password);

    pubsub.publish("event:crypto.kdf.progress", 0);
    return scrypt(password, salt, function(p){
        pubsub.publish("event:crypto.kdf.progress", p);
    });
}

class Crypto {

    constructor (load) {
    }

    canEncrypt (){
        return Boolean(this.publicKey != undefined);
    }

    canDecrypt (){
        return Boolean(this.privateKey != undefined);  // TODO and decrypted 
    }

    async generate (uuid, password) {
        var self = this;
        var key = await deriveKeyFromPassword(uuid, password);
        var pgpKeypair = await openpgp.generateKey({
            userIds: [{ name: this.uuid }],
            curve: "ed25519",
            passphrase: key,
        });

        this.uuid = uuid;
        this.publicKey =
            (await openpgp.key.readArmored(pgpKeypair.publicKeyArmored)).keys[0];
        this.privateKey =
            (await openpgp.key.readArmored(pgpKeypair.privateKeyArmored)).keys[0];
        pubsub.publish("event:crypto.unlocked");
        return self.dump();
    }

    dump (){
        return {
            "uuid": this.uuid,
            "public": this.publicKey.armor(),
            "private": this.privateKey.armor(),
        };
    }

    async load(data){
        this.uuid = data.uuid;
        this.publicKey = (await openpgp.key.readArmored(data["public"])).keys[0];
        this.privateKey = (await openpgp.key.readArmored(data["private"])).keys[0];
        if(this.privateKey.isDecrypted()){
            console.warn("WARNING: private key is decrypted. No password?");
        }
        console.log("Loaded public and private key.");
        return;
    }

    async changePassword (newPassword) {
        if(!this.canDecrypt() || !this.uuid){
            throw Error("Must unlock crypto engine before changing password.");
        }
        var passphrase = await deriveKeyFromPassword(this.uuid, newPassword);
        var result = await this.privateKey.encrypt(passphrase);
        console.log(result);
    }

    async unlock (password) {
        console.log("Attempt to unlock crypto engine.");
        var self = this;
        if(!this.privateKey || !this.uuid){
            throw Error("Crypto not initialized with a main key.");
        }
        if(this.privateKey.isDecrypted()){
            console.log("Private key already decrypted.");
            return;
        }
        if(!password){
            // If password not supplied, fails automatically without trying
            // to derive any key. Used to inform other services asking for
            // user password input.
            console.log("No password available. User input might required.");
            pubsub.publish("event:crypto.locked");
            return;
        }
        var key = await deriveKeyFromPassword(this.uuid, password);
        try{
            await this.privateKey.decrypt(key);
            pubsub.publish("event:crypto.unlocked");
            console.debug("Crypto engine unlocked.");
        }catch(e){
            console.error(e);
            pubsub.publish("event:crypto.locked");
        }
    }

    lock (self) {
        if(!self) self = this;
        self.credentialHolder = null;
        pubsub.publish("event:crypto.locked");
        console.debug("Crypto engine locked up.");
    }

    get unlocked(){
        return Boolean(this.credentialHolder);
    }

    async encrypt (string) {
        if(!this.canEncrypt()){
            throw Error("Not ready for encryption.");
        }
        return (await openpgp.encrypt({
            message: openpgp.message.fromText(string),
            publicKeys: [this.publicKey],
        })).data;
    }

    async decrypt(string) {
        if(!this.canDecrypt()){
            throw Error("Not ready for decryption.");
        }
        return (await openpgp.decrypt({
            message: await openpgp.message.readArmored(string),
            privateKeys: [this.privateKey],
        })).data;
    }

}


return Crypto;
/****************************************************************************/
});
