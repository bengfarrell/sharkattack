var Queue = require( '../utils/Queue');
var Parser = require('./parsers/Parser');
var Downloader = require('./assettasks/Downloader');
var events = require("events");
var util = require('util');

function Discover(config) {
    var self = this;

    if ( config && config.logging ) {
        this.logging = config.logging;
    } else {
        this.logging = function(){};
    }

    var assetFlow = [
        { name: "discover", success: true /* its here, how could it not be discovered? */},
        { name: "download", success: false },
        { name: "complete", success: false }
       // { name: "transcode", success: false },
        // { name: "mediainfo", success: false }
    ]

    /** queue of things to do */
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
        q.run(self.onComplete);
    }

    /**
     * handle asset flow
     * @param asset
     * @param cb
     */
    this.handleAssetFlow = function(asset, cb) {
        asset._$flow.steps[asset._$flow.currentStep].success = true;
        asset._$flow.currentStep ++;

        switch (asset._$flow.steps[asset._$flow.currentStep].name) {
            case "download":
                q.add(asset, function(asset, cb) {
                    new Downloader(asset, cb, self.cfg);
                }, self.handleAssetFlow, true);
                break;

            case "transcode":
                break;

            case "mediainfo":
                break;

            case "complete":
                self.logging("Discover", "Flow Complete for " + asset.label, { date: new Date(), level: "verbose", asset: asset });
                break;
        }

    }


    /**
     * load feed source
     * @param src
     * @param cb
     */
    this.loadFeedSource = function(src, cb) {
        new Parser(src, function(items) {
            items.forEach(function(i) {
                i._$flow = {};
                i._$flow.steps = assetFlow;
                i._$flow.currentStep = 0;
                i.source = src;

                if (i.media && src.numItems < src.maxItems) {
                    src.numItems ++;
                    self.handleAssetFlow(i, cb);
                    src.assets.push(i);
                } else {
                    src.overflowAssets.push(i);
                }
            });
            cb();
        }, config);
    }

    /**
     * sources complete
     */
    this.onSourcesLoaded = function() {
    }

    /**
     * on complete
     */
    this.onComplete = function() {
        self.emit(Discover.prototype.COMPLETE, q);
    }
}

util.inherits(Discover, events.EventEmitter);
Discover.prototype.COMPLETE = "DiscoverComplete";
exports = module.exports = Discover;