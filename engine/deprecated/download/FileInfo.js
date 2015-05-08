var Log = require('../utils/Log.js');
var mediainfo = require('mediainfo');
var util = require('util');
var events = require("events");
var FileUtils = require('../utils/File.js');

/**
 * resolve file after downloading
 * @constructor
 */
function FileResolver() {

    var self = this;

    /** currently resolving file */
    this._currentlyResolving = "";

    /**
     * doesNeedResolving
     * @param type
     * @return if needed
     */
    this.doesNeedResolving = function(type) {
        return true;
    }

    /**
     * resolve
     * @param type
     * @param url
     */
    this.resolve = function(type, fileref) {
        self._currentlyResolving = fileref;
        var ref = FileUtils.prototype.getMediaFileRef(fileref);
        console.log(ref + " vs " + fileref)
        if (ref == null) {
            var resolved = {}
            Log.prototype.log("Resolve File Download Error, File does not exist: " + fileref);
            resolved.media = self._currentlyResolving;
            self.emit(FileResolver.prototype.FILE_RESOLVED, resolved);
            self._currentlyResolving = "";
            return;
        } else {
            mediainfo(ref, self._onMediaInfo);
        }
    }

    /**
     * on media info callback
     * @param error
     * @param info
     * @private
     */
    this._onMediaInfo = function(error, info) {
        var resolved = {};

        if (error) {
            Log.prototype.log("Resolve File Download", "Could not get mediainfo for " + self._currentlyResolving);
            Log.prototype.log("Resolve File Download", error);
            resolved.error = error;
            resolved.media = self._currentlyResolving;
            self.emit(FileResolver.prototype.FILE_RESOLVED, resolved);
            self._currentlyResolving = "";
            return;
        }

        if (info && info[0]) {
            Log.prototype.log("Resolve File Download", "Resolved " + self._currentlyResolving);
            self._currentlyResolving = "";
            if (info[0].album) { resolved.album = info[0].album; }
            if (info[0].track_name) { resolved.title = info[0].track_name; }
            if (info[0].performer) { resolved.artist = info[0].performer; }
            if (info[0].track_name && info[0].performer) {
                resolved.label = info[0].track_name + " - " + info[0].performer;
            }
            if (info[0].recorded_date) { resolved.recordingDate = info[0].recorded_date; }
            if (info[0].duration) { resolved.duration = self._parseDuration(info[0].duration); }

            // todo: proper audio bitrate for videos
            if (info[0].overall_bit_rate) { resolved.bitrate = info[0].overall_bit_rate; }
        }
        self.emit(FileResolver.prototype.FILE_RESOLVED, resolved);
     }

    /**
     * parse duration
     * @param duration string
     * @return duration in seconds
     * @private
     */
    this._parseDuration = function(dur) {
        // is this string standard in all metadata? hope so
        var time = dur.split(" ");
        var min = 0;
        var sec = 0;
        var hrs = 0;

        if (time.length < 2) {
            Log.prototype.error("Resolve File Download", "Problem getting file duration");
            return 0;
        }

        for (var c in time) {
            if (time[c].indexOf("mn") != -1) {
                min = parseInt(time[c].substr(0, time[c].indexOf("mn")));
            } else if (time[c].indexOf("ms") != -1) {
                //nothing - no need for milliseconds
            } else if (time[c].indexOf("s") != -1) {
                sec = parseInt(time[c].substr(0, time[c].indexOf("s")));
            } else if (time[c].indexOf("h") != -1) {
                hrs = parseInt(time[c].substr(0, time[c].indexOf("h")));
            }
        }

        var ttl = hrs * 3600 + min * 60 + sec;
        return ttl;
    }
}

util.inherits(FileResolver, events.EventEmitter);

FileResolver.prototype.FILE_RESOLVED = "fileResolved";
exports = module.exports = FileResolver;