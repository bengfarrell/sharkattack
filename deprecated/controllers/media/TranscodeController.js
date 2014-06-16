var fs = require("fs"),
    util = require('util'),
    ffmpeg = require('ffmpeg-node'),
    path = require('path'),
    FileUtils = require('../../utils/File.js'),
    Log = require('../../utils/Log.js'),
    QueueProcessor = require('../../deprecated/QueueProcessor.js');

function TranscodeController() {

    var self = this;

    /** assets found */
    this.assets = [];

    /** configuration for task */
    this.config = {};

    /**
     * process queue of assets
     */
    this.process = function(data, callback) {
        this.config = data;
        this.callback = callback;
        this.queueProcessor = new QueueProcessor(this.onComplete, this.onProcessItem);
        this.queueProcessor.process(this.config.assetslist);
    }

    /**
     * process complete
     */
    this.onComplete = function() {
        self.callback.apply(self, [ [
            {file: self.config.output, data: JSON.stringify(self.assets, null, '\t')},
            {file: self.config.removalListFile, data: JSON.stringify(self.config.removalList, null, '\t')}] ]);
    }

    /**
     * process item
     * @private
     */
    this.onProcessItem = function(item) {
        if (item.filename == undefined) {
            self.queueProcessor.next(self.queueProcessor);
            return;
        }

        switch ( item.publisher) {
            case "vimeo":
            case "youtube":
                var infile = self.config.mediaDirectory + path.sep + item.filename;
                var outfile = self.config.mediaDirectory + path.sep + FileUtils.prototype.removeExtension(item.filename)+".mp3";
                // check if file exists
                if (FileUtils.prototype.doesExist(outfile)) {
                    Log.prototype.log(TranscodeController.prototype.classDescription, "Video already transcoded: " + infile + " -- " + outfile);
                    item.filename = FileUtils.prototype.removeExtension(item.filename)+".mp3";
                    self.assets.push(item);
                    self.queueProcessor.next(self.queueProcessor);
                    return;
                }
                Log.prototype.log(TranscodeController.prototype.classDescription, "Transcoding Video: " + infile + " to " + outfile);
                // todo: get original audio bitrate and use it for transcodes
                ffmpeg.exec(["-i", infile, "-ab", "128k", outfile], self.onTranscodeAssetComplete);
                break;

            // already in the format we need
            default:
                self.assets.push(item);
                self.queueProcessor.next(self.queueProcessor);
                break;
        }
    }

    /**
     * on process asset complete
     * @private
     */
    this.onTranscodeAssetComplete = function(error, response) {
        //error is too chatty and seems to mark files as completely errored out
        if (!FileUtils.prototype.doesExist(self.config.mediaDirectory + path.sep + self.queueProcessor.currentItem.filename))  {
            Log.prototype.error(TranscodeController.prototype.classDescription, "Video Transcode Error:" + self.queueProcessor.currentItem.filename);
            self.config.removalList.push({ media: item.media, reason: "video transcode error"});
            self.queueProcessor.currentItem.transcodeError = true;
        } else {
            Log.prototype.log(TranscodeController.prototype.classDescription, "Video Transcode Complete");
            self.assets.push(self.queueProcessor.currentItem);
            if (self.config.removeVideosAfterTranscode &&
                self.queueProcessor.currentItem.filename != "" &&
                FileUtils.prototype.doesExist(self.config.mediaDirectory + path.sep + self.queueProcessor.currentItem.filename) ) {
                try {
                    Log.prototype.log(TranscodeController.prototype.classDescription, "Removing Source Video File: " + self.queueProcessor.currentItem.filename);
                    fs.unlinkSync(self.config.mediaDirectory + path.sep + self.queueProcessor.currentItem.filename);
                } catch(e) {
                    Log.prototype.log(TranscodeController.prototype.classDescription, "Unable to remove Video Source File");
                }
            }
            self.queueProcessor.currentItem.filename = FileUtils.prototype.removeExtension(self.queueProcessor.currentItem.filename)+".mp3";
        }
        self.queueProcessor.next(self.queueProcessor);
    }
}

TranscodeController.prototype.className = "TranscodeController";
TranscodeController.prototype.classDescription = "Transcode Media";
TranscodeController.prototype.stepName = "transcode";
exports = module.exports = TranscodeController;