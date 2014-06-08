var RSS = require('./RSSFeedParser')

function Parser(source, cb) {
    console.log(source)
    switch(source.type) {
        case "rss":
            var rss = new RSS(source, cb);
            break;

        default:
    }
}

exports = module.exports = Parser;