var Log = require('./../../utils/Log.js');
var util = require('util');
var QueueProcessor = require('./../../deprecated/QueueProcessor');
var OAuth= require('oauth').OAuth;
var https = require('https');

/**
 * DuplicateArtistRemovalController
 * @constructor
 */
function DuplicateArtistRemovalController() {

    var self = this;

    /** artists */
    this._artists = [];

    /** refined asset list */
    this._assets = [];

    /**
     * process
     */
    this.process = function (data, callback) {
        self.callback = callback;
        self.config = data;
        Log.prototype.log(DuplicateArtistRemovalController.prototype.className, DuplicateArtistRemovalController.prototype.classDescription + " Process");
        this.queueProcessor = new QueueProcessor(this.onComplete, this.onProcessItem );
        this.queueProcessor.process(data.assetslist);
    }


    /**
     * on queue complete
     */
    this.onComplete = function() {
        Log.prototype.log(DuplicateArtistRemovalController.prototype.className, DuplicateArtistRemovalController.prototype.classDescription + " Complete");
        self.callback.apply(self, [ [
            {file: self.config.output, data: JSON.stringify(self._assets, null, '\t')},
            {file: self.config.removalListFile, data: JSON.stringify(self.config.removalList, null, '\t')}
        ] ]);
    }

    /**
     * on process item
     */
    this.onProcessItem = function(item) {
        // drop to lowercase and remove spaces to account for alternate spellings
        var artist = item.artist.toLowerCase().replace(/\ /g,"");

        if (self._artists.indexOf(artist) == -1) {
            self._artists.push(artist);
            self._assets.push(item);
        } else if (item.artist == undefined) {
            self._assets.push(item);
        } else {
            self.config.removalList.push({ media: item.media, reason: "duplicate artist"});
            Log.prototype.log(DuplicateArtistRemovalController.prototype.className, DuplicateArtistRemovalController.prototype.classDescription + " Remove duplicate artist: " + item.label);
        }
        self.queueProcessor.next();
    }
}

DuplicateArtistRemovalController.prototype.className = "DuplicateArtistRemovalController";
DuplicateArtistRemovalController.prototype.classDescription = "Duplicate Artist Removal Complete";
exports = module.exports = DuplicateArtistRemovalController;