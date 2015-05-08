function AssetMetadataFormatter() {}

AssetMetadataFormatter.prototype.props = ["media", "title", "filename", "description", "album", "artist", "date",
    "recordingDate", "duration", "bitrate", "sourceid", "publisher", "label", "artist", "link", "assetType", "mediaType", "audioTranscodeFilename"];

/**
 * apply custom rules to metadata
 * @param asset
 */
AssetMetadataFormatter.prototype.apply = function(asset, source) {
    var formatted = {};

    // map desired properties to formatted asset
    for (var prop in asset) {
        if ( AssetMetadataFormatter.prototype.props.indexOf(prop) != -1) {
            formatted[prop] = asset[prop];
        } /*else {
            console.log(prop)
        }*/
    }

    // record source id
    formatted.sourceid = source.id;

    // apply custom rules by source
    switch (formatted.sourceid) {
        case "mpr":
            AssetMetadataFormatter.prototype.applyMPR(formatted);
            break;

        case "kut":
            AssetMetadataFormatter.prototype.applyKUT(formatted);
            break;

        default:
            AssetMetadataFormatter.prototype.applyDefault(formatted);
            break;
    }

    AssetMetadataFormatter.prototype.stripTrackNumber(formatted);

    var regexp = new RegExp(/[\\“”]/g);
    if (formatted.label) {
        formatted.label = formatted.label.replace(regexp, "");
    }
    if (formatted.title) {
        formatted.title = formatted.title.replace(regexp, "");
    }
    if (formatted.artist) {
        formatted.artist = formatted.artist.replace(regexp, "");
    }

    return formatted;
}

/**
 * apply custom rules to metadata (KUT specific)
 * @param asset
 */
AssetMetadataFormatter.prototype.applyKUT = function(asset) {
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
AssetMetadataFormatter.prototype.applyMPR = function(asset) {
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
AssetMetadataFormatter.prototype.applyDefault = function(asset) {
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
AssetMetadataFormatter.prototype.stripTrackNumber = function(asset) {
    if (asset.title) {
        if ( (asset.title.charAt(0) == 0 || asset.title.charAt(0) == 1) && (asset.title.charCodeAt(1) > 48 && asset.title.charCodeAt(1) < 57) ) {
            asset.title = asset.title.substr(2,asset.title.length);
        }
        asset.title = asset.title.trim();
    }
}

exports = module.exports = AssetMetadataFormatter;