var child_process = require("child_process");
var xml2js = require('xml2js');
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
            var e = new Error("Could not get Media Info for " + asset.filename + " (" + error.toString() + ")");
            self.logging("GetMediaInfo", e.toString(), { date: new Date(), level: "error", asset: asset, error: e });
            cb(e);
            return;
        }

        if (info && info.File && info.File.track && info.File.track.length) {
            info.File.track.forEach(function (track) {
                self.logging("GetMediaInfo", "Resolved " + asset.filename, { date: new Date(), level: "verbose", asset: asset });
                if (track.Album) {
                    asset.album = track.Album;
                }
                if (track.Track_name) {
                    asset.title = track.Track_name;
                }
                if (track.Performer) {
                    asset.artist = track.Performer;
                }
                if (track.Track_name && track.Performer) {
                    asset.label = track.Track_name + " - " + track.Performer;
                }
                if (track.Recorded_date) {
                    asset.recordingDate = track.Recorded_date;
                }
                if (track.Duration) {
                    asset.duration = self._parseDuration(track.Duration);
                }

                // todo: proper audio bitrate for videos
                if (track.Overall_bit_rate) {
                    asset.bitrate = track.Overall_bit_rate;
                }
            });
        } else {
            var e = new Error("Could not get Media Info for " + asset.filename);
            self.logging("GetMediaInfo", e.toString(), { date: new Date(), level: "error", asset: asset, error: e });
            cb(e);
            return;
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
            self.logging("GetMediaInfo", "Problem getting file duration", { date: new Date(), level: "error", asset: asset, error: new Error("Problem getting file duration")});
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

    var srcid;
    if (asset.source && asset.source.id) { srcid = asset.source.id; }
    if (asset.sourceid) { srcid = asset.sourceid; }

    var ref = FileUtils.prototype.getMediaFileRef(config.mediaDirectory + path.sep + srcid + path.sep + asset.filename);

    if (ref == null) {
        var e = new Error("Resolve File Download Error, File does not exist: " + asset.filename);
        self.logging("GetMediaInfo", e.toString(), { date: new Date(), level: "error", asset: asset, error: e });
        cb(e);
        return;
    } else {
        child_process.execFile(config.mediaInfoExecutable, ["--Output=XML"].concat(ref), function(err, stdout, stderr) {
            var parser = new xml2js.Parser();
            parser.addListener('end', function(result) {
                self._onMediaInfo(null, result);
            });
            var info = parser.parseString(stdout);
        });
    }
}

exports = module.exports = GetMediaInfo;