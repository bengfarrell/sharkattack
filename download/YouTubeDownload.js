var fs = require("fs"),
    util = require('util'),
    spawn = require('child_process').spawn,
    events = require("events"),
    Log = require('../utils/Log.js'),
    split = require('event-stream').split,
    FileUtils = require('../utils/File.js');

/**
 * youtube downloader - in the configuration, there are several formats to try to find
 * we try to get the first one we can based on our priorities
 * @constructor
 */
function YouTubeDownload(cfg) {

    var self = this;

    /** filename */
    this._filename = "";

    /** youtube downloader task */
    this._downloader = null;


    /**
     * download from link
     * @param url
     * @param outputDir
     */
    this.download = function(url, filename, outputDir) {
        if ( this._doesExist(outputDir, filename) === false) {
            this._downloader = null;
            this._downloader = spawn("youtube-dl",[url], { cwd: outputDir } );
            this._downloader.on('exit', this._onComplete);
            this._downloader.stdout.setEncoding('utf8');
            this._downloader.stderr.on('data', this._onErrorData);
            var line = new split();
            this._downloader.stdout.pipe(line);
            line.on('data', this._onLineOutput);

            Log.prototype.log("Youtube Download", "Now Downloading " + url);
        } else {
            Log.prototype.log("Youtube Download", "File exists - " + url);
            self.emit(YouTubeDownload.prototype.FINISH, null, {filename: filename});
        }
    }

    /**
     * line output handler
     * @param data
     * @private
     */
    this._onLineOutput = function(data) {
        if (data.indexOf("[download] Destination: ") != -1) {
            // found destination file
            self._filename = data.substr("[download] Destination: ".length, data.length);
            Log.prototype.log("Youtube Download", "Destination file found: " + self._filename);

        }
        Log.prototype.log("Youtube Download", data.toString());
    }

    /**
     * on error handler
     * @param err
     * @private
     */
    this._onErrorData = function(err) {
        Log.prototype.error("Youtube Download", err.toString());
    }

    /**
     * on complete handler
     * @param data
     * @private
     */
    this._onComplete = function(data) {
        Log.prototype.log("Youtube Download", "Complete");
        self.emit(YouTubeDownload.prototype.FINISH, null, {filename: self._filename});
    }

    /**
     * check if file does exist
     * @param outputdir
     * @param filename
     * @return {Boolean}
     * @private
     */
    this._doesExist = function(outputdir, filename) {
        if (FileUtils.prototype.doesExist(outputdir + "/" + filename + ".mp4")
            || FileUtils.prototype.doesExist(outputdir + "/" + filename + ".flv")
            || FileUtils.prototype.doesExist(outputdir + "/" + filename + ".webm")
            || FileUtils.prototype.doesExist(outputdir + "/" + filename + ".mp3") ) {
            return true;
        } else {
            return false;
        }
    }
}

util.inherits(YouTubeDownload, events.EventEmitter);

YouTubeDownload.prototype.FINISH = "onFinish";
exports = module.exports = YouTubeDownload;