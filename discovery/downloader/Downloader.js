var LinkDownloader = require('./LinkDownloader')

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

    switch(asset.mediatype) {
        case "mp3":
            var lnk = new LinkDownloader(asset, cb, config);
            break;

        default:
    }
}

exports = module.exports = Downloader;