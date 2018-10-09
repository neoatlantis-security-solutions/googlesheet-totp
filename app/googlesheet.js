/*
PUBLISH:
    event:googlesheet.unavailable
    event:googlesheet.refreshed

SUBSCRIBE:
    event:firebase.accesstoken
    event:crypto.unlocked       // TODO
    event:crypto.locked         // TODO
*/

var sheetID = null;
var pubsub = require("./pubsub.js"),
    firebase = require("./firebase.js"),
    Crypto = require("./crypto.js");

function fetchSheetID(){
    var search = /\/d\/([0-9a-zA-Z\-_]{30,})\/{0,1}/g.exec(
        window.location.toString());
    if(search && search.length > 1){
        return search[1];
    } else {
        return null;
    }
}

function initGoogleSheet(accessToken){
    console.debug("set access token to gapi.");
    gapi.client.setToken({ access_token: accessToken });
    sheetID = fetchSheetID();
    if(!sheetID){
        pubsub.publish("event:googlesheet.unavailable");
        return;
    }
    module.exports.database = new Database(sheetID);
}

function initGAPIClient(){
    gapi.client.init({
        discoveryDocs: [
            "https://sheets.googleapis.com/$discovery/rest?version=v4",
        ],
    }).then(function(){
        pubsub.subscribe("event:firebase.accesstoken", initGoogleSheet);
    });
}


function declareReadyWhenCryptoUnlocked(){
    if(module.exports.database){
        module.exports.database.__sync();
    }
}
pubsub.subscribe("event:crypto.unlocked", declareReadyWhenCryptoUnlocked);


module.exports.init = function(){
    return gapi.load('client', initGAPIClient);
}

//////////////////////////////////////////////////////////////////////////////

class Database {
    
    constructor(sheetID){
        this.__metadata = {};
        this.__items = [];
        this.__synced = false;
        this.__needUpload = false;
        this.__needAppends = [];
        this.sheetID = sheetID;
        this.initialize();
    }

    values(method){
        var sheetID = this.sheetID;
        return function(opts){ 
            opts.spreadsheetId = sheetID;
            return gapi.client.sheets.spreadsheets.values[method](opts)
                .then(function(result){ return result.result; })
                .catch(console.error)
            ;
        }
    }

    initialize(){
        var self = this;
        console.debug("Initializing google sheet database...");
        this.values("get")({ range: "A1" })
            .then(function(result){
                var values = result.values || [["{}"]];
                self.__metadata = JSON.parse(values[0][0]);
                console.debug("Retrieved current metadata", self.__metadata);
            })
            .then(function(){self.__initCrypto(self)})
        ;
    }

    __initCrypto(self) {
        var encryptedMainKey = self.metadata("encrypted-main-key"),
            isDefaultMainKey = self.metadata("default-mainkey");
        if(encryptedMainKey){
            console.debug("Found existing main key.");
            self.crypto = new Crypto(self.sheetID, encryptedMainKey);
            if(isDefaultMainKey){
                // we are indicated the main key can be decrypted with
                // default configuration - the uid from firebase
                console.debug("Trying to unlock the crypto engine.");
                var uid = firebase.getUser().uid;
                return self.crypto.unlock(uid);
            } else {
                // Let the crypto engine send a "cannot be unlocked"
                // signal, so that other services will ask for user
                // password.
                return self.crypto.unlock();
            }
            return; // done here
        }
        // if zero metadata, initialize with at least a main key
        // and a "default" indicator
        console.debug("Main key does not exist. Generate a new one.");
        var uid = firebase.getUser().uid;
        self.crypto = new Crypto(self.sheetID);
        console.debug("New main key will be generated.");
        return self.crypto.generate(uid)
            .then(function(encryptedMainKey){
                console.debug("Saving main key.");
                return self.metadata(
                    "encrypted-main-key",
                    encryptedMainKey
                );
            })
            .then(function(){
                return self.metadata("default-mainkey", true);
            })
        ;
    }

    metadata(key, value){
        var self = this;
        if(value === undefined){
            return self.__metadata[key];
        } else {
            self.__metadata[key] = value;
            // sync
            return self.values("update")({
                range: "A1",
                valueInputOption: "RAW",
                resource: { values: [
                    [JSON.stringify(self.__metadata)]
                ] }
            });
        }
    }

    
    __sync(self) {
        /* Fetch all items from server and save them internally. */
        if(!self) var self = this;
        var next = function next(){
            setTimeout(function(){self.__sync(self);}, 1000);
        };
        if(self.__synced) return next();

        new Promise(function(resolve, reject){ resolve(); })
        .then(function(){
            // send whole-table updates
            if(!self.__needUpload) return;
            console.log("Update whole database.");
            return self.values("update")({
                range: "A2:C",
                valueInputOption: "RAW",
                resource: { values: self.__items || [[]] }
            }).then(function(){ self.__needUpload = false; });
        })
        .then(function(){
            // apply appends
            if(self.__needAppends.length < 1) return;
            console.log("Append " + self.__needAppends.length + " rows.");
            return self.values("append")({
                range: "A2",
                valueInputOption: "RAW",
                resource: { values: self.__needAppends }
            }).then(function(){ self.__needAppends = []; });
        }).then(function(){
            // refresh anyway
            console.log("Refresh dataset from server...");
            return self.values("get")({
                range: "A2:C" 
            })
        }).then(function(result){
            var values = result.values || [[]];
            self.__items = values;
            console.debug("New dataset obtained from server.", values);
            pubsub.publish("event:googlesheet.refreshed");
            self.__synced = true;
        }).then(next).catch(next);
    }


    get count(){
        return this.__items.length;
    }


    item(row, col, value) {
        if(!this.crypto.unlocked) throw Error("Crypto engine not unlocked.");
        if(value == undefined){
            return this.crypto.decrypt(this.__items[row][col]);
        } else {
            this.__items[row][col] = this.crypto.encrypt(value);
            this.__needUpload = true;
            this.__synced = false;
            return this;
        }
    }


    newRow(line) {
        /* Add a new row. `line` must be an array. */
        if(!this.crypto.unlocked) throw Error("Crypto engine not unlocked.");
        var data = [];
        for(var i in line) data.push(this.crypto.encrypt(line[i]));
        this.__needAppends.push(data);
        this.__synced = false;
    }
}
