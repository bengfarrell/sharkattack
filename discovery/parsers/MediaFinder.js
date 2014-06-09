var FileUtils = require('../../utils/File.js');

function MediaFinder (config) {

    this._mp3RegEx = /((http)?s?:?\/\/+[\w\d:#@%/;$()~_?\+-=\\\.&]*\.mp3)/gi;
    this._youtubeRegex = /(http)?s?:?\/\/(www)?.youtube.com\/(embed\/)?(watch\?v=)?[A-Za-z0-9\-\_]*/gi;
    this._vimeoRegex = /(http)?s?:?\/\/(www.)?player.vimeo.com\/video\/[A-Za-z0-9\-\_]*/gi;
    this._soundcloudRegex = /(http)?s?:?\/\/w.soundcloud.com\/player\/\?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F[A-Za-z0-9\-\_]*/gi;

    /**
     * return asset from URL (assume only one asset)
     * @param url
     * @param source string
     * @return {Object} asset
     */
    this.assetFromURL = function(url, source) {
        var itms = [];
        var itm = {};
        var links = this.findMediaFromText(url);

        if (links.length > 0 ) {
            itm.link = url;
            itm.media = links[0].link;
            itm.filename = FileUtils.prototype.convertLinkToFilename(links[0].link);
            itm.label = FileUtils.prototype.convertLinkToFilename(links[0].link);
            itm.assetType = links[0].assetType;
            itm.mediatype = links[0].type;
            itm.source = source;
            if (links[0].publisher) {
                itm.publisher = links[0].publisher;
            } else {
                itm.publisher = "web";
            }
            return itm;
        }
        return null;
    }

    this.findMediaFromTextualList = function(list) {
        var links = [];
        for (var c in list) {
            links = links.concat(this.findMediaFromText(list[c]));
        }
        return links;
    }

    this.findMediaFromText = function(text) {
        var links = [];
        if (text) {
            var found = text.match(this._mp3RegEx);
            if (found && found != "") {
                for (var lnk in found) {
                    links.push({type: "mp3", link: found[lnk], assetType: "audio"});
                }
            }

            if (config && config.allowYouTube) {
                found = text.match(this._youtubeRegex);
                if (found && found != "") {
                    for (lnk in found) {
                        links.push({type: "youtube", link: found[lnk], assetType: "video", publisher: "youtube"});
                    }
                }
            }

            if (config && config.allowVimeo) {
                found = text.match(this._vimeoRegex);
                if (found && found != "") {
                    for (lnk in found) {
                        links.push({type: "vimeo", link: found[lnk], assetType: "video", publisher: "vimeo"});
                    }
                }
            }

            if (config && config.allowSoundcloud) {
                found = text.match(this._soundcloudRegex);
                if (found && found != "") {
                    for (lnk in found) {
                        links.push({type: "mp3", link: found[lnk], assetType: "audio", publisher: "soundcloud"});
                    }
                }
            }
        }

        return links;
    }
}
exports = module.exports = MediaFinder;