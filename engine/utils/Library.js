var fs = require('fs');
var path = require('path');

function Library() {}

/**
 * flatten library structure to asset list
 * @param library object
 */
Library.prototype.flattenToAssetList = function(lib) {
    var assets = [];
    for (var c in lib.sources) {
        for (var d in lib.sources[c].assets) {
            assets.push(lib.sources[c].assets[d]);
        }
    }
    return assets;
};

/**
 * flatten library structure to fully qualified file list (ensure audio files)
 * @param library object
 * @param mediabasepath
 */
Library.prototype.flattenToAudioFileList = function(lib, mediabasepath) {
    var assets = [];
    for (var c in lib.sources) {
        for (var d in lib.sources[c].assets) {
            var file = lib.sources[c].assets[d].filename;
            if (lib.sources[c].assets[d].audioTranscodeFilename) {
                file = lib.sources[c].assets[d].audioTranscodeFilename;
            }
            var filepath = path.resolve(mediabasepath + path.sep + lib.sources[c].assets[d].sourceid + path.sep + file);
            assets.push(filepath);
        }
    }
    return assets;
};

exports = module.exports = Library;