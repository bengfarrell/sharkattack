function AssetsLibrary() {}

/**
 * flatten tree library to a linear list
 * @param library
 * @returns {Array}
 */
AssetsLibrary.prototype.flatten = function(library) {
    var flattened = [];
    for (var src in library.sources) {
        for(var a in library.sources[src].assets) {
            flattened.push(library.sources[src].assets[a]);
        }
    }
    return flattened;
}

exports = module.exports = AssetsLibrary;