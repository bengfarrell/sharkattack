var fs = require("fs"),
    util = require('util'),
    FileUtils = require('../../utils/File.js')
    FilterLibrary = require('./../../package/FilterLibrary.js');

function LibraryOutputController() {
    var self = this;

    /**
     * process
     * @param library
     * @param filters
     */
    this.process = function(data, callback) {
        self.config = data;
        self.callback = callback;

        // map assets to sources to create a tree structure
        // matching the input file
        self.config.assetslist.forEach( function(asset) {
            self.config.sourceslist.sources.forEach( function(source) {
                if (source.id == asset.sourceid) {
                    if (!source.assets) {
                        source.assets = [];
                    }
                    source.assets.push(asset);
                }
            });
        });

        var srcs = { sources: [] };
        self.config.sourceslist.sources.forEach( function(source) {
            if (source.assets && source.assets.length > 0) {
                srcs.sources.push(source);
            }
        });

        var output = [];
        for (var f in self.config.outputfilters) {
            var filter = new FilterLibrary();
            var filtered = JSON.stringify(filter.process( srcs, self.config.outputfilters[f].filters), null, '\t');
            var filepath = self.config.outputfilters[f].file;
            output.push({data: filtered, file: filepath});
        }
        self.callback.apply(self, [output]);
    }
}

LibraryOutputController.prototype.className = "LibraryOutputController";
LibraryOutputController.prototype.classDescription = "Output Asset Libraries";
LibraryOutputController.prototype.stepName = "outputLibraries";
exports = module.exports = LibraryOutputController;
