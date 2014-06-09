var FeedParser = require('feedparser');
var ItemParser = require('./RSSItemParser');

function RSSFeedParser(source, cb, cfg) {
    var self = this;

    /** items list */
    this.found = [];

    /**
     * c-tor
     */
    this.init = function() {
        var parser = new FeedParser();
        parser.on('article', self._onRSSItemFound);
        parser.on('end', self._onRSSParseComplete);
        parser.on('error', self._onRSSParseFailure);
        parser.parseFile(source.url);

        self.ip = new ItemParser(cfg);
    }

    /**
     * on RSS failure
     * @private
     */
    this._onRSSParseFailure = function() {
        cb.apply(self, []);
    }

    /**
     * on RSS Item found
     * @param item
     * @private
     */
    this._onRSSItemFound = function(item) {
        if (!item) {
            return;
        }
        item.page = source.page;
        var items = self.ip.parseItem(item);
        // if no links found, visit the blog to scrape
        if (items.length == 0 && item.link) {
            self.webscrapeQueue.push(item.link);
            return;
        }

        self.found = self.found.concat(items);
    }

    /**
     * handle RSS parsing complete
     */
    this._onRSSParseComplete = function() {
       /* if (self.webscrapeQueue.length > 0 && self.feedData[self.indx].assets.length < self.feedData[self.indx].maxitems) {
            var l = self.webscrapeQueue.pop();
            self.currentwebscrapelink = l;
            self.webparser.loadPage(l);
            return;
        }*/
        cb.apply(self,  [self.found]);
    }

    self.init();


}

exports = module.exports = RSSFeedParser;