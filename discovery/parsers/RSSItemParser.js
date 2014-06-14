var MediaFinder = require('./MediaFinder.js');
var FileUtils = require('../../utils/File.js');

function RSSItemParser (config) {

    var self = this;

    /** media finder */
    this._mf = new MediaFinder(config);

    this.parseItem = function(item) {
        var itms = [];
        var itm = {};
        var mediaLinks = [];

        if (item.title) {
            itm.label = item.title;
        }
        if (item.description) {
            itm.description = item.description.substr(0, 500);
        }
        if (item.date) {
            itm.date = item.date;
        }
        if (item.pubDate) {
            itm.date = item.pubDate;
        }
        if (item.link) {
            itm.link = item.link;
            var found = self._mf.findMediaFromText(item.link);
            for (var link in found) {
                mediaLinks.push(found[link]);
            }
        }

        if (item["media:content"] && item["media:content"]["@"] && item["media:content"]["@"].url ) {
            this._appendLink(mediaLinks, item["media:content"]["@"].url);
        }

        if (item["content:encoded"] && item["content:encoded"]["#"] ) {
            var found = self._mf.findMediaFromText(item["content:encoded"]["#"]);
            for (var link in found) {
                mediaLinks.push(found[link]);
            }
        }

        if (item.enclosures) {
            for (var c in item.enclosures) {
                if(item.enclosures[c].url) {
                    mediaLinks = this._appendLink(mediaLinks, item.enclosures[c].url);
                }
            }
        }

        for ( var c in mediaLinks) {
            // copy original object
            var newitm = Object.create(item);
            for (var attr in item) {
                if (itm.hasOwnProperty(attr)) {
                    newitm[attr] = itm[attr];
                }
            }
            // assign media
            newitm.media = mediaLinks[c].link;
            newitm.filename = FileUtils.prototype.convertLinkToFilename(mediaLinks[c].link, mediaLinks[c].publisher);
            newitm.mediaType = mediaLinks[c].type;
            newitm.label = item.title;
            newitm.page = item.page;
            newitm.assetType = mediaLinks[c].assetType;

            if (mediaLinks[c].publisher) {
                newitm.publisher = mediaLinks[c].publisher;
            } else {
                newitm.publisher = "rss";
            }

            var duplicate = false;
            for (var c in itms) {
                if (itms[c].filename == newitm.filename) {
                    duplicate = true;
                }
            }

            if (!duplicate) {
                itms.push(newitm);
            }
        }

        return itms;
    }

    this._appendLink = function(links, link) {
        if (links.indexOf(link) == -1 && link.toLowerCase().indexOf("mp3") > -1) {
            links.push({link: link, type:"mp3", assetType: "audio", publisher: "rss"});
        }
        return links;
    }
}
exports = module.exports = RSSItemParser;