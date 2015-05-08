var ffdb = require('flat-file-db');
var events = require("events");
var util = require('util');

function Database(config) {
    var self = this;

    /** db instance */
    this.db;

    /**
     * connect to db
     * @param table
     */
    this.connect = function(table) {
        db = new ffdb( config.dbLocation + '/' + table + '.db' );

        db.on('open', function(){
            self.emit(Database.prototype.CONNECTED);
        });
    }

    /**
     * connect to db (sync)
     * @param table
     */
    this.connectSync = function(table) {
        db = new ffdb.sync( config.dbLocation + '/' + table + '.db' );
    }

    /**
     * insert doc into DB
     * @param key
     * @param value
     * @param callback
     */
    this.insert = function(key, val, cb) {
        db.put(key, val, function(err) {
            if (cb) { cb(err); }
        });
    }

    /**
     * find doc
     * @param query
     * @returns {*}
     */
    this.find = function(query) {
        return db.get(query);
    }
}

util.inherits(Database, events.EventEmitter);
Database.prototype.CONNECTED = "connected";
Database.prototype.CONNECTIONERROR = "connectionerror";
exports = module.exports = Database;