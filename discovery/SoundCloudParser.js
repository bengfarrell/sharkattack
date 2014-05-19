var request = require('request');
var events = require('events');
var util = require('util');
var FileUtils = require('../utils/File.js');
var Log = require('../utils/Log.js');
var sax = require("sax");
var parser = sax.parser(true);

function SoundCloudParser(config) {
    var self = this;

    this._label = "";
    this._url = "";
    this._found = [];

    this.load = function(url, label) {
        this._label = label;
        this._url = url;
        request.get({url:url + "?client_id=" + config.soundcloud.clientID}, this.onLoaded).on('error', function(e){
            Log.prototype.error("SoundCloud Parser", "timeout on " + this._url);
            Log.prototype.error(e);
        }).end()
    }

    this.onLoaded = function(error, response, body) {
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
        itm.link = self._url;
        itm.page = self._url;


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
            newitm.mediatype = links[c].type;

            if (links[c].publisher) {
                newitm.publisher = links[c].publisher;
            } else {
                newitm.publisher = "soundcloud";
            }

            if ( self._checkUniqueness(newitm, itms) == true) {
                itms.push(newitm);
            }
            self.emit(SoundCloudParser.prototype.SOUNDCLOUD_PARSING_COMPLETE, itms);
        }
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
}

util.inherits(SoundCloudParser, events.EventEmitter);


SoundCloudParser.prototype.SOUNDCLOUD_PARSING_COMPLETE = "soundcloudParsingComplete";
exports = module.exports = SoundCloudParser;