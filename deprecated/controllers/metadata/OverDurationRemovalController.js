var Log = require('./../../utils/Log.js');
var QueueProcessor = require('./../../deprecated/QueueProcessor');

/**
 * OverDurationRemovalController
 * @constructor
 */
function OverDurationRemovalController() {

    var self = this;

    /** refined asset list */
    this._assets = [];


    /**
     * process
     */
    this.process = function (data, callback) {
        self.callback = callback;
        self.config = data;
        Log.prototype.log(OverDurationRemovalController.prototype.className, OverDurationRemovalController.prototype.classDescription + " Process");
        this.queueProcessor = new QueueProcessor(this.onComplete, this.onProcessItem );
        this.queueProcessor.process(data.assetslist);

    }


    /**
     * on queue complete
     */
    this.onComplete = function() {
        Log.prototype.log(OverDurationRemovalController.prototype.className, OverDurationRemovalController.prototype.classDescription + " Complete");
        self.callback.apply(self, [ [
            {file: self.config.output, data: JSON.stringify(self._assets, null, '\t')},
            {file: self.config.removalListFile, data: JSON.stringify(self.config.removalList, null, '\t')}] ]);
    }

    /**
     * on process item
     */
    this.onProcessItem = function(item) {
        if (item.duration < self.config.maxDuration) {
            self._assets.push(item);
        } else {
            self.config.removalList.push({ media: item.media, reason: "over duration"});
            Log.prototype.log(OverDurationRemovalController.prototype.className, OverDurationRemovalController.prototype.classDescription + "Remove asset: " + item.label + " with artist: " + item.artist + " and title: " + item.title );
        }

        self.queueProcessor.next();
    }
}

OverDurationRemovalController.prototype.className = "OverDurationRemovalController";
OverDurationRemovalController.prototype.classDescription = "Remove Assets that are Over the Max Duration";
exports = module.exports = OverDurationRemovalController;