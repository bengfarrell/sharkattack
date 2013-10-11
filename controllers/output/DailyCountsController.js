var fs = require("fs"),
    util = require('util'),
    mongo = require('mongodb'),
    FileUtils = require('../../utils/File.js')
FilterLibrary = require('./../../package/FilterLibrary.js');

function DailyCountsController() {
    var self = this;

    /**
     * process
     * @param library
     * @param filters
     */
    this.process = function(data, callback) {
        self.config = data;
        self.callback = callback;

        mongo.connect(self.config.database.uri, function(err, db) {
            if(err) throw err;
            self.db = db;
            self.collection = db.collection(self.config.database.collection);

            var today = new Date(Date.now());
            var past = new Date(Date.now());
            past.setDate(past.getDate() - self.config.daysToLookBack);

            self.collection.find({date: {$gte: past, $lt: today}}).toArray(function(err, results) {
                var output = self.parseResults(results);
                db.close();
                self.callback.apply(self, [ [{data: JSON.stringify(output, null, "\t"), file: self.config.output }] ]);
            });
        });
    }

    this.parseResults = function(data) {
        var dailycounts  = []
        for (var c in data) {
            var itm = {};
            //var date = new Date(data[c].date);
            var date = new Date(data[c].date);
            itm.day = Date.UTC( date.getFullYear(), date.getMonth(), date.getDate());
            itm.sourceid = data[c].sourceid;
            itm.count = 1;
            if (data[c].mediatype == "mp3") {
                itm.type = "audio";
            } else {
                itm.type = "video";
            }

            // join with results from existing data set
            var joined = false;
            for (var d in dailycounts) {
                if (dailycounts[d].day == itm.day &&
                    dailycounts[d].sourceid == itm.sourceid &&
                    dailycounts[d].mediatype == itm.mediatype) {
                    dailycounts[d].count += itm.count;
                    joined = true;
                }
            }

            // if can't be joined, add it to set
            if (!joined && itm.sourceid) {
                dailycounts.push(itm);
            }
        }

        dailycounts.sort( function(a,b) { return a.day - b.day; } );
        return dailycounts;
    }

}

DailyCountsController.prototype.className = "DailyCountsController";
DailyCountsController.prototype.classDescription = "Count daily assets";
exports = module.exports = DailyCountsController;
