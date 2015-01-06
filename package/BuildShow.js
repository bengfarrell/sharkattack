var Queue = require( '../utils/Queue');
var Playlist = require('../package/Playlist');
var GetMediaInfo = require('../discovery/assettasks/GetMediaInfo');
var events = require('events');
var util = require('util');
var fs = require('fs');
var path = require('path');
var rmdir = require('rimraf');

/**
 * Build Show
 * @param config
 * @constructor
 */
function BuildShow(config) {
    var self = this;

    if (config && config.logging) {
        this.logging = config.logging;
    } else {
        this.logging = function () {
        };
    }

    /** queue of things to do */
    var q = new Queue();

    /** assets to playlist */
    this.assets = [];

    /** show duration */
    this.duration = 0;

    /** show duration */
    this.showname = 0;

    /**
     * run through and discover media from our sources
     * @param show name
     * @param show length
     * @param sources
     */
    this.run = function(showname, len, data) {
        if (typeof data === "string") {
            data = JSON.parse(fs.readFileSync(data));
        }

        this.duration = len;
        this.showname = showname;
        var index = 0;
        data.sources.forEach( function (src) {
            src.assets.forEach( function(a) {
                if (a.duration) {
                    a.index = index ++; // keeping track of original order
                    q.add(a, function(asset, cb) {
                        // verify assets
                        new GetMediaInfo(asset, function (err) {
                            if (!err) {
                                self.assets.push(a);
                            }
                            cb();
                        }, config);
                    });
                }
            });
        });

        self.logging("Build Show", "Building Show", { date: new Date(), level: "verbose" });

        rmdir(config.showLocation + path.sep + self.showname, function(error){
            if (error) {
                self.logging("Build Show", "Could not remove files in " + config.showLocation + path.sep + self.showname, { date: new Date(), level: "error", error: error });
            } else {
                self.logging("Build Show", "Removed all files in " + config.showLocation + path.sep + self.showname, { date: new Date(), level: "verbose" });
            }
        });
        q.run(self.onAssetsVerified);
    },

    /**
     * on assets verified
     */
    this.onAssetsVerified = function() {
        var orderbydate = self.assets.sort(function(a, b) {
            if (new Date(a.date).getTime() < new Date(b.date).getTime()) { return 1; }
            return -1;
        });

        // calculate how much time we need to cut
        var dur = 0;
        orderbydate.forEach( function(a) { dur += a.duration; });
        var deletetime = dur - self.duration;

        self.logging("Build Show", "Removing overtime assets (" + Math.ceil(deletetime/60) + " minutes worth)", { date: new Date(), level: "verbose" });
        // delete all overtime assets
        while (deletetime > 0) {
            var del = orderbydate.pop();
            deletetime -= del.duration;
        }

        // reorder according to original order
        self.assets = orderbydate.sort(function(a, b) {
            if (a.index < b.index) { return 1; }
            return -1;
        });

        // add the show intro/outro
        var introVO = {
            "label": "intro VO",
            "filename": config.showIntro,
            "mediaType": "mp3",
            "assetType": "audio",
            "sourceid": "vo"}

        var outroVO = {
            "label": "outtro VO",
            "filename": config.showOutro,
            "mediaType": "mp3",
            "assetType": "audio",
            "sourceid": "vo"}

        self.assets.push(introVO);
        self.assets = self.assets.reverse();
        self.assets.push(outroVO);

        var pls = new Playlist(self.assets);

        if (!fs.existsSync(config.showLocation + path.sep + self.showname)) {
            fs.mkdirSync(config.showLocation + path.sep + self.showname);
        }

        fs.writeFileSync(config.showLocation + path.sep + self.showname + path.sep + self.showname + '.html', pls.exportToHTML());
        fs.writeFileSync(config.showLocation + path.sep + self.showname + path.sep + self.showname + '.json', pls.exportToJSON());
        fs.writeFileSync(config.showLocation + path.sep + self.showname + path.sep + self.showname + '.m3u8', pls.exportToM3U8());

        self.logging("Build Show", "Copying " + self.assets.length + " assets", { date: new Date(), level: "verbose" });
        self.assets.forEach( function(a) {
            var filename = a.filename;
            if (a.audioTranscodeFilename) { filename = a.audioTranscodeFilename; }
            fs.writeFileSync(config.showLocation + path.sep + self.showname + path.sep + filename, fs.readFileSync(config.mediaDirectory + path.sep + a.sourceid + path.sep + filename));
        });

        self.emit(BuildShow.prototype.COMPLETE, pls);
    }

}

util.inherits(BuildShow, events.EventEmitter);
BuildShow.prototype.COMPLETE = "BuildShowComplete";
exports = module.exports = BuildShow;