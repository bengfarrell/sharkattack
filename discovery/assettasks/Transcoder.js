var fs = require("fs"),
    util = require('util'),
    ffmpeg = require('./ffmpeg-node'),
    path = require('path'),
    FileUtils = require('../../utils/File.js');

function Transcoder(asset, cb, config) {

    var self = this;

    if ( config && config.logging ) {
        this.logging = config.logging;
    } else {
        this.logging = function(){};
    }

    /**
     * on process asset complete
     * @private
     */
    this.onTranscodeAssetComplete = function(error, response) {
        //error is too chatty and seems to mark files as completely errored out
        if (!FileUtils.prototype.doesExist(config.mediaDirectory + path.sep + asset.source.id + path.sep + FileUtils.prototype.removeExtension(asset.filename)+".mp3"))  {
            self.logging("Transcoder", "Video Transcode Error: " + asset.filename, { date: new Date(), level: "error", asset: asset });
            cb(new Error("Video transcode error, output file not found " + asset.filename));
        } else {
            self.logging("Transcoder", "Video Transcode Complete: " +asset.filename, { date: new Date(), level: "verbose", asset: asset });
            asset.audioTranscodeFilename = FileUtils.prototype.removeExtension(asset.filename)+".mp3";
            cb();
        }
    }

    switch ( asset.assetType) {
        case "video":
            var infile = config.mediaDirectory + path.sep + asset.source.id + path.sep + asset.filename;
            var outfile = config.mediaDirectory + path.sep + asset.source.id + path.sep + FileUtils.prototype.removeExtension(asset.filename)+".mp3";
            // check if file exists
            if (FileUtils.prototype.doesExist(outfile)) {
                self.logging("Transcoder", "Video already transcoded: " + infile + " -- " + outfile, { date: new Date(), level: "verbose", asset: asset });
                asset.audioTranscodeFilename = FileUtils.prototype.removeExtension(asset.filename)+".mp3";
                cb();
                return;
            }
            self.logging("Transcoder", "Transcoding Video: " + infile + " to " + outfile, { date: new Date(), level: "verbose", asset: asset });
            // todo: get original audio bitrate and use it for transcodes

            ffmpeg.exec(["-i", infile, "-ab", "128k", outfile], config, self.onTranscodeAssetComplete);
            break;

        // already in the format we need
        default:
            self.logging("Transcoder", "No need to transcode " + asset.filename, { date: new Date(), level: "verbose", asset: asset });
            cb();
            break;
    }
}

exports = module.exports = Transcoder;