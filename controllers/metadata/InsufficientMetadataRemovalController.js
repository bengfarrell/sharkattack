var Log = require('./../../utils/Log.js');
var util = require('util');
var QueueProcessor = require('./../QueueProcessor');
var OAuth= require('oauth').OAuth;
var https = require('https');

/**
 * InsufficientMetadataRemovalController
 * @constructor
 */
function InsufficientMetadataRemovalController() {

    var self = this;

    /** refined asset list */
    this._assets = [];


    /**
     * process
     */
    this.process = function (data, callback) {
        self.callback = callback;
        self.config = data;
        Log.prototype.log(InsufficientMetadataRemovalController.prototype.className, InsufficientMetadataRemovalController.prototype.classDescription + " Process");
        this.queueProcessor = new QueueProcessor(this.onComplete, this.onProcessItem );
        this.queueProcessor.process(data.assetslist);

    }


    /**
     * on queue complete
     */
    this.onComplete = function() {
        Log.prototype.log(InsufficientMetadataRemovalController.prototype.className, InsufficientMetadataRemovalController.prototype.classDescription + " Complete");
        self.callback.apply(self, [ [
            {file: self.config.output, data: JSON.stringify(self._assets, null, '\t')},
            {file: self.config.removalListFile, data: JSON.stringify(self.config.removalList, null, '\t')}] ]);
    }

    /**
     * on process item
     */
    this.onProcessItem = function(item) {
        var hasGoodMetadata = true;
        if (item.artist == undefined || item.artist == null) {
            hasGoodMetadata = false;
        }
        if (item.title == undefined || item.title == null) {
            hasGoodMetadata = false;
        }
        if (hasGoodMetadata) {
            self._assets.push(item);
        } else {
            self.config.removalList.push({ media: item.media, reason: "insufficient metadata"});
            Log.prototype.log(InsufficientMetadataRemovalController.prototype.className, InsufficientMetadataRemovalController.prototype.classDescription + "Remove asset: " + item.label + " with artist: " + item.artist + " and title: " + item.title );
        }

        self.queueProcessor.next();
    }
}

InsufficientMetadataRemovalController.prototype.className = "InsufficientMetadataRemovalController";
InsufficientMetadataRemovalController.prototype.classDescription = "Insufficient Metadata Asset Removal Complete";
exports = module.exports = InsufficientMetadataRemovalController;