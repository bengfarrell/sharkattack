var fs = require('fs');
var grunt = require('grunt');

function TaskRunner(config) {

    /**
     * run a task
     * @param task object
     * @param output object
     */
    this.run = function (t, o) {
        var log = fs.createWriteStream(config.locations.libraryLocation + "/data/logs/" + t.name + "-" + new Date().toISOString() + ".log");
        var arguments = [t.name];

        if (t.name == "buildShow") {
            arguments.push("--showname");
            arguments.push( this.generateShowName() );
        }

        var child = grunt.util.spawn({ cmd: "grunt", args: arguments }, function(err) { console.log(err)});
        child.stdout.pipe(log);
        child.stderr.pipe(log);

        if (o) {
            child.stdout.pipe(o);
            child.stderr.pipe(o);
        }
        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);
    }

    /**
     * generate a show name
     * @returns {string}
     */
    this.generateShowName = function() {
        var episodesFile = config.locations.libraryLocation + "/data/show-list.json";
        var episodeOffset = config.show.episodeOffset;
        var digits = config.show.numericPlaces;
        var showname = config.show.shortname;

        if ( fs.existsSync(episodesFile) == false) {
            fs.writeFileSync(episodesFile, JSON.stringify([]));
        }
        var ep = grunt.file.readJSON(episodesFile).length + parseInt(episodeOffset);
        var epstr = ('000000000' + ep).substr(-digits);
        return showname + epstr;
    }
}

exports = module.exports = TaskRunner;