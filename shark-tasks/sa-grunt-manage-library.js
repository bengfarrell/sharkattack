module.exports = function(grunt) {
    var DownloadController = require('./media/DownloadController.js');
    var ReconcileController = require('./metadata/ReconcileController.js');
    var DuplicateArtistRemovalController = require('./metadata/DuplicateArtistRemovalController.js');
    var InsufficientMetadataRemovalController = require('./metadata/InsufficientMetadataRemovalController.js');
    var OldAssetRemovalController = require('./metadata/OldAssetRemovalController.js');
    var OverDurationRemovalController = require('./metadata/OverDurationRemovalController.js');
    var TranscodeController = require('./media/TranscodeController.js');
    var MetadataInjectController = require('./media/MetadataInjectController.js');
    var SyncLibraryDataController = require('./media/SyncLibraryDataController.js');
    var LibraryOutputController = require('./output/LibraryOutputController.js');
    var ApplyPurchaseLinksController = require('./social/ApplyPurchaseLinksController.js');
    var SpotifyResolveController = require('./social/SpotifyResolveController.js');
    var Log = require('../utils/Log.js');

    // ==========================================================================
    // TASKS
    // ==========================================================================

    grunt.registerMultiTask('sa-library', 'Manage Library of Discovered Assets', function() {
        var self = this;
        self.done = this.async();
        self.data = this.data;

        var onComplete = function(output) {
            if (output) {
                output.forEach( function(o) {
                    Log.prototype.log("Output", o.file);
                    grunt.file.write(o.file, o.data);
                });
            }
            self.done.apply();
        }

        switch (this.target) {
            case "download":
                Log.prototype.log("Grunt", "SA - Download Task");
                Log.prototype.addLineBreak();
                Log.prototype.log("Task", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.removalListFile);
                Log.prototype.addLineBreak();
                self.data.removalList = grunt.file.readJSON(self.data.removalListFile);
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                new DownloadController().process(this.data, onComplete);
                break;

            case "transcode":
                Log.prototype.log("Grunt", "SA - Transcoder.js Task");
                Log.prototype.addLineBreak();
                Log.prototype.log("Task", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.removalListFile);
                Log.prototype.addLineBreak();
                self.data.removalList = grunt.file.readJSON(self.data.removalListFile);
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                new TranscodeController().process(this.data, onComplete);
                break;

            case "metadata-inject":
                Log.prototype.log("Task", "SA - Inject Metadata Task");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                new MetadataInjectController().process(this.data, onComplete);
                break;

            case "sync-library-data":
                Log.prototype.log("Task", "SA - Sync Library to Media");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                new SyncLibraryDataController().process(this.data, onComplete);
                break;

            case "remove-old-assets":
                Log.prototype.log("Task", "SA - Remove Old Assets");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.removalListFile);
                Log.prototype.addLineBreak();
                self.data.removalList = grunt.file.readJSON(self.data.removalListFile);
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                new OldAssetRemovalController().process(this.data, onComplete);
                break;

            case "remove-duplicate-artists":
                Log.prototype.log("Task", "SA - Remove Duplicate Artists");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.removalListFile);
                Log.prototype.addLineBreak();
                self.data.removalList = grunt.file.readJSON(self.data.removalListFile);
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                new DuplicateArtistRemovalController().process(this.data, onComplete);
                break;

            case "remove-insufficient-metadata-assets":
                Log.prototype.log("Task", "SA - Remove Assets with Insufficient Metadata");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.removalListFile);
                Log.prototype.addLineBreak();
                self.data.removalList = grunt.file.readJSON(self.data.removalListFile);
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                new InsufficientMetadataRemovalController().process(this.data, onComplete);
                break;

            case "remove-over-duration":
                Log.prototype.log("Task", "SA - Remove Assets that are too Long");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.removalListFile);
                Log.prototype.addLineBreak();
                self.data.removalList = grunt.file.readJSON(self.data.removalListFile);
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                new OverDurationRemovalController().process(this.data, onComplete);
                break;

            case "apply-purchase-links":
                Log.prototype.log("Task", "SA - Apply Purchase Links to Assets");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                new ApplyPurchaseLinksController().process(this.data, onComplete);
                break;

            case "spotify-resolve":
                Log.prototype.log("Task", "SA - Spotify Resolve Each Asset");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                new SpotifyResolveController().process(this.data, onComplete);
                break;

            case "reconcile-library":
                Log.prototype.log("Task", "SA - Reconcile Assets Against Existing Data");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                if (self.data.useLastRun) {
                    try {
                        self.data.lastRun = grunt.file.readJSON(self.data.lastRunFile);
                    } catch(e) {
                        Log.prototype.log("Grunt", "(first run, no previous data found)");
                        Log.prototype.addLineBreak();
                        self.data.lastRun = [];
                    }
                }
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                new ReconcileController().process(this.data, onComplete);
                break;

            case "library-output":
                Log.prototype.log("Task", "SA - Write Output Files");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.sourceslistFile);
                Log.prototype.addLineBreak();
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                self.data.sourceslist = grunt.file.readJSON(self.data.sourceslistFile);
                new LibraryOutputController().process(this.data, onComplete);
                break;

            case "build-source-list":
                Log.prototype.log("Task", "SA - Write Output Files");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.libraryFile);
                Log.prototype.addLineBreak();
                var lib = grunt.file.readJSON(self.data.libraryFile);
                var srcs = [];
                lib.sources.forEach( function(item) {
                    var src = {
                        label: item.label,
                        type: item.type,
                        url: item.url,
                        page: item.page,
                        id:  item.id,
                        thumb: item.thumb
                    };
                    srcs.push(src);
                });
                onComplete.apply(self, [ [{file: self.data.output, data: {"sources": srcs}}] ]);
                break;
        }
    });
};