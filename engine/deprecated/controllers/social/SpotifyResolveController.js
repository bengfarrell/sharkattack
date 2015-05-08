var Log = require('./../../utils/Log.js');
var util = require('util');
var QueueProcessor = require('./../../deprecated/QueueProcessor');
var OAuth= require('oauth').OAuth;
var https = require('https');
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

/**
 * New Song Tweet Controller
 * @constructor
 *
 * @depends on Database Controller step (where we populate the new songs in our data model)
 */
function SpotifyResolveController() {

    var self = this;

    /** class name */
    this.className = SpotifyResolveController.prototype.className;

    /** class description */
    this.classDescription = SpotifyResolveController.prototype.classDescription;

    /** step name */
    this.stepName = SpotifyResolveController.prototype.stepName;


    /**
     * process
     */
    this.process = function (data, callback) {
        this.config = data;
        this.callback = callback;
        Log.prototype.log(SpotifyResolveController.prototype.className, SpotifyResolveController.prototype.classDescription + " Process");
        this.queueProcessor = new QueueProcessor(this.onComplete, this.onProcessItem );
        this.queueProcessor.process(self.config.assetslist);
    }


    /**
     * on queue complete
     */
    this.onComplete = function() {
        self.callback.apply(self, [ [{file: self.config.output, data: JSON.stringify(self.config.assetslist, null, "\t")}] ]);
    }

    /**
     * on process item
     */
    this.onProcessItem = function(item) {
        var query = item.label;
        if (item.artist && item.artist != "" && item.title && item.title != "") {
            query = item.artist + " " + item.title;
        }

        // remove anything in parenthesis to help search
        query = query.replace(/\((.*?)\)/, "");

        // remove double spaces
        query = query.replace(/  /g, " ");

        Log.prototype.log(SpotifyResolveController.prototype.className, SpotifyResolveController.prototype.classDescription + "Request URL: http://ws.spotify.com/search/1/track?q=" + encodeURIComponent(query));
        request("http://ws.spotify.com/search/1/track?q=" + encodeURIComponent(query), self.onLookupComplete);
    }

    /**
     * on tweet finished
     */
    this.onLookupComplete = function(error, response, body) {
        if (!error && response.statusCode == 200) {
            parser.parseString(body, function (err, result) {
                if (result.track && result.track.length > 1 && result.track[0]) {
                    Log.prototype.log(SpotifyResolveController.prototype.className, SpotifyResolveController.prototype.classDescription + " Spotify ID " + result.track[0]["@"].href  + " found for : " + self.queueProcessor.currentItem.label );
                    self.queueProcessor.currentItem.spotifyTrack = result.track[0]["@"].href;
                } else if ( result.track && result.track["@"] ) {
                    Log.prototype.log(SpotifyResolveController.prototype.className, SpotifyResolveController.prototype.classDescription + " Spotify ID " + result.track["@"].href  + " found for : " + self.queueProcessor.currentItem.label );
                    self.queueProcessor.currentItem.spotifyTrack = result.track["@"].href;
                } else {
                    Log.prototype.error(SpotifyResolveController.prototype.className, SpotifyResolveController.prototype.classDescription + " No tracks found for: " + self.queueProcessor.currentItem.label );
                }


                self.queueProcessor.next();
            });
        }  else if(error){
            Log.prototype.error(SpotifyResolveController.prototype.className, SpotifyResolveController.prototype.classDescription + " Error: " + error );
            self.queueProcessor.next();
        } else {
            Log.prototype.error(SpotifyResolveController.prototype.className, SpotifyResolveController.prototype.classDescription + " Error Response Code: " + response.statusCode);
            self.queueProcessor.next();
        }
    }
}

SpotifyResolveController.prototype.className = "SpotifyResolveController";
SpotifyResolveController.prototype.classDescription = "Spotify Song Lookup";
SpotifyResolveController.prototype.stepName  = "spotifyLookup";
SpotifyResolveController.prototype.SPOTIFY_LOOKUP_COMPLETE = "complete";
exports = module.exports = SpotifyResolveController;