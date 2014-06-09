var BaseFlowController = require('./../BaseFlowController.js');
var QueueProcessor= require('./../../deprecated/QueueProcessor.js');

var Log = require('./../../utils/Log.js'),
    events = require('events'),
    FileUtils = require('../../utils/File.js');

var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db;

function DelayedTweetController() {

    var self = this;

    /** class name */
    this.className = DelayedTweetController.prototype.className;

    /** class description */
    this.classDescription = DelayedTweetController.prototype.classDescription;

    /** step name */
    this.stepName = DelayedTweetController.prototype.stepName;

    /**
     * record and parse assets, comparing against DB
     * @param assets
     */
    this.process = function() {
        this._server = new Server(this.config.database.server, this.config.database.port, {auto_reconnect: true});
        this._db = new Db(this.config.database.dbName, this._server);

        this.queueProcessor = new QueueProcessor(this.onComplete, this.onProcessItem);

        self._db.open(function(err, db) {
            if(!err) {
                self._db.authenticate(self.config.database.username, self.config.database.password, function(err, db){
                Log.prototype.log(DelayedTweetController.prototype.className, "MongoDB Connected");
                    self._db.collection("pendingTweets", function(err, collection) {
                        self._tweetsCollection = collection;
                        self.queueProcessor.process(self.app.brandNewAssets);
                    });
                });
            } else {
                Log.prototype.error(DelayedTweetController.prototype.className, "Cannot connect to MongoDB: " + err);
            }
        });
    }

    /**
     * process item in queue
     * @private
     */
    this.onProcessItem = function(item) {
        if (self.config.twitter.excludeSources.indexOf(item.sourceid) != -1) {
            self.queueProcessor.next();
            return;
        }

        var clickthrough;
        if (item.link) {
            clickthrough = item.link;
        } else {
            clickthrough = item.media;
        }

        var message;
        if (item.assetType == "video") {
            message = "Video: ";
        } else {
            message = "Audio: ";
        }

        var charsUsed = message.length + (" from ").length + item.source.length + 20 /* I think 20 is shortened length */;
        var maxLabelLength = 140-charsUsed-3;

        var stat;
        var label = item.artist + " - " + item.title;
        if (label.length > maxLabelLength) {
            stat = message + label.substr(0, maxLabelLength) + "... from " + item.source + " " + clickthrough;
        } else {
            stat = message + label + " from " + item.source + " " + clickthrough;
        }

        doc = {};
        doc.status = stat;
        self._tweetsCollection.insert(doc);

        Log.prototype.log(DelayedTweetController.prototype.className, "Add status to queue: " + stat);
        self.queueProcessor.next();
    }


    this.onComplete = function() {
        self._db.close();
        self.processComplete();
    }
}

util.inherits( DelayedTweetController, BaseFlowController);
DelayedTweetController.prototype.className = "DelayedTweetController";
DelayedTweetController.prototype.classDescription = "Delayed Tweet Recording";
DelayedTweetController.prototype.stepName = "recordDelayedTweet";
DelayedTweetController.prototype.RECORD_TWEET_COMPLETE = "complete";
exports = module.exports = DelayedTweetController;
