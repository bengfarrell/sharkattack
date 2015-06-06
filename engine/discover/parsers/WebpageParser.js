var request = require('request');
var MediaFinder = require('./MediaFinder.js');
var FileUtils = require('../../utils/File.js');

function WebpageParser (source, cb, config) {
    if ( config && config.log ) {
        this.log = config.log;
    } else {
        this.log = function(){};
    }

    var self = this;

    this._label = "";
    this._url = "";

    this.loadPage = function(url, label) {
        this._label = label;
        this._url = url;
        request.get({url:url}, this.onPageLoaded).on('error', function(e){
            self.log("Webpage Parser", "Webpage timeout on " + this._url, { date: new Date(), level: "error", source: source });
            cb();
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
                newitm.filename = FileUtils.prototype.convertLinkToFilename(links[c].link, links[c].type);
                newitm.label = FileUtils.prototype.convertLinkToFilename(links[c].link, links[c].type);
                newitm.assetType = links[c].assetType;
                newitm.mediaType = links[c].type;

                if (links[c].publisher) {
                    newitm.publisher = links[c].publisher;
                } else {
                    newitm.publisher = "webpage";
                }

                // if it doesn't have a filename, it's probably invalid
                if (newitm.filename && self._checkUniqueness(newitm, itms) == true) {
                    itms.push(newitm);
                } else if (!newitm.filename) {
                    self.log("Webpage Parser", "No filename found for " + newitm.media, { date: new Date(), level: "verbose", source: source });
                }
            }
        } else {
            self.log("Webpage Parser", "Webpage 404 on " + this._url, { date: new Date(), level: "error", source: source });
        }
        cb.apply(self,  [itms]);
    }


    this._checkUniqueness = function(newitm, itms) {
        for (var c in itms) {
            if (newitm.media == itms[c].media) {
                return false;
            }
        }
        return true;
    }

    this.loadPage(source.url, source.label);
}

exports = module.exports = WebpageParser;