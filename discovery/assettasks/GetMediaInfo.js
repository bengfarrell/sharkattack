var mediainfo = require('mediainfo');
var path = require('path');
var FileUtils = require('../../utils/File.js');

function GetMediaInfo(asset, cb, config) {

    var self = this;

    if ( config && config.logging ) {
        this.logging = config.logging;
    } else {
        this.logging = function(){};
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
            var e = new Error("Could not get Media Info for " + asset.filename);
            self.logging("GetMediaInfo", e.toString(), { date: new Date(), level: "error", asset: asset, error: e });
            cb(e);
            return;
        }

        if (info && info[0]) {
            self.logging("GetMediaInfo", "Resolved " + asset.filename, { date: new Date(), level: "verbose", asset: asset });
            if (info[0].album) { asset.album = info[0].album; }
            if (info[0].track_name) { asset.title = info[0].track_name; }
            if (info[0].performer) { asset.artist = info[0].performer; }
            if (info[0].track_name && info[0].performer) {
                asset.label = info[0].track_name + " - " + info[0].performer;
            }
            if (info[0].recorded_date) { asset.recordingDate = info[0].recorded_date; }
            if (info[0].duration) { asset.duration = self._parseDuration(info[0].duration); }

            // todo: proper audio bitrate for videos
            if (info[0].overall_bit_rate) { asset.bitrate = info[0].overall_bit_rate; }
        }
        cb();
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

    var ref = FileUtils.prototype.getMediaFileRef(config.mediaDirectory + path.sep + asset.filename);

    if (ref == null) {
        var e = new Error("Resolve File Download Error, File does not exist: " + asset.filename);
        self.logging("GetMediaInfo", e.toString(), { date: new Date(), level: "error", asset: asset, error: e });
        cb(e);
        return;
    } else {
        mediainfo(ref, self._onMediaInfo);
    }
}

exports = module.exports = GetMediaInfo;