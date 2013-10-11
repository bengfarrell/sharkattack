var http = require("http-get"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    util = require('util');

var Log = require('../../utils/Log.js');
var FileUtils = require('../../utils/File.js');
function SyncLibraryDataController() {

    var self = this;
    var AssetMetadataCustomRules = require('../../discovery/AssetMetadataCustomRules.js');

    /** configuration for task */
    this.config = {};

    /** downloaded assets */
    this.media = [];

    this.fileUtils = new FileUtils();

    /**
     * start loading our asset queue
     * @param assets
     */
    this.process = function(data, callback) {
        this.config = data;
        this.callback = callback;

        if (!this.config.assetslist) {
            Log.prototype.log(SyncLibraryData.prototype.classDescription, "Error - Assets manifest not found");
            this.callback.apply();
            return;
        }

        var files = fs.readdirSync(this.config.mediaDirectory);

        // find extra files that aren't in the data manifest
        var filestodelete = files.filter(this.filterFilesInAssetManifest);

        // ensure that every file in manifest is accounted for in the directory
        var finallist = [];
        this.config.assetslist.forEach( function(item) {
            if (files.indexOf(item.filename) != -1 ) {
                finallist.push(item);
            } else {
                Log.prototype.log(SyncLibraryDataController.prototype.classDescription, item.filename + " not found in directory - removing from manifest");
            }
        });

        // delete the files
        if (filestodelete.length > 0) {
            Log.prototype.log(SyncLibraryDataController.prototype.classDescription, "Deleting files: " + filestodelete.toString());
            this.fileUtils.deleteAllAssociatedFiles(filestodelete, this.config.mediaDirectory);
        }

        // finish and write out the final asset/media list
        self.callback.apply(self, [ [{file: self.config.output, data: JSON.stringify(finallist, null, '\t')}] ]);
    }

    /**
     * filter function for media directory
     * @param file
     * @returns {boolean}
     */
    this.filterFilesInAssetManifest = function(thefile) {
        var filter = false;
        self.config.assetslist.forEach( function(item) {
            if (item.filename == thefile ) {
                filter = true;
            }
        });

        return !filter;
    }
}

SyncLibraryDataController.prototype.className = "SyncLibraryDataController";
SyncLibraryDataController.prototype.classDescription = "Sync Asset Library with Media";

exports = module.exports = SyncLibraryDataController;
