var GoogleAnalytics = require('./GoogleAnalytics.js'),
    SourcesParser = require('./../discovery/SourcesParser.js'),
    Log = require('./Log.js'),
    config = require('./../models/ConfigurationModel.js'),
    events = require("events"),
    util = require('util');

var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db;

/**
 * create a collection of songs from Google Analytics
 * @constructor
 */
function GoogleAnalyticsCollection() {
    var self = this;

    /* mongo data collections to use */
    this._collections = ["deletedsongs", "songs"];

    /** filenames to look up */
    this._ids = [];

    /** favorites list from GA */
    this._GAFavs = [];

    /** final favorites list */
    this._favoritesList = [];


    if ( config && config.logging ) {
        this.logging = config.logging;
    } else {
        this.logging = function(){};
    }

    /**
     * make collection of assets
     * @param duration
     */
    this.makeCollection = function(duration, startDate, endDate) {
        var countEstimate = parseInt(duration / (60*2)); // assume each song is 2 minutes to be safe
        var ga = new GoogleAnalytics();

        ga.startDate = startDate.getFullYear() + "-" + this._addLeadingZero(startDate.getMonth()+1) + "-" + this._addLeadingZero(startDate.getDate());
        ga.endDate = endDate.getFullYear() + "-" + this._addLeadingZero(endDate.getMonth()+1) + "-" + this._addLeadingZero(endDate.getDate());

        Log.prototype.log("Main", "Google Analytics Date Range: " + ga.startDate + " , " + ga.endDate);
        ga.account = config.googleAnalytics.account;
        ga.filters = "eventAction==favorite";
        ga.metrics = "visitors";
        ga.dimensions = "eventLabel";
        ga.sort = "visitors";
        ga.maxResults = countEstimate;

        ga.on(GoogleAnalytics.prototype.GA_COMPLETE, self._onGAResults);
        ga.on(GoogleAnalytics.prototype.GA_ERROR, self._onGAError);
        ga.login(config.googleAnalytics.username, config.googleAnalytics.password);
    }

    /**
     * on ga results
     * @param results
     * @param rankings
     */
    this._onGAResults = function(results, rankings) {
        self._GAFavs = [];
        for ( var c in results ) {
            var record = results[c];
            var fields = record.split("&");

            if (fields[0] && fields[1] && fields[2]) {
                var title = fields[0].substr("title=".length, fields[0].length);
                var sourceid = fields[1].substr("sourceid=".length, fields[1].length);
                var filename = fields[2].substr("filename=".length, fields[2].length);
                self._GAFavs.push( { title: title, sourceid: sourceid, filename: filename, rank: rankings[c] });
                Log.prototype.log("Google Analytics Collection", "Found Favorite: " + title + " from " + sourceid + " with rank " + rankings[c]);
            }
        }
        self._reconcile();
    }

    /**
     * on ga error
     * @param err
     */
    this._onGAError = function(err) {
        Log.prototype.error("Error: " + err);
    }

    /**
     * reconcile favorites
     */
    this._reconcile = function() {
        for (var c in self._GAFavs) {
            self._ids.push(self._GAFavs[c].filename);
        }
        var server = new Server(config.database.server, config.database.port, {auto_reconnect: true});
        db = new Db(config.database.dbName, server);
        db.open(function(err, db) {
            if(!err) {
                db.authenticate(config.database.username, config.database.password, function(err, mydb){
                    Log.prototype.log("Google Analytics Collection", "MongoDB Connected");

                    var clct = self._collections.pop();
                    Log.prototype.log("Google Analytics Collection", "Getting collection of " + clct);

                    db.collection(clct, function(err, collection) {
                        collection.find({"filename": { "$in": self._ids }}).toArray(self._onResults);
                    });
                });

            } else {
                Log.prototype.error("Google Analytics Collection", "Cannot connect to MongoDB: " + err);
            }
        });
    }

    /**
     * on results
     * @param error
     * @param results
     */
    this._onResults = function(error, results) {
        if (error) {
            Log.prototype.error("Google Analytics Collection", error);
        }

        if (results) {
            Log.prototype.addLineBreak();
            self._favoritesList = self._favoritesList.concat(results);
        }

        if (self._collections.length > 0) {
            var clct = self._collections.pop();
            Log.prototype.log("Google Analytics Collection", "Getting collection of " + clct);

            db.collection(clct, function(err, collection) {
                collection.find({"filename": { "$in": self._ids }}).toArray(self._onResults);
            });
        } else {
            Log.prototype.log("Google Analytics Collection", "Completed Gathering Results from Google Analytics");
            db.close();

            // rank and sort
            for (var c in self._favoritesList) {
                for (var d in self._GAFavs) {
                    if (self._favoritesList[c].filename == self._GAFavs[d].filename) {
                        self._favoritesList[c].rank = self._GAFavs[d].rank;
                    }
                }
            }

            self._favoritesList = self._favoritesList.sort( function(a, b) {
                return b.rank - a.rank;
            });
            self.emit("complete", self._favoritesList);
        }
    }

    /**
     * add a leading zero to date/month if necessary
     * @param value
     */
    this._addLeadingZero = function(value) {
        if (value.toString().length == 1) {
            return "0" + value;
        }
        return value;
    }
}

util.inherits(GoogleAnalyticsCollection, events.EventEmitter);
exports = module.exports = GoogleAnalyticsCollection;