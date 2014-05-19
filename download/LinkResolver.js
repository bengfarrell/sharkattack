var Log = require('../utils/Log.js');
var util = require('util');
var FileUtils = require('../utils/File.js');
var events = require("events");
var request = require('request');
var spawn = require('child_process').spawn;

function LinkResolver(config) {

    var self = this;

    /** currently resolving url */
    this._currentlyResolving = "";

    /**
     * resolve
     * @param publisher
     * @param url
     */
    this.resolve = function(publisher, url) {
        switch (publisher) {
            case "rss":
            case "webpage":
                self.emit(LinkResolver.prototype.LINK_RESOLVED, null, {});
                break;

            case "youtube":
                self._currentlyResolving = url;
                youtubedl.info(url, self._onYouTubeResolved);
                break;

            case "vimeo":
                self._currentlyResolving = url;
                // youtube-dl can handle vimeo
                youtubedl.info(url, self._onVimeoResolved);
                break;

            case "soundcloud":
                self._currentlyResolving = url;

                var scReq = "";
                var trackID = url.split("%2Ftracks%2F")[1];
                if (!trackID) {
                    trackID = url.split("/tracks/")[1];
                }
                trackID = trackID.replace("/download", "");
                var scReq = "http://api.soundcloud.com/tracks/" + trackID + ".json?client_id=" + config.soundcloud.clientID;
                request(scReq, this._onSoundCloudResponse);
                break;

            default:
                self.emit(LinkResolver.prototype.LINK_RESOLVED, null, {});
                break;
        }
    }

    /**
     * on vimeo link resolved
     * @param error
     * @param HTTP response
     * @param HTTP response body
     */
    this._onSoundCloudResponse = function(error, response, body) {
        if (error) {
            self._currentlyResolving = "";
            self.emit(LinkResolver.prototype.LINK_RESOLVED, error);
            return;
        }

       /* if (response.statusCode != 200) {
            self._currentlyResolving = "";
            self.emit(LinkResolver.prototype.LINK_RESOLVED, "Error: Unsuccesful web response - Status " + response.statusCode);
            return;
        }*/

        try {
            var jresp = JSON.parse(body);
            if (jresp.sharing != "public" || jresp.downloadable == false) {
                console.log(jresp)
                self._currentlyResolving = "";
                self.emit(LinkResolver.prototype.LINK_RESOLVED, "ERROR Parse Error " + body);
                return;
            }
        } catch (e) {
            self.emit(LinkResolver.prototype.LINK_RESOLVED, "Error: Soundcloud licensing does not permit usage of this song - Sharing: " + jresp.sharing + " Downloadable: " + jresp.downloadable);
            return;
        }

        var resolved = {};
        resolved.label = jresp.title;
        resolved.title = jresp.title;
        resolved.description = jresp.description;
        resolved.type = "mp3"; // keep for backwards compatibility
        resolved.publisher = "soundcloud";
        resolved.assetType = "audio";
        resolved.duration = jresp.duration;
        resolved.media = jresp.permalink_url + "/download";

        if (jresp.title.indexOf(" - ") != -1) {
            resolved.filename = jresp.title.split(" - ")[1] + ".mp3";
        } else {
            resolved.filename = jresp.title + ".mp3";
        }

        resolved.filename = resolved.filename.replace(/\//g, "");

        Log("Link Resolved", "SoundCloud: file - " + resolved.filename + ", title - " + resolved.title);
        self.emit(LinkResolver.prototype.LINK_RESOLVED, null, resolved);
    }

    /**
     * on vimeo link resolved
     * @param error
     * @param info
     * @private
     */
    this._onVimeoResolved = function(error, info) {
       var resolved = {};

        if (error) {
            resolved.error = error;
            resolved.media = self._currentlyResolving;
            self._currentlyResolving = "";
            self.emit(LinkResolver.prototype.LINK_RESOLVED, error);
            return;
        }

        Log("Link Resolved", "Vimeo: file - " + info.filename + ", title - " + info.title + ", desc - " + info.description)
        resolved.unresolvedMedia = self._currentlyResolving;
        resolved.filename = FileUtils.prototype.removeExtension(info.filename);
        resolved.label = info.title;
        resolved.title = info.title;
        resolved.description = info.description;
        resolved.type = "vimeo"; // keep for backwards compatibility

        self.emit(LinkResolver.prototype.LINK_RESOLVED, null, resolved);
    }

    /**
     * on youtube link resolved
     * @param error
     * @param info
     * @private
     */
    this._onYouTubeResolved = function(error, info) {
        var resolved = {};

        if (error) {
            resolved.error = error;
            resolved.media = self._currentlyResolving;
            self._currentlyResolving = "";
            self.emit(LinkResolver.prototype.LINK_RESOLVED, error);
            return;
        }


        Log.prototype.log("Link Resolved", "Youtube: file - " + info.filename + ", title - " + info.title + ", desc - " + info.description)

        resolved.unresolvedMedia = self._currentlyResolving;
        //resolved.filename = info.filename; // The filename that comes back is all crazy - don't use it
        resolved.label = info.title;
        resolved.title = info.title;
        resolved.description = info.description;
        resolved.type = "youtube"; // keep for backwards compatibility

        // remove extensions since we're requesting other formats and not sure about
        // which ext we're grabbing yet
        if (resolved.filename && resolved.filename.indexOf(".flv") > -1) {
            resolved.filename = resolved.filename.substr(0,resolved.filename.indexOf(".flv"))
        }
        if (resolved.filename && resolved.filename.indexOf(".mp4") > -1) {
            resolved.filename = resolved.filename.substr(0,resolved.filename.indexOf(".mp4"))
        }
        if (resolved.filename && resolved.filename.indexOf(".webm") > -1) {
            resolved.filename = resolved.filename.substr(0,resolved.filename.indexOf(".webm"))
        }

        self.emit(LinkResolver.prototype.LINK_RESOLVED, null, resolved);
     }


    // Weird bug only on my production machine where YouTube-DL info doeesn't return file
    // Seems to work if I break it out here though...
    youtubedl = {};

    // gets info from a video
    youtubedl.info = function(url, callback, args) {
        // setup settings
        if (args == null) {
            args = [];
        } else {
            args = parseOpts(args);
        }
        args = [
            '--get-url'
            , '--get-title'
            , '--get-thumbnail'
            , '--get-description'
            , '--get-filename'
        ].concat(args);
        args.push(url);

        // call youtube-dl
        var youtubedl = spawn("youtube-dl", args);
        var err = null, info;
        youtubedl.stdout.on('data', function(data) {
            data = data.toString().split('\n');
            info = {
                title       : data[0]
                , url         : data[1]
                , thumbnail   : data[2]
                , description : data[3]
                , filename    : data[4]
            };
        });

        youtubedl.stderr.on('data', function(data) {
            data = data.toString().trim();
            err = new Error(data.substring(7, data.length - 1));
        });

        youtubedl.on('exit', function(code) {
            return callback(err, info);
        });
    };


}

util.inherits(LinkResolver, events.EventEmitter);

LinkResolver.prototype.LINK_RESOLVED = "linkResolved";
exports = module.exports = LinkResolver;