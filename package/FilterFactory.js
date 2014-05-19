function FilterFactory() {}
/**
 * create a filter for the filter library
 * @param type
 * @return filter object
 */
FilterFactory.prototype.createFilter = function(type) {
    switch (type) {
        case "includeFavoritesOnly":
            return FilterFactory.prototype.filterOutFavorites;
            break;

        case "excludeFavorites":
            return FilterFactory.prototype.filterOutNonFavorites;
            break;

        case "includeMP3Only":
            return FilterFactory.prototype.filterOutNonMP3;
            break;

        case "includeVideoOnly":
            return FilterFactory.prototype.filterOutNonVideo;
            break;

        case "excludeSources":
            return FilterFactory.prototype.filterOutSourceIDs;
            break;

        case "includeSources":
            return FilterFactory.prototype.filterIncludeSourceIDs;
            break;

        case "includeSpotifyOnly":
            return FilterFactory.prototype.filterOutNonSpotify;
            break;
    }
}

FilterFactory.prototype.filterOutFavorites = function(source, asset) {
    if (asset.isFavorite == true) {
        return false;
    } else {
        return true;
    }
}

FilterFactory.prototype.filterOutNonFavorites = function(source, asset) {
    if (asset.isFavorite == false) {
        return true;
    } else {
        return false;
    }
}

FilterFactory.prototype.filterOutNonMP3 = function(source, asset) {
    if (asset.assetType != "audio") {
        return true;
    } else {
        return false;
    }
}

FilterFactory.prototype.filterOutNonVideo= function(source, asset) {
    if (asset.assetType != "video") {
        return true;
    } else {
        return false;
    }
}

FilterFactory.prototype.filterOutNonSpotify= function(source, asset) {
    if (asset.spotifyTrack == null || asset.spotifyTrack == "") {
        return true;
    } else {
        return false;
    }
}

FilterFactory.prototype.filterOutSourceIDs = function(source, asset, sourceList) {
    var srcID = "";
    if (source) {
        srcID = source.id;
    } else {
        srcID = asset.sourceid;
    }
    if (sourceList.indexOf(srcID) != -1) {
        return true;
    } else {
        return false;
    }
}

FilterFactory.prototype.filterIncludeSourceIDs = function(source, asset, sourceList) {
    var srcID = "";
    if (source) {
        srcID = source.id;
    } else {
        srcID = asset.sourceid;
    }
    if (sourceList.indexOf(srcID) == -1) {
        return true;
    } else {
        return false;
    }
}

exports = module.exports = FilterFactory;