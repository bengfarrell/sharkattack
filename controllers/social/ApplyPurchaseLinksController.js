var Log = require('./../../utils/Log.js');
var util = require('util');
var request = require('request');
var AmazonHelper = require('apac').OperationHelper;
var QueueProcessor = require('./../../deprecated/QueueProcessor');

/**
 * Apply Purchase Links
 * @constructor
 *
 * @depends songs in our app model
 */
function ApplyPurchaseLinksController() {

    var self = this;
    this.purchaseLinkQueueIndex = -1;

    /** list of services to search */
    this.purchaseLinkQueue = ["itunes", "amazon"];

    /**
     * process
     */
    this.process = function (data, callback) {
        this.config = data;
        this.callback = callback;
        this.amazonService = new AmazonHelper({
            awsId:     self.config.amazon.awsId,
            awsSecret: self.config.amazon.awsSecret,
            assocId:   self.config.amazon.assocId
        });

        Log.prototype.log(ApplyPurchaseLinksController.prototype.className, ApplyPurchaseLinksController.prototype.classDescription + " Process");
        this.queueProcessor = new QueueProcessor(this.onComplete, this.onProcessItem );
        this.queueProcessor.process(self.config.assetslist);

    }


    /**
     * on queue complete
     */
    this.onComplete = function() {
        self.callback.apply(self, [ [{file: self.config.output, data: JSON.stringify(self.config.assetslist, null, "\t")}] ]);
    }

    /**
     * on process item
     */
    this.onProcessItem = function(item) {
        self.processNextService(item);
    }

    /**
     * process next service
     * @param item
     */
    this.processNextService = function(item) {
        self.purchaseLinkQueueIndex ++;

        var query = item.label;
        if (item.artist && item.artist != "" && item.title && item.title != "") {
            query = item.artist + " " + item.title;
        }

        // remove anything in parenthesis to help search
        query = query.replace(/\((.*?)\)/, "");

        // remove double spaces
        query = query.replace(/  /g, " ");

        switch (self.purchaseLinkQueue[self.purchaseLinkQueueIndex]) {
            case "itunes":
                if (!item.itunesPurchaseLink) {
                    request("http://itunes.apple.com/search?term=" + query, self.onITunesSearchComplete);
                } else {
                    self.processNextService(item);
                    return;
                }
                break;

            case "amazon":
                if (!item.amazonPurchaseLink) {
                    self.amazonService.execute('ItemSearch', {
                        'SearchIndex': 'MP3Downloads',
                        'Keywords': query,
                        'ResponseGroup': 'ItemAttributes,Offers,Tracks'
                    }, self.onAmazonSearchComplete);
                } else {
                    self.processNextService(item);
                    return;
                }
                break;

            default:
                self.purchaseLinkQueueIndex = -1;
                self.queueProcessor.next();
                break;
        }

    }

    /**
     * on amazon search complete
     * @param error
     * @param results
     */
    this.onAmazonSearchComplete = function(error, results) {
        if (error) {
            Log.prototype.error(ApplyPurchaseLinksController.prototype.className, ApplyPurchaseLinksController.prototype.classDescription + " Error: " + error );
        } else if (results.Items.Request.Errors) {
            if (results.Items.MoreSearchResultsUrl) {
                self.queueProcessor.currentItem.amazonPurchaseLink = results.Items.MoreSearchResultsUrl;
                Log.prototype.log(ApplyPurchaseLinksController.prototype.className, ApplyPurchaseLinksController.prototype.classDescription + " Despite error Found Amazon (more results) Link: " + self.queueProcessor.currentItem.amazonPurchaseLink );
            } else {
                Log.prototype.error(ApplyPurchaseLinksController.prototype.className, ApplyPurchaseLinksController.prototype.classDescription + " Error: " + results.Items.Request.Errors.Error.Message + " for " + self.queueProcessor.currentItem.label );
            }
        } else {
            if (results.Items.Item[0]) {
                self.queueProcessor.currentItem.amazonPurchaseLink = results.Items.Item[0].DetailPageURL;
            } else if (results.Items) {
                self.queueProcessor.currentItem.amazonPurchaseLink = results.Items.Item.DetailPageURL;
            } else if (results.Item) {
                self.queueProcessor.currentItem.amazonPurchaseLink = results.Item.DetailPageURL;
            }
            Log.prototype.log(ApplyPurchaseLinksController.prototype.className, ApplyPurchaseLinksController.prototype.classDescription + " Found Amazon Link: " + self.queueProcessor.currentItem.amazonPurchaseLink );
        }
        self.processNextService(self.queueProcessor.currentItem);
    }



    /**
     * on itunes search results
     *
     * @param error
     * @param response
     * @param body
     */
    this.onITunesSearchComplete = function(error, response, body) {
        if(error){
            Log.prototype.error(ApplyPurchaseLinksController.prototype.className, ApplyPurchaseLinksController.prototype.classDescription + " Error: " + error );
        }else{
            var results = {};
            try {
                results = JSON.parse(body);
            } catch(e){
                Log.prototype.error(ApplyPurchaseLinksController.prototype.className, body);
            }

            for (var c in results.results) {
                var hit = results.results[c];
                var affiliateHit = hit.collectionViewUrl + "&partnerId=30&siteID=2939506";
                if (hit.kind == "song") {
                    self.queueProcessor.currentItem.itunesPurchaseLink = affiliateHit;
                    Log.prototype.log(ApplyPurchaseLinksController.prototype.className, ApplyPurchaseLinksController.prototype.classDescription + "Found iTunes link: " + affiliateHit);
                    self.processNextService(self.queueProcessor.currentItem);
                    return;
                }
            }
        }

        self.processNextService(self.queueProcessor.currentItem);
    }
}

ApplyPurchaseLinksController.prototype.className = "ApplyPurchaseLinksController";
ApplyPurchaseLinksController.prototype.classDescription = "Apply Purchase/Buy Links";
ApplyPurchaseLinksController.prototype.stepName  = "buylinks";
ApplyPurchaseLinksController.prototype.BUYLINKS_COMPLETE = "complete";
exports = module.exports = ApplyPurchaseLinksController;