var FeedParser = require('feedparser'),
    ItemParser = require('./../../discovery/ItemParser.js'),
    WebpageParser = require('./../../discovery/WebpageParser.js'),
    SoundCloudParser = require('./../../discovery/SoundCloudParser.js'),
    Log = require('./../../utils/Log.js'),
    FileUtils = require('../../utils/File.js'),
    sax = require('sax'),
    request = require('request'),
    path = require("path"),
    events = require('events'),
    util = require('util');

var request = require('request');

//override parse URL to have a timeout //////////////////////////////
FeedParser.prototype.parseUrl = function(url, callback) {
    var parser = this;
    parser._setCallback(callback);
    request(url, {timeout: 30000})
        .on('error', function (e){ parser.handleError(e, parser); })
        .pipe(parser.stream);
};
////////////////////////////////////////////////////////////////////

function DiscoveryController() {

    var self = this;

    var AssetMetadataCustomRules = require('./../../discovery/AssetMetadataCustomRules.js');

    /** current index of queue */
    this.indx = -1;

    /** current feed data */
    this.feedData = null;

    /** a queue of pages to scrape */
    this.webscrapeQueue = [];

    /** current webpage we're scraping */
    this.currentwebscrapelink = "";

    /** assets found */
    this.assets = [];

    /** configuration for task */
    this.config = {};

    /**
     * run discovery against a source file
     * @param source feed JSON
     */
    this.process = function(data, callback) {
        self.config = data;
        self.ip = new ItemParser(self.config);
        self.soundcloud = new SoundCloudParser(self.config);
        self.soundcloud.on(SoundCloudParser.prototype.SOUNDCLOUD_PARSING_COMPLETE, self._onSoundCloudItemsFound);
        self.webparser = new WebpageParser(self.config);
        self.webparser.on(WebpageParser.prototype.WEBPAGE_PARSING_COMPLETE, self._onWebItemsFound);
        self.callback = callback;
        self.feedData = self.config.feedlist;
        for ( s in self.feedData) {
            if (!self.feedData[s].maxitems) {
                self.feedData[s].maxitems = self.config.maxItemsInSource;
            }
        }

        if (self.config.useDatabase) {
            mongo.connect(self.config.database.uri, function(err, db) {
                if(err) throw err;
                self.db = db;
                self.collection = db.collection(self.config.database.collection);
                self._parseNext();
            });
        } else {
            self._parseNext();
        }
    }

    /**
     * on RSS failure
     * @private
     */
    this._onRSSParseFailure = function() {
        Log.prototype.log("Discovery", "Failed to parse: " + self.feedData[self.indx].label);
        self._parseNext();
    }

    /**
     * on RSS Item found
     * @param item
     * @private
     */
    this._onRSSItemFound = function(item) {
        item.page = self.feedData[self.indx].page;
        self.items = self.ip.parseItem(item);
        // if no links found, visit the blog to scrape
        if (self.items.length == 0) {
            self.webscrapeQueue.push(item.link);
            return;
        }
        self._onItemsFound(self.items);
    }

    /**
     * on SoundCloud Items Found
     * @param items
     * @private
     */
    this._onSoundCloudItemsFound = function(items) {
        console.log(items)
        self._onItemsFound(items);
    }

    /**
     * on items found from parsing a webpage
     * @param items
     */
    self._onWebItemsFound = function(items) {
        self._onItemsFound(items);
        if (self.webscrapeQueue.length > 0 && self.feedData[self.indx].assets.length < self.feedData[self.indx].maxitems) {
            self.webparser.loadPage(self.webscrapeQueue.pop());
            return;
        }

        if (self.currentwebscrapelink != "") {
            Log.prototype.log("Discovery", "      found: " + self.items.length + " songs from scraping " + self.currentwebscrapelink);
        }

        Log.prototype.log("Discovery", "      found: " + self.feedData[self.indx].assets.length + " songs in " + self.feedData[self.indx].label);
        self._parseNext();
    }

    /**
     * on items found (handle from any source)
     * @param items
     */
    this._onItemsFound = function(items) {
        for (var itm in items) {
            if (this._checkUniqueness(items[itm], self.feedData[self.indx].assets) == true &&
                this._checkDeleted(items[itm], self.config.removalList) == false &&
                self.feedData[self.indx].assets.length < self.feedData[self.indx].maxitems) {
                AssetMetadataCustomRules.prototype.apply( items[itm], {}, self.className );
                self.assets.push(items[itm]);
                self.feedData[self.indx].assets.push(items[itm]);
            }
        }
    }

    /**
     * check the uniqueness of our found item
     * @param newitm
     * @param itms
     * @return {Boolean}
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

    /**
     * check if item had been previously removed
     * @param newitm
     * @param itms
     * @return {Boolean}
     * @private
     */
    this._checkDeleted = function(newitm, itms) {
        for (var c in itms) {
            if (newitm.media == itms[c].media) {
                Log.prototype.log("Discovery", "Not adding prev deleted item " + itms[c].media);
                return true;
            }
        }
        return false;
    }

    /**
     * handle RSS parsing complete
     */
    this._onRSSParseComplete = function() {
        if (self.webscrapeQueue.length > 0 && self.feedData[self.indx].assets.length < self.feedData[self.indx].maxitems) {
            var l = self.webscrapeQueue.pop();
            self.currentwebscrapelink = l;
            self.webparser.loadPage(l);
            return;
        }

        Log.prototype.log("Discovery", "      found: " + self.feedData[self.indx].assets.length + " songs in " + self.feedData[self.indx].label);
        self._parseNext();
    }

    /**
     * parse the next item
     */
    this._parseNext = function() {
        self.indx++;
        if (self.indx >= self.feedData.length) {
            self._onParsingComplete();
            return;
        }

        if (self.feedData[self.indx].disabled == true) {
            Log.prototype.log("Discovery", "      Disabled Item: " + (self.indx+1) + "/" + self.feedData.length + " - " + self.feedData[self.indx].label + " (" + self.feedData[self.indx].type + ")");
            self._parseNext();
        }

        self.currentwebscrapelink = "";
        Log.prototype.log("Discovery", "      Parsing: " + (self.indx+1) + "/" + self.feedData.length + " - " + self.feedData[self.indx].label + " (" + self.feedData[self.indx].type + ")");
        self.feedData[self.indx].assets = [];

        if (self.feedData[self.indx].type == "rss") {
            var parser = new FeedParser();
            parser.on('article', self._onRSSItemFound);
            parser.on('end', self._onRSSParseComplete);
            parser.on('error', self._onRSSParseFailure);
            parser.parseFile(self.feedData[self.indx].url);
        } else if (self.feedData[self.indx].type == "soundcloud" && self.config.allowSoundcloud) {
            self.soundcloud.load(self.feedData[self.indx].url);
        } else {
            self.webparser.loadPage(self.feedData[self.indx].url);
        }
    }

    /**
     * on parsing complete
     */
    this._onParsingComplete = function() {
        Log.prototype.addLineBreak();
        Log.prototype.addLineBreak();

        for (var c in self.feedData) {
            if (self.feedData[c].assets && self.feedData[c].assets.length > 0) {
                for (var d in self.feedData[c].assets) {
                    self.feedData[c].assets[d].source = self.feedData[c].label;
                    self.feedData[c].assets[d].sourceid = self.feedData[c].id;
                    AssetMetadataCustomRules.prototype.apply(self.feedData[c].assets[d]);
                }
            }
        }

        if (self.config.useDatabase) {
            self.db.close();
        }

        self.callback.apply(self, [ [{file: self.config.output, data: JSON.stringify(self.assets, null, '\t')}] ]);
    }
}

exports = module.exports = DiscoveryController;