module.exports = function(grunt) {
    var DiscoveryController = require('../controllers/metadata/DiscoveryController.js');
    var ReconcileController = require('../controllers/metadata/ReconcileController.js');
    var DiscoverFavoritesController = require('../controllers/social/DiscoverFavoritesController.js');
    var Log = require('../utils/Log.js');

    // ==========================================================================
    // TASKS
    // ==========================================================================

    grunt.registerMultiTask('sa-discover', 'Discover new music from sources.', function() {
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
            case "discover":
                Log.prototype.log("Task", "SA - Discovery Task");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.feedlistSource);
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.removalListFile);
                Log.prototype.addLineBreak();

                self.data.removalList = grunt.file.readJSON(self.data.removalListFile);
                self.data.feedlist = grunt.file.readJSON(self.data.feedlistSource).sources;

                // special dev mode will only take two sources
                if (self.data.dev == true) {
                    self.data.feedlist = self.data.feedlist.splice(0,2);
                }

                new DiscoveryController().process(this.data, onComplete);
                break;

            case "discover-favorites":
                Log.prototype.log("Task", "SA - Discover Favorites Task");
                Log.prototype.addLineBreak();
                Log.prototype.log("Grunt", "Reading: " + self.data.assetslistFile);
                Log.prototype.addLineBreak();
                self.data.assetslist = grunt.file.readJSON(self.data.assetslistFile);
                new DiscoverFavoritesController().process(this.data, onComplete);
                break;
        }
    });
};