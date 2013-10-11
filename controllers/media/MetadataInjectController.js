var fs = require("fs"),
    util = require('util'),
    FileInfo = require('../../download/FileInfo.js'),
    FileUtils = require('../../utils/File.js'),
    QueueProcessor = require('../QueueProcessor.js'),
    Log = require('../../utils/Log.js'),
    ffmpeg = require('ffmpeg-node');

function MetadataInjectController() {
    var self = this;

    /** file info retriever */
    this._info = new FileInfo();

    /** configuration for task */
    this.config = {};

    /**
     * process controller
     */
    this.process = function(data, callback) {
        this.config = data;
        this.callback = callback;
        this.queueProcessor = new QueueProcessor(this.onComplete, this.onProcessItem);
        this.queueProcessor.process(this.config.assetslist);
    }

    /**
     * process complete
     * @private
     */
    this.onComplete = function() {
        self.callback.apply();
    }


    /**
     * process each item
     * @private
     */
    this.onProcessItem = function(item) {
        if (FileUtils.prototype.doesExist(self.config.mediaDirectory + "/" + item.filename) ){
            self._info.resolve(item.publisher, self.config.mediaDirectory + "/" + item.filename);
        } else {
            self.queueProcessor.next(self.queueProcessor);
        }
    }

    /**
     * on metadata recieved
     * @param info
     * @private
     */
    this._onMetadata = function(info) {
        if (info.title == undefined) {
            Log.prototype.log(self.classDescription, "Injecting Metadata into: " + self.queueProcessor.currentItem.filename);
            fs.renameSync(self.config.mediaDirectory + "/" + self.queueProcessor.currentItem.filename, self.config.mediaDirectory + "/temp" + self.queueProcessor.currentItem.filename)
            ffmpeg.exec(["-i", self.config.mediaDirectory + "/temp" + self.queueProcessor.currentItem.filename, "-y", "-acodec", "copy", "-metadata", "title=" + self.queueProcessor.currentItem.label, self.config.mediaDirectory + "/" + self.queueProcessor.currentItem.filename], self._onProcessAssetComplete);
        }  else {
            self._onProcessAssetComplete();
        }
    }

    /**
    * on process asset complete
    * @private
    */
    this._onProcessAssetComplete = function(error, response) {
        try {
            fs.unlinkSync(self.config.mediaDirectory + "/temp" + self.queueProcessor.currentItem.filename);
        } catch (e) {}
        self.queueProcessor.next(self.queueProcessor);
    }


    /** add event listener */
    this._info.on(FileInfo.prototype.FILE_RESOLVED, this._onMetadata);
}

MetadataInjectController.prototype.className = "MetadataInjectController";
MetadataInjectController.prototype.classDescription = "Inject Metadata";
MetadataInjectController.prototype.stepName = "injectMetadata";
exports = module.exports = MetadataInjectController;