var Queue = require( '../utils/Queue');
var Parser = require('./parsers/Parser');
var Downloader = require('./assettasks/Downloader');
var Transcoder = require('./assettasks/Transcoder');
var GetMediaInfo = require('./../utils/GetMediaInfo');
var CriteriaCheck = require('./assettasks/CriteriaCheck');
var Database = require('../utils/Database');
var Output = require('./output/Output');
var events = require("events");
var util = require('util');
var fs = require('fs');

function Discover(config) {
    var self = this;

    if ( config && config.log ) {
        this.log = config.log;
    } else {
        this.log = function(){};
    }

    /** asset count */
    var count = 0;

    /** database */
    var db = new Database(config);

    /** criteria */
    var crit = new CriteriaCheck(config);

    /** asset library */
    var lib = {};

    /** stats */
    var stats = { totalAssets: 0 };

    /** asset flow/steps for completing discovery */
    var assetFlow = [
        { name: "discover", success: true /* its here, how could it not be discovered? */},
        { name: "download", success: false },
        { name: "transcode", success: false },
        { name: "mediainfo", success: false },
        { name: "complete", success: false }
    ];

    /** queue of things to do */
    var q = new Queue();

    /** config object */
    this.cfg = config;

    /**
     * run through and discover media from our sources
     * @param sources
     */
    this.run = function(data) {
        if (typeof data === "string") {
            data = JSON.parse(fs.readFileSync(data));
        }
        data.sources.forEach( function (src) {
            // track number of items vs desired max items, and put extra items in an overflow array
            src.numItems = 0;
            src.overflowAssets = [];
            src.assets = [];
            q.add(src, self.loadFeedSource, self.onSourceLoaded, true);
        });
        lib = data;
        self.log("Discover", "Running Feed Queue", { date: new Date(), level: "verbose" });
        q.run(self.onComplete);
    };

    /**
     * handle asset flow
     * @param asset
     */
    this.handleAssetFlow = function(asset) {
        if (!crit.isPassing(asset)) {
            asset._$flow.failure = true;
        }

        if (asset._$flow.failure == true) {
            // asset has failed - do not continue
            return;
        }

        asset._$flow.steps[asset._$flow.currentStep].success = true;
        asset._$flow.currentStep ++;

        self.log("Discover", "(" + asset._$flow.count + "/" + count + ") Flow step " + asset._$flow.steps[asset._$flow.currentStep].name + " for "  + asset.label, { date: new Date(), level: "verbose", asset: asset });
        switch (asset._$flow.steps[asset._$flow.currentStep].name) {
            case "download":
                q.add(asset, function(asset, cb) {
                    new Downloader(asset, function(err) { self.updateFlowResult(err, asset); cb(); }, self.cfg);
                }, self.handleAssetFlow, true);
                break;

            case "transcode":
                q.add(asset, function(asset, cb) {
                    new Transcoder(asset, function(err) { self.updateFlowResult(err, asset); cb(); }, self.cfg);
                }, self.handleAssetFlow, true);
                break;

            case "mediainfo":
                q.add(asset, function(asset, cb) {
                    new GetMediaInfo(asset, function(err) { self.updateFlowResult(err, asset); cb(); }, self.cfg);
                }, self.handleAssetFlow, true);
                break;

            case "complete":
                stats.totalAssets ++;
                break;

            default:
                break;
        }
    };

    /**
     * update flow and record results
     * @param err
     * @param asset
     */
    this.updateFlowResult = function(err, asset) {
        if (err) {
            asset._$flow.steps[asset._$flow.currentStep].success = false;
            asset._$flow.steps[asset._$flow.currentStep].error = err;
            asset._$flow.failure = true
        } else {
            asset._$flow.steps[asset._$flow.currentStep].success = true;
        }
    };

    /**
     * load feed source
     * @param src
     * @param cb
     */
    this.loadFeedSource = function(src, cb) {
        new Parser(src, function(items) {
            if (items) {
                self.log("Discover", items.length + " items found in " + src.label, { date: new Date(), level: "verbose", source: src });
            } else {
                self.log("Discover", "Found no items in " + src.label, { date: new Date(), level: "verbose", source: src });
                cb();
                return;
            }
            items.forEach(function(i) {
                i._$flow = {};
                i._$flow.steps = assetFlow;
                i._$flow.currentStep = 0;
                i._$flow.failure = false;
                i.source = src;

                if (!src.maxItems) {
                    self.log("Discover", "Max items is not defined, so no items will be added: " + src.label, { date: new Date(), level: "warning" });
                }

                if (i.media && src.numItems < src.maxItems) {
                    src.numItems ++;

                    // apply date if doesn't exist
                    if (!i.date) {
                        db.connectSync('assets/discovered/' + src.id);
                        var result = db.find(i.media);

                        if (result && result.date) {
                            i.date = result.date;
                        } else {
                            i.date = new Date(Date.now()).toUTCString();
                        }
                    } else {
                        i.date = new Date(i.date).toUTCString();
                    }

                    count ++;
                    i._$flow.count = count;
                    self.handleAssetFlow(i, cb);
                    src.assets.push(i);
                } else {
                    src.overflowAssets.push(i);
                }
            });
            cb();
        }, config);
    };

    /**
     * sources complete
     */
    this.onSourceLoaded = function() {};

    /**
     * on complete
     */
    this.onComplete = function() {
        var out = new Output(lib, config);
        self.emit(Discover.prototype.COMPLETE, lib, stats);
        self.log("Discover", "Finished");
    };
}

util.inherits(Discover, events.EventEmitter);
Discover.prototype.COMPLETE = "DiscoverComplete";
exports = module.exports = Discover;