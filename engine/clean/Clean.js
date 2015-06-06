var fs = require('fs');
var path = require('path');
var events = require("events");
var util = require('util');
var File = require('../utils/File');
var Library = require('../utils/Library');

/**
 * Clean
 * @param config
 * @constructor
 */
function Clean(config) {
    var self = this;

    /**
     * run our cleaning routine
     * @param directory
     * @param ignore list
     * @param current library
     */
    this.run = function(dir, ignoredirs, lib) {
        var deletelist = this.catalog(dir, ignoredirs, lib);

        for (var c in deletelist) {
            fs.unlinkSync(deletelist[c]);
        }
        self.emit(Clean.prototype.COMPLETE, deletelist);
    };

    /**
     * simulate a run
     * @param directory
     * @param ignore list
     * @param current library
     */
    this.simulate = function(dir, ignoredirs, lib) {
        var orphaned = this.catalog(dir, ignoredirs, lib);
    };

    /**
     * simulate a run
     * @param directory
     * @param ignore list
     * @param current library
     * @return orphaned files
     */
    this.catalog = function(dir, ignoredirs, lib) {
        var lib = JSON.parse(fs.readFileSync(lib));
        var libassets = Library.prototype.flattenToAudioFileList(lib, config.mediaDirectory);
        var mediafiles = File.prototype.getAllFiles(dir, ignoredirs);
        var orphaned = this.getOrphanedMedia(libassets, mediafiles);

        var orphanedsize = 0;
        for (var c in orphaned) {
            orphanedsize += fs.statSync(orphaned[c]).size
        }

        var libsize = 0;
        for (var c in libassets) {
            libsize += fs.statSync(libassets[c]).size;
        }

        var allmediasize = 0;
        for (var c in mediafiles) {
            allmediasize += fs.statSync(mediafiles[c]).size
        }

        config.log('Clean', 'All Media : ' + mediafiles.length + ' files (' + (allmediasize / 1000000.0).toFixed(2) + 'MB)', { date: new Date(), level: "normal" });
        config.log('Clean', 'Current Library : ' + libassets.length + ' files (' + (libsize / 1000000.0).toFixed(2) + 'MB)', { date: new Date(), level: "normal" });
        config.log('Clean', 'To Clean: ' + orphaned.length + ' files (' + (orphanedsize / 1000000.0).toFixed(2) + 'MB)', { date: new Date(), level: "normal" });

        return orphaned;
    };

    /**
     * get list of files that aren't recorded in the library
     * @param assets
     * @param files
     */
    this.getOrphanedMedia = function(assets, files) {
        var orphaned = [];
        for (var c in files) {
            if (assets.indexOf(files[c]) === -1) {
                orphaned.push(files[c]);
            }
        }
        return orphaned;
    }
}

module.exports = Clean;
util.inherits(Clean, events.EventEmitter);
Clean.prototype.COMPLETE = "CleanComplete";