module.exports = function(grunt) {
    var DownloadController = require('../controllers/media/DownloadController.js');
    var BuildPlaylistController = require('../controllers/showbuilder/BuildPlaylistController.js');
    var FileUtils = require('../utils/File.js');
    var Log = require('../utils/Log.js');
    var fs = require("fs");

    // ==========================================================================
    // TASKS
    // ==========================================================================

    grunt.registerMultiTask('sa-buildshow', 'Build Show from Script', function() {
        var self = this;
        self.done = this.async();
        self.data = this.data;

        var onComplete = function(output) {
            if (output) {
                output.forEach( function(o) {
                    if (o.file) {
                        Log.prototype.log("Output", o.file);
                        grunt.file.write(o.file, o.data);
                    }
                });
            }
            self.done.apply();
        }

        switch (this.target) {
            case "build-playlist":
                Log.prototype.log("Task", "SA - Build Show/Playlist");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.libraryFile);
                self.data.library = grunt.file.readJSON(self.data.libraryFile);
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.scriptFile);
                self.data.script = grunt.file.readJSON(self.data.scriptFile);
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.interstitialLibraryFile);
                self.data.interstitialLibrary = grunt.file.readJSON(self.data.interstitialLibraryFile);
                Log.prototype.addLineBreak();
                new BuildPlaylistController().process(this.data, onComplete);
                break;

            case "download-interstitials":
                Log.prototype.log("Task", "SA - Download Interstitials From Playlist");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.scriptFile);
                Log.prototype.addLineBreak();
                self.data.script = grunt.file.readJSON(self.data.scriptFile);
                self.data.assetslist = [];
                self.data.script.script.forEach( function(item) {
                    if (item.media) {
                        item.type = "mp3";
                        item.assetType = "audio";
                        item.filename = FileUtils.prototype.convertPathToFilename(item.media);
                        self.data.assetslist.push(item);
                    }

                    if (item.mapping) {
                        item.mapping.forEach( function(item2) {
                            item2.type = "mp3";
                            item2.assetType = "audio";
                            item2.filename = FileUtils.prototype.convertPathToFilename(item2.media);
                            self.data.assetslist.push(item2);
                        });
                    }
                });
                new DownloadController().process(this.data, onComplete);
                break;

            case "copy-show-assets":
                Log.prototype.log("Task", "SA - Copy Show Media");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.playlistFile);
                Log.prototype.addLineBreak();
                var pls = grunt.file.readJSON(self.data.playlistFile);

                var assets = [];
                var interstitials = [];
                pls.forEach( function(item) {
                    if (item.type == "interstitial") {
                        interstitials.push(item.filename);
                    } else {
                        assets.push(item.filename);
                    }
                });

                File.prototype.copyFiles(assets, self.data.mediaDirectory, self.data.showDirectory);
                File.prototype.copyFiles(interstitials, self.data.interstitialDirectory, self.data.showDirectory);
                onComplete.apply(self);
                break;

            case "record-show":
                Log.prototype.log("Task", "SA - Record Show");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.showHistoryFile);

                if ( fs.existsSync(self.data.showHistoryFile) == false) {
                    fs.writeFileSync(self.data.showHistoryFile, JSON.stringify([]));
                }

                var showHistory = grunt.file.readJSON(self.data.showHistoryFile);
                showHistory.push( { "name": self.data.showname, "date": new Date().toDateString() });
                onComplete.apply(self, [ [
                    {file: self.data.showHistoryFile, data: JSON.stringify(showHistory, null, '\t')}] ]);
        }
    });
};