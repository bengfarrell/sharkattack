var fs = require("fs"),
    util = require('util'),
    spawn = require('child_process').spawn,
    events = require("events"),
    path = require('path'),
    split = require('event-stream').split,
    ffmpeg = require('../ffmpeg-node.js'),
    FileUtils = require('../../../utils/File.js');

/**
 * youtube downloaders - in the configuration, there are several formats to try to find
 * we try to get the first one we can based on our priorities
 * @constructor
 */
function YouTubeDownloader(asset, cb, cfg) {
   var self = this;

    /** filename that youtube-dl uses */
    self.downloadfilename = "";

    if ( cfg && cfg.logging ) {
        this.logging = cfg.logging;
    } else {
        this.logging = function(){};
    }

    /** youtube downloaders task */
    this._downloader = null;


    /**
     * line output handler
     * @param data
     * @private
     */
    this._onLineOutput = function(data) {
        if (data.indexOf("[download] Destination: ") != -1) {
            // found destination file
            var label = data.substr("[download] Destination: ".length, data.length);
            self.downloadfilename = label;

            var filenameIndex = label.indexOf('-' + asset.filename);
            if (filenameIndex > 0) {
                label = label.substr(0, filenameIndex);
            }
            asset.label = label;

            self.logging("Youtube Download", "Destination file found: " + asset.filename, { date: new Date(), level: "verbose", asset: asset });
        }
        self.logging("Youtube Download", data.toString(), { date: new Date(), level: "verbose", asset: asset });
    }

    /**
     * on error handler
     * @param err
     * @private
     */
    this._onErrorData = function(err) {
        self.logging("Youtube Download", err.toString(), { date: new Date(), level: "error", asset: asset });
        cb(err);
    }

    /**
     * on error handler
     * @param err
     * @private
     */
    this._onError = function(err) {
        self.logging("Youtube Download", "Please be sure to have youtube-dl installed on your machine and in your path " + err.toString(), { date: new Date(), level: "error", asset: asset });
        cb(err);
    }

    /**
     * on complete handler
     * @param data
     * @private
     */
    this._onComplete = function(data) {
        asset.filename = encodeURI(asset.filename);

        // rename file to something thats expected by the original input (we can't get filenames all the time if we skip downloads when file exists)
        if (self.downloadfilename) {
            var ext = FileUtils.prototype.getExtension(self.downloadfilename);
            try {
                fs.renameSync(cfg.mediaDirectory + path.sep + asset.source.id + path.sep + self.downloadfilename, cfg.mediaDirectory + path.sep + asset.source.id + path.sep + asset.filename + "." + ext);
            } catch(e) {}
             asset.filename = asset.filename + "." + ext;
        }

        if (asset.label) {
            self.logging("Youtube Download", "Applying title metadata of " + asset.label + " to " + asset.filename, { date: new Date(), level: "verbose", asset: asset });
            ffmpeg.exec(["-i", cfg.mediaDirectory + path.sep + asset.source.id + path.sep + asset.filename, "-y", "-acodec", "copy", "-vcodec", "copy", "-metadata", "title=" + asset.label, cfg.mediaDirectory + path.sep + asset.source.id + path.sep + "temp-" + asset.filename], cfg, function(err) {
                /*if (err) {
                    self.logging("Youtube Download", "Error Applying title metadata of " + asset.label + " to " + asset.filename + " error: " + err.toString(), { date: new Date(), level: "error", asset: asset });
                    cb();
                    return;
                }*/

                try {
                    fs.unlinkSync(cfg.mediaDirectory + path.sep + asset.source.id + path.sep + asset.filename);
                    fs.renameSync(cfg.mediaDirectory + path.sep + asset.source.id + path.sep + "temp-" + asset.filename, cfg.mediaDirectory + path.sep + asset.source.id + path.sep + asset.filename);
                    self.logging("Youtube Download", "Complete " + asset.filename, { date: new Date(), level: "verbose", asset: asset });
                    cb();
                } catch(e) {
                    self.logging("Youtube Download", "Error " + e.toString(), { date: new Date(), level: "error", asset: asset });
                    cb(e);
                }
            });
        } else {
            self.logging("Youtube Download", "Complete " + asset.filename, { date: new Date(), level: "verbose", asset: asset });
            cb();
        }
    }

    /**
     * check if file does exist
     * @param outputdir
     * @param filename
     * @return {Boolean}
     * @private
     */
    this._doesExist = function(outputdir, filename) {
        if (FileUtils.prototype.doesExist(outputdir + path.sep + encodeURI(filename) + ".mp4")) { return encodeURI(filename) + ".mp4"; }
        if (FileUtils.prototype.doesExist(outputdir + path.sep + encodeURI(filename) + ".flv")) { return encodeURI(filename) + ".flv"; }
        if (FileUtils.prototype.doesExist(outputdir + path.sep + encodeURI(filename) + ".webm")) { return encodeURI(filename) + ".webm"; }
        if (FileUtils.prototype.doesExist(outputdir + path.sep + encodeURI(filename) + ".mp3")) { return "mp3"; }
        return "";
    }


    var existsAs = this._doesExist(cfg.mediaDirectory + path.sep + asset.source.id, asset.filename);
    if ( existsAs === "") {
        if (!fs.existsSync(cfg.mediaDirectory + path.sep + asset.source.id)) {
            fs.mkdirSync(cfg.mediaDirectory + path.sep + asset.source.id);
        }

        this._downloader = null;
        this._downloader = spawn(path.resolve(cfg.youtubedlExecutable),[asset.media], { cwd: path.resolve(cfg.mediaDirectory + path.sep + asset.source.id) }).on('error', this._onError);
        this._downloader.stderr.on('data', this._onErrorData);
        this._downloader.on('exit', this._onComplete);
        this._downloader.stdout.setEncoding('utf8');
        var line = new split();
        this._downloader.stdout.pipe(line);
        line.on('data', this._onLineOutput);

        this.logging("Youtube Download", "Now Downloading " + asset.media + " into " + path.resolve(cfg.mediaDirectory + path.sep + asset.source.id), { date: new Date(), level: "verbose", asset: asset });
    } else {
        asset.filename = existsAs;
        this.logging("Youtube Download", "File exists - " + asset.media, { date: new Date(), level: "verbose", asset: asset });
        cb();
    }
}

exports = module.exports = YouTubeDownloader;