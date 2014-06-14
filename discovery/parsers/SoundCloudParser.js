var request = require('request');
var events = require('events');
var util = require('util');
var FileUtils = require('../../utils/File.js');
var Log = require('../../utils/Log.js');
var sax = require("sax");
var parser = sax.parser(true);

function SoundCloudParser(source, cb, config) {
    var self = this;

    /** found items */
    this._found = [];

    if ( config && config.logging ) {
        this.logging = config.logging;
    } else {
        this.logging = function(){};
    }

    /**
     * on loaded
     * @param error
     * @param response
     * @param body
     */
    this.onLoaded = function(error, response, body) {
        if (error) {
            self.logging("SoundCloud Parser", error.toString(), { date: new Date(), level: "error", asset: source, error: error });
            cb.apply(self,  []);
        }
        self.logging("SoundCloud Parser", "Loaded " + source.url, { date: new Date(), level: "verbose", asset: source });
        if (!error && response.statusCode == 200) {
            parser.onopentag = function(tag) { self._onOpenTag(tag); }
            parser.onclosetag = function (tag) { self._onCloseTag(tag); }
            parser.ontext = function(text) { self._onText(text); }
            parser.onend = function() { self._onEnd(); }
            parser.write(body).end()
        }
    }

    /**
     * on open tag
     * @param tag
     * @private
     */
    this._onOpenTag = function(tag) {
        self._currentTag = tag;
    }

    /**
     * on close tag
     * @param tag
     * @private
     */
    this._onCloseTag = function(tag) {
        self._currentTag = null;
    }

    /**
     * on tag text
     * @param text
     * @private
     */
    this._onText = function(text) {
        if (self._currentTag && self._currentTag.name == "download-url") {
            self._found.push( { link: text, type: "mp3", assetType: "audio" })
        }
    }

    /**
     * on end parse
     * @private
     */
    this._onEnd = function() {
        var itm = {};
        var itms = [];
        itm.label = self._label;
        itm.description = "SoundCloud Playlist Item";
        itm.link = source.url;
        itm.page = source.url;


        var links = self._found;
        for ( var c in links) {
            // copy original object
            var newitm = Object.create(itm);
            for (var attr in itm) {
                if (itm.hasOwnProperty(attr)) {
                    newitm[attr] = itm[attr];
                }
            }

            // assign media
            newitm.media = links[c].link;
            newitm.filename = FileUtils.prototype.convertLinkToFilename(links[c].link, "soundcloud");
            newitm.label = FileUtils.prototype.convertLinkToFilename(links[c].link, "soundcloud");
            newitm.assetType = links[c].assetType;
            newitm.mediaType = links[c].type;

            if (links[c].publisher) {
                newitm.publisher = links[c].publisher;
            } else {
                newitm.publisher = "soundcloud";
            }

            if ( self._checkUniqueness(newitm, itms) == true) {
                itms.push(newitm);
            }
        }

        cb.apply(self,  [itms]);
    }

    /**
     * check uniqueness
     * @param newitm
     * @param itms
     * @returns {boolean}
     * @private
     */
    this._checkUniqueness = function(newitm, itms) {
        for (var c in itms) {
            if (newitm.media == itms[c].media) {
                return false;
            }
        }
        return true;
    }

    self.logging("SoundCloud Parser", "Loading " + source.url, { date: new Date(), level: "verbose", asset: source });
    request.get({url: source.url + "?client_id=" + config.soundcloud.clientID}, this.onLoaded).on('error', function(e){
        self.logging("SoundCloud Parser", "timeout on " + source.url, { date: new Date(), level: "error", asset: source, error: e });
        cb.apply(self,  []);
    }).end();


}

exports = module.exports = SoundCloudParser;