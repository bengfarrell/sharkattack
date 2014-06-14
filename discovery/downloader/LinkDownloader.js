//var download = require('download');
var request = require('request');
var path = require('path');
var fs = require('fs');

function LinkDownloader(asset, cb, cfg) {

    var self = this;

    if ( cfg && cfg.logging ) {
        this.logging = cfg.logging;
    } else {
        this.logging = function(){};
    }

    if (!cfg || !cfg.mediaDirectory) {
        this.logging("LinkDownloader", "No media directory specified for download", { date: new Date(), level: "error", asset: asset });
        return;
    }

    if (!asset.media) {
        this.logging("LinkDownloader", "No media found to download", { date: new Date(), level: "error", asset: asset });
    }

    this.logging("LinkDownloader", "Downloading Asset " + asset.media, { date: new Date(), level: "verbose", asset: asset });

    asset._$dl = {};
    asset._$dl.totalBytes = 0;
    asset._$dl.bytesDownloaded = 0;
    asset._$dl.percentDownloaded = 0;

    // check if the file already exists
    if (fs.existsSync(cfg.mediaDirectory + path.sep + asset.filename)) {
        asset._$dl.percentDownloaded = 100;
        asset._$dl.localPath = cfg.mediaDirectory + path.sep + asset.filename;
        asset._$dl.totalBytes = fs.statSync(asset._$dl.localPath).size;
        self.logging("LinkDownloader", "File already exists " + asset.filename, { date: new Date(), level: "verbose", asset: asset });
        cb();
        return;
    }


    var opts = {};
    opts.url = asset.media;

    // if SoundCloud, then add the client ID
    if (asset.publisher == "soundcloud") {
        opts.url += "?client_id=" + cfg.soundcloud.clientID;
    }

    opts.proxy = process.env.HTTPS_PROXY ||
        process.env.https_proxy ||
        process.env.HTTP_PROXY ||
        process.env.http_proxy;

    var req = request.get(opts);

    req.on('response', function (resp) {
        if (resp.headers && resp.headers['content-length']) {
            asset._$dl.totalBytes = parseInt(resp.headers['content-length']);
        }

        var status = resp.statusCode;
        var end;

        if (resp.statusCode < 200 || resp.statusCode >= 300) {
            asset._$dl.percentDownloaded = 0;
            asset._$dl.localPath = cfg.mediaDirectory + path.sep + asset.filename;
            asset._$dl.totalBytes = 0;
            self.logging("LinkDownloader", "Error status code of " + res.statusCode, { date: new Date(), level: "error", asset: asset, error: resp.statusCode });
            cb();
            return;
        }

        if (!fs.existsSync(cfg.mediaDirectory)) {
            fs.mkdirSync(cfg.mediaDirectory);
        }

        end = fs.createWriteStream(cfg.mediaDirectory + path.sep + asset.filename);
        req.pipe(end);

        end.on('close', function () {
            asset._$dl.percentDownloaded = 100;
            asset._$dl.localPath = cfg.mediaDirectory + path.sep + asset.filename;
            asset._$dl.totalBytes = fs.statSync(asset._$dl.localPath).size;
            self.logging("LinkDownloader", "Downloaded file " + asset.filename, { date: new Date(), level: "verbose", asset: asset });
            cb();
        });
    });

    // accumulate and track bytes downloaded
    req.on('data', function (data) {
        asset._$dl.bytesDownloaded += data.length;

        if (asset._$dl.totalBytes > 0) {
            asset._$dl.percentDownloaded = parseInt(asset._$dl.bytesDownloaded / asset._$dl.totalBytes*100);
        }
    });

    req.on('error', function (error) {
        asset._$dl.percentDownloaded = 0;
        asset._$dl.localPath = cfg.mediaDirectory + path.sep + asset.filename;
        asset._$dl.totalBytes = 0;
        self.logging("LinkDownloader", "Error: " + error.toString(), { date: new Date(), level: "error", asset: asset, error: error });
        cb();
        return;
    });
}

exports = module.exports = LinkDownloader;