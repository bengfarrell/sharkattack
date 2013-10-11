var QueueProcessor= require('./../QueueProcessor.js'),
    Log = require('./../../utils/Log.js');

var mongo = require('mongodb');

function ReconcileController() {

    var self = this;

    /** configuration for task */
    this.config = {};

    /**
     * reconcile against source data
     * @param source feed JSON
     */
    this.process = function(data, callback) {
        self.config = data;
        self.callback = callback;
        this.queueProcessor = new QueueProcessor(self._onReconcileComplete, self._reconcileItem );

        if (self.config.useDatabase) {
            mongo.connect(self.config.database.uri, function(err, db) {
                if(err) throw err;
                self.db = db;
                self.collection = db.collection(self.config.database.collection);
                self.queueProcessor.process(self.config.assetslist);
            });
        } else {
            self.queueProcessor.process(self.config.assetslist);
        }
    }

    /**
     * reconcile item against previous run of data
     * or mark as new
     * @param item
     * @private
     */
    this._reconcileItem = function(item) {
        if (self.config.useLastRun) {
            var found = false;
            self.config.lastRun.forEach( function(i) {
                if (item.media == i.media && i.date) {
                    found = true;
                    item.new = false;
                    for (var field in i) {
                        item[field] = i[field];
                    }
                    Log.prototype.log("Reconcile", "               (discovered " + dbItem.date + "): " + item.label);
                    self.queueProcessor.next();
                }
            });

            if (!found && !self.config.useDatabase) {
                item.new = true;
                self.queueProcessor.next();
            }
            return;
        } else if (self.config.useDatabase) {
            self.collection.findOne({media: item.media}, function(err, dbItem) {
                if (dbItem) {
                    for (var field in dbItem) {
                        item[field] = dbItem[field];
                    }
                    item.new = false;
                    Log.prototype.log("Reconcile", "               (discovered " + dbItem.date + "): " + item.label);
                } else {
                    Log.prototype.log("Reconcile", "               (unidentified): " + item.label);
                    item.new = true;
                }
                self.queueProcessor.next();
                return;
            });
        }
    }

    /**
     * on reconciling complete
     */
    this._onReconcileComplete = function() {
        Log.prototype.addLineBreak();
        Log.prototype.addLineBreak();

        if (self.config.useDatabase) {
            self.db.close();
        }

        self.callback.apply(this,[ [ { file: self.config.output, data: JSON.stringify(self.config.assetslist, null, '\t') } ] ]);
    }
}

exports = module.exports = ReconcileController;