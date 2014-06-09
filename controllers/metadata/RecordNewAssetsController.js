var Log = require('./../../utils/Log.js'),
    QueueProcessor= require('./../../deprecated/QueueProcessor.js');
    mongo = require('mongodb');

function RecordNewAssetsController() {

    var self = this;

    /** assets found */
    this.assets = [];

    /** new assets */
    this.newAssets = [];

    /** configuration for task */
    this.config = {};

    /**
     * run discovery against a source file
     * @param source feed JSON
     */
    this.process = function(data, callback) {
        self.config = data;
        self.callback = callback;

        if (self.config.useDatabase) {
            mongo.connect(self.config.database.uri, function(err, db) {
                if(err) throw err;
                self.db = db;
                self.collection = db.collection(self.config.database.collection);
                self.queueProcessor = new QueueProcessor(self._onParsingComplete, self._parseItem);
                self.queueProcessor.process(self.config.assetslist);
            });
        }
    }

    /**
     * parse item
     * @param item
     * @private
     */
    this._parseItem = function(item) {
        if (item.new) {
            if (!item.date) {
                item.date = new Date();//.toISOString();
            } else if (typeof item.date === "string") {
                item.date = new Date(item.date);
            }
            self._markNewAsset(item);
        } else {
            self.queueProcessor.next();
        }
    }

    /**
     * on parsing complete
     */
    this._onParsingComplete = function() {
        self.callback.apply(self, [ [{file: self.config.output, data: JSON.stringify(self.config.assetslist, null, '\t')},
                                     {file: self.config.newfiles, data: JSON.stringify(self.newAssets, null, '\t')} ] ]);
    }

    /**
     * found new asset - mark it
     * @param item
     * @private
     */
    this._markNewAsset = function(item) {
        Log.prototype.log("Record Item", "               (new item): " + item.label);
        self.newAssets.push(item);

        if (self.config.useDatabase) {
            self.collection.insert(item, function(err, docs) {
                if (err) {
                    Log.prototype.log("Record Item", "MongoDB Err: " + err);
                }
                self.queueProcessor.next();
            });
        } else {
            self.queueProcessor.next();
        }
    }
}

RecordNewAssetsController.prototype.className = "RecordNewAssetsController";
RecordNewAssetsController.prototype.classDescription = "Record New Assets";
exports = module.exports = RecordNewAssetsController;