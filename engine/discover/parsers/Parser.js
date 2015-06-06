var RSS = require('./RSSFeedParser');
var WebPage = require('./WebpageParser');
var SoundCloud = require('./SoundCloudParser');
var GoogleAnalytics = require('./GoogleAnalyticsParser');

function Parser(source, cb, config) {
    if ( config && config.log ) {
        this.log = config.log;
    } else {
        this.log = function(){};
    }

    switch(source.type) {
        case "rss":
            var rss = new RSS(source, cb, config);
            break;

        case "webpage":
            var page = new WebPage(source, cb, config);
            break;

        case "soundcloud":
            var sc = new SoundCloud(source, cb, config);
            break;

        case "googleanalytics":
            var sc = new GoogleAnalytics(source, cb, config);
            break;

        default:
            this.log("Parser", "No parser found for this source", { date: new Date(), level: "error", source: source });
            cb();
            break;
    }
}

exports = module.exports = Parser;