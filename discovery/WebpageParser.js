var request = require('request');
var events = require('events');
var util = require('util');
var MediaFinder = require('./MediaFinder.js');
var FileUtils = require('../utils/File.js');
var Log = require('../utils/Log.js');

function WebpageParser (config) {
    var self = this;

    this._label = "";
    this._url = "";

    this.loadPage = function(url, label) {
        this._label = label;
        this._url = url;
        request.get({url:url}, this.onPageLoaded).on('error', function(e){
            Log.prototype.error("Webpage Parser", "Webpage timeout on " + this._url);
            self.emit(WebpageParser.prototype.WEBPAGE_PARSING_COMPLETE, []);
        }).end()
    }

    this.onPageLoaded = function(error, response, body) {
        var itms = [];
        var itm = {};
        itm.label = self._label;
        itm.description = "Scraped from Page";
        itm.link = self._url;
        itm.page = self._url;

        if (!error && response.statusCode == 200) {
            var mf = new MediaFinder(config);
            var links = mf.findMediaFromText(body);

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
                newitm.filename = FileUtils.prototype.convertLinkToFilename(links[c].link);
                newitm.label = FileUtils.prototype.convertLinkToFilename(links[c].link);
                newitm.assetType = links[c].assetType;
                newitm.mediatype = links[c].type;

                if (links[c].publisher) {
                    newitm.publisher = links[c].publisher;
                } else {
                    newitm.publisher = "webpage";
                }

                if ( self._checkUniqueness(newitm, itms) == true) {
                    itms.push(newitm);
                }
            }
        }
        self.emit(WebpageParser.prototype.WEBPAGE_PARSING_COMPLETE, itms);
    }


    this._checkUniqueness = function(newitm, itms) {
        for (var c in itms) {
            if (newitm.media == itms[c].media) {
                return false;
            }
        }
        return true;
    }
}

util.inherits(WebpageParser, events.EventEmitter);


WebpageParser.prototype.WEBPAGE_PARSING_COMPLETE = "webpageParsingComplete";
exports = module.exports = WebpageParser;