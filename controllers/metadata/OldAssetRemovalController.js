var Log = require('./../../utils/Log.js');
var util = require('util');
var QueueProcessor = require('./../QueueProcessor');
var OAuth= require('oauth').OAuth;
var https = require('https');

/**
 * OldAssetRemovalController
 * @constructor
 */
function OldAssetRemovalController() {

    var self = this;

    /** refined asset list */
    this._assets = [];

    /** today **/
    this._today = new Date();


    /**
     * process
     */
    this.process = function (data, callback) {
        self.callback = callback;
        self.config = data;
        Log.prototype.log(OldAssetRemovalController.prototype.className, OldAssetRemovalController.prototype.classDescription + " Process");
        this.queueProcessor = new QueueProcessor(this.onComplete, this.onProcessItem );
        this.queueProcessor.process(data.assetslist);

    }


    /**
     * on queue complete
     */
    this.onComplete = function() {
        Log.prototype.log(OldAssetRemovalController.prototype.className, OldAssetRemovalController.prototype.classDescription + " Complete");
        self.callback.apply(self, [ [
            {file: self.config.output, data: JSON.stringify(self._assets, null, '\t')},
            {file: self.config.removalListFile, data: JSON.stringify(self.config.removalList, null, '\t')}] ]);
    }

    /**
     * on process item
     */
    this.onProcessItem = function(item) {
        if (!item.date || item.isFavorite) {
            // probably a new asset
            self._assets.push(item);
            self.queueProcessor.next();
            return;
        }

        var d = new Date(item.date);
        if ((self._today.getTime() - d.getTime())/1000 /60/60 /24 < self.config.maxAgeInDays) {
            self._assets.push(item);
        } else {
            self.config.removalList.push({ media: item.media, reason: "old asset"});
            Log.prototype.log(OldAssetRemovalController.prototype.className, OldAssetRemovalController.prototype.classDescription + "Remove asset: " + item.label + " Discovered: " + d.toDateString() );
        }
        self.queueProcessor.next();
    }
}

OldAssetRemovalController.prototype.className = "OldAssetRemovalController";
OldAssetRemovalController.prototype.classDescription = "Old Asset Removal";
exports = module.exports = OldAssetRemovalController;