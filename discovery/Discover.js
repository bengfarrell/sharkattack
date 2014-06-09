var Queue = require( '../utils/Queue');
var Parser = require('./parsers/Parser');
var Downloader = require('./downloader/Downloader');
var events = require("events");
var util = require('util');

function Discover(config) {
    var self = this;

    var q = new Queue();

    /** config object */
    this.cfg = config;

    /**
     * run through and discover media from our sources
     * @param sources
     */
    this.run = function(data) {
        data.sources.forEach( function (src) {
            // track number of items vs desired max items, and put extra items in an overflow array
            src.numItems = 0;
            src.overflowAssets = [];
            src.assets = [];
            q.add(src, self.loadFeedSource, self.onSourcesLoaded, true);
        });
        q.run();
    }


    /**
     * load feed source
     * @param src
     * @param cb
     */
    this.loadFeedSource = function(src, cb) {
        new Parser(src, function(items) {
            items.forEach(function(i) {
                i.source = src;
                if (i.media && src.numItems < src.maxItems) {
                    src.numItems ++;
                    q.add(i, self.downloadAsset, null, true);
                    src.assets.push(i);
                } else {
                    src.overflowAssets.push(i);
                }
            });
            cb();
        }, config);
    }

    /**
     * download asset
     * @param asset
     * @param cb
     */
    this.downloadAsset = function(asset, cb) {
        new Downloader(asset, cb, self.cfg);
    }

    /**
     * sources complete
     */
    this.onSourcesLoaded = function() {
        self.emit(Discover.prototype.COMPLETE, q);
    }
}

util.inherits(Discover, events.EventEmitter);
Discover.prototype.COMPLETE = "DiscoverComplete";
exports = module.exports = Discover;