var LinkDownloader = require('./downloaders/LinkDownloader');
var YouTubeDownloader = require('./downloaders/YouTubeDownloader')

function Downloader(asset, cb, config) {
    if ( config && config.logging ) {
        this.logging = config.logging;
    } else {
        this.logging = function(){};
    }

    if (!asset.media) {
        this.logging(this, "Downloader", "No media found to download", { date: new Date(), level: "error", asset: asset });
        return;
    }

    switch(asset.mediaType) {
        case "mp3":
            var lnk = new LinkDownloader(asset, cb, config);
            break;

        case "youtube":
        case "vimeo":
            var dl = new YouTubeDownloader(asset, cb, config);
            break;

        default:
            this.logging(this, "Downloader", "No media handler found", { date: new Date(), level: "error", asset: asset });
            cb();
    }
}

exports = module.exports = Downloader;