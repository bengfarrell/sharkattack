var File = require('../utils/File.js');

var DiscoveryController = require('controllers/metadata/DiscoveryController.js');
var DownloadController = require('controllers/media/DownloadController.js');

function AssetMetadataCustomRules() {}

/**
 * apply custom rules to metadata
 * @param asset
 */
AssetMetadataCustomRules.prototype.apply = function(asset, incomingprops, source) {
    switch (source) {
        case DiscoveryController.className:
            if (asset.filename == "www.youtube.mp3") {
                asset.filename = File.prototype.convertLinkToFilename(asset.media, asset.publisher)
            }
            break;

        case DownloadController.prototype.className:
            if (incomingprops && incomingprops.media) {
                asset.media = incomingprops.media;
            }
            if (incomingprops && incomingprops.title) {
                asset.title = incomingprops.title;
            }
            if (incomingprops && incomingprops.label) {
                asset.label = incomingprops.label;
            }
            if (incomingprops && incomingprops.filename) {
                asset.filename = incomingprops.filename;
            }
            if (incomingprops && incomingprops.description) {
                asset.description = incomingprops.description;
            }
            if (incomingprops && incomingprops.album) {
                asset.album = incomingprops.album;
            }
            if (incomingprops && incomingprops.artist) {
                asset.artist = incomingprops.artist;
            }
            if (incomingprops && incomingprops.recordingDate) {
                asset.recordingDate = incomingprops.recordingDate;
            }
            if (incomingprops && incomingprops.duration) {
                asset.duration = incomingprops.duration;
            }
            if (incomingprops && incomingprops.bitrate) {
                asset.bitrate = incomingprops.bitrate;
            }
            break;
    }

    // apply custom rules by source
    switch (asset.sourceid) {
        case "mpr":
            AssetMetadataCustomRules.prototype.applyMPR(asset);
            break;

        case "kut":
            AssetMetadataCustomRules.prototype.applyKUT(asset);
            break;

        default:
            AssetMetadataCustomRules.prototype.applyDefault(asset);
            break;
    }

    AssetMetadataCustomRules.prototype.stripTrackNumber(asset);

    var regexp = new RegExp(/[\\“”]/g);
    if (asset.label) {
        asset.label = asset.label.replace(regexp, "");
    }
    if (asset.title) {
        asset.title = asset.title.replace(regexp, "");
    }
    if (asset.artist) {
        asset.artist = asset.artist.replace(regexp, "");
    }
}

/**
 * apply custom rules to metadata (KUT specific)
 * @param asset
 */
AssetMetadataCustomRules.prototype.applyKUT = function(asset) {
    if (asset.artist.indexOf(":") != -1) {
        var fields = asset.artist.split(":");
        if (fields[0]) {
            asset.artist = fields[0].trim();
        }
    }

    if (asset.title.indexOf(":") != -1) {
        var fields = asset.title.split(":");
        if (fields[1]) {
            asset.title = fields[1].trim();
        }
    }

    if (asset.label.indexOf(":") != -1) {
        var fields = asset.label.split(":");
        if (fields[0]) {
            asset.artist = fields[0].trim();
        }
        if (fields[1]) {
            asset.title = fields[1].trim();
        }
        asset.label = asset.artist + " - " + asset.title;
    }
}

/**
 * apply custom rules to metadata (MPR specific)
 * @param asset
 */
AssetMetadataCustomRules.prototype.applyMPR = function(asset) {
    var meta = asset.label.split(" - ");
    if (meta[0]) {
        asset.artist = meta[0].trim();
    }
    if (meta[1]) {
        asset.title = meta[1].trim();
    }
    asset.label = asset.artist + " - " + asset.title;
}

/**
 * apply custom rules to metadata (MPR specific
 * @param asset
 */
AssetMetadataCustomRules.prototype.applyDefault = function(asset) {
    if (asset.label == "www.youtube.mp3") {
        return;
    }
    var meta = asset.label.split(" - ");
    if (asset.artist == undefined && meta[0]) {
        asset.artist = meta[0].trim();
    }
    if (asset.title == undefined && meta[1]) {
        asset.title = meta[1].trim();
    }
}

/**
 * strip track number from title
 * @param asset
 */
AssetMetadataCustomRules.prototype.stripTrackNumber = function(asset) {
    if (asset.title) {
        if ( (asset.title.charAt(0) == 0 || asset.title.charAt(0) == 1) && (asset.title.charCodeAt(1) > 48 && asset.title.charCodeAt(1) < 57) ) {
            asset.title = asset.title.substr(2,asset.title.length);
        }
        asset.title = asset.title.trim();
    }
}

exports = module.exports = AssetMetadataCustomRules;