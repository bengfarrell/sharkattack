module.exports = function(grunt) {
    var Log = require('../utils/Log.js');
    var fs = require('fs');
    var path = require('path');

    // ==========================================================================
    // TASKS
    // ==========================================================================

    grunt.registerMultiTask('sa', 'Misc Tasks', function() {
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
            case "init":
                // make required directories
                for (var c in self.data.dirs) {
                    grunt.file.mkdir(self.data.dirs[c]);
                }

                if ( fs.existsSync(self.data.libraryLocation + "/data/removal-list.json") == false) {
                    fs.writeFileSync(self.data.libraryLocation + "/data/removal-list.json", JSON.stringify([]));
                }
                // delete files older than x days
                var logFiles = fs.readdirSync(this.data.logDir);
                logFiles.forEach( function(file) {
                    var info = fs.statSync(self.data.logDir + path.sep + file);
                    var ctime = new Date(info.ctime);
                    var now = new Date();
                    var diff = (now.getTime() - ctime.getTime())/1000 /60 /60;
                    if (diff/24  > self.data.logAge) {
                        Log.prototype.log("Grunt", "Delete " + file);
                        fs.unlinkSync(self.data.logDir + path.sep + file);
                    }
                });

                // set log file output
                Log.prototype.log("Grunt", "SA - Init Task @ " + new Date().toTimeString());
                onComplete.apply(self);
                break;

            case "end":
                Log.prototype.log("Grunt", "SA - End Task @ " + new Date().toTimeString());
                onComplete.apply(self);
                break;

            case "zip":
                Log.prototype.log("Grunt", "SA - Zip Files: " + self.data.src + " to " + self.data.dest);
                var arguments = [self.data.dest, self.data.src, "-r", "-j" ];
                var child = grunt.util.spawn({ cmd: "zip", args: arguments }, function(err) { console.log(err)});
                child.stdout.pipe(process.stdout);
                child.stderr.pipe(process.stderr);
                child.on('close', function (code) {
                    onComplete.apply(self);
                });
                break;

            case "refresh-wan-ip":
                var ip = grunt.file.readJSON(self.data.source).ip_addr;
                var file = '<meta HTTP-EQUIV="REFRESH" content="0; url=http://' + ip + ':3000/index.html">';
                Log.prototype.log("Grunt", "SA - Update WAN IP");
                onComplete.apply(self, [ [{file: self.data.dest, data: file}] ]);
                break;
        }
    });
};