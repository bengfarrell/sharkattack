var FeedParser = require('feedparser');
var ItemParser = require('./ItemParser');

function RSSFeedParser(source, cb) {
    var parser = new FeedParser();
    parser.on('article', self._onRSSItemFound);
    parser.on('end', self._onRSSParseComplete);
    parser.on('error', self._onRSSParseFailure);
    parser.parseFile(self.feedData[self.indx].url);

    self.ip = new ItemParser();


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
        item.page = self.feedData[self.indx].page;
        self.items = self.ip.parseItem(item);
        // if no links found, visit the blog to scrape
        if (self.items.length == 0) {
            self.webscrapeQueue.push(item.link);
            return;
        }
        self._onItemsFound(self.items);
    }

    /**
     * handle RSS parsing complete
     */
    this._onRSSParseComplete = function() {
        if (self.webscrapeQueue.length > 0 && self.feedData[self.indx].assets.length < self.feedData[self.indx].maxitems) {
            var l = self.webscrapeQueue.pop();
            self.currentwebscrapelink = l;
            self.webparser.loadPage(l);
            return;
        }

        cb.apply();
    }
}

exports = module.exports = RSSFeedParser;