var GoogleAnalytics = require('../../utils/GoogleAnalytics.js'),
    fs = require('fs'),
    Log = require('../..//utils/Log.js'),
    util = require('util'),
    querystring = require('querystring'),
    https = require('https');

var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db;

function DiscoverFavoritesController() {

    var self = this;

    /**
     * process
     */
    this.process = function (data, callback) {
        this.config = data;
        this.callback = callback;
        Log.prototype.log(DiscoverFavoritesController.prototype.className, DiscoverFavoritesController.prototype.classDescription + " Process");
        this.loadGA();
    }

    /**
     * load Google Analytics
     */
    this.loadGA = function() {
        var ga = new GoogleAnalytics();

        var currentDate = new Date();
        var monthAgo = new Date(currentDate);
        monthAgo.setDate(monthAgo.getDate() - self.config.googleAnalytics.daysToLookBack);

        ga.startDate = monthAgo.getFullYear() + "-" + self.addLeadingZero(monthAgo.getMonth()+1) + "-" + self.addLeadingZero(monthAgo.getDate());
        ga.endDate = currentDate.getFullYear() + "-" + self.addLeadingZero(currentDate.getMonth()+1) + "-" + self.addLeadingZero(currentDate.getDate());

        Log.prototype.log("Main", "Google Analytics Date Range: " + ga.startDate + " , " + ga.endDate)
        ga.account = self.config.googleAnalytics.account;
        ga.filters = "eventAction==favorite";
        ga.metrics = "visitors";
        ga.dimensions = "eventLabel";
        ga.sort = "visitors";
        ga.maxResults = 20;

        ga.on(GoogleAnalytics.prototype.GA_COMPLETE, self.onGAResults);
        ga.on(GoogleAnalytics.prototype.GA_ERROR, self.onGAError);
        ga.login(self.config.googleAnalytics.username, self.config.googleAnalytics.password);
    }

    /**
     * on ga results
     * @param results
     * @param rankings
     */
    this.onGAResults = function(results, rankings) {
        for ( var c in results ) {
            var record = results[c];
            var fields = record.split("&");

            if (fields[0] && fields[1] && fields[2]) {
                var title = fields[0].substr("title=".length, fields[0].length);
                var sourceid = fields[1].substr("sourceid=".length, fields[1].length);
                var filename = fields[2].substr("filename=".length, fields[2].length);
                self.config.assetslist.push( { title: title, sourceid: sourceid, filename: filename, rank: rankings[c], isFavorite: true });
                Log.prototype.log(DiscoverFavoritesController.prototype.classDescription, "Found Favorite: " + title + " from " + sourceid + " with rank " + rankings[c] + "(" + filename + ")");
            }
        }

        self.callback.apply(this,[ [ { file: self.config.output, data: JSON.stringify(self.config.assetslist, null, '\t') } ] ]);
    }

    /**
     * on ga error
     * @param err
     */
    this.onGAError = function(err) {
        Log.prototype.error("Error: " + err);
    }

    /**
     * add a leading zero to date/month if necessary
     * @param value
     */
    this.addLeadingZero = function(value) {
        if (value.toString().length == 1) {
            return "0" + value;
        }
        return value;
    }
}

DiscoverFavoritesController.prototype.className = "FavoritesController";
DiscoverFavoritesController.prototype.classDescription = "Favorites Asset Library Builder";
exports = module.exports = DiscoverFavoritesController;