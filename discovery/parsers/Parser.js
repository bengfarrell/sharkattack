var RSS = require('./RSSFeedParser')

function Parser(source, cb) {
    switch(source.type) {
        case "rss":
            new RSS(source, cb);
            break;

        default:
    }
}

exports = module.exports = Parser;