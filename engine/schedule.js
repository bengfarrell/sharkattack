var Config = require('./utils/Config');
var Scheduler = require('./schedule/Scheduler');
var Logging = require('./utils/Logging');

var Discover = require('./discover/Discover.js');
var BuildShow = require('./package/BuildShow.js');
var Clean = require('./clean/Clean.js');

var cfg = new Config().load('engine/config.json');
cfg.log = Logging.console;
Logging.config = cfg;
var q = new Queue();
q.run();

var schedule = new Scheduler(cfg);
schedule.on(Scheduler.RUN_TASK, function(task) {
    q.add(task, function(task, cb) {
        var starttime = new Date();
        switch(task) {
            case 'discovery':
                var discover = new Discover(cfg);
                discover.on(Discover.prototype.COMPLETE, function(lib, stats) {
                    cfg.log("SharkAttack", "Discovery Finished");
                    Logging.recordTaskRun( { start: starttime, end: new Date(), name: 'discovery', details: stats.totalAssets + ' assets found' } );
                    cb();
                });
                discover.run(cfg.sourcefeed);
                break;

            case 'packaging':
                var showbuilder = new BuildShow(cfg);
                var shonum = 165;
                var show = 'SA' + shownum;
                showbuilder.on(BuildShow.prototype.COMPLETE, function(stats) {
                    cfg.log("SharkAttack", "Show " + show + " created" );
                    Logging.recordTaskRun(cfg, { start: starttime, end: new Date(), name: 'packaging', details: 'Show ' + show + ' created', shownum: shownum } );
                    cb();
                });
                showbuilder.run(show, 10800, cfg.libLocation);
                break;

            case 'cleaning':
                var clean = new Clean(cfg);
                clean.on(Clean.prototype.COMPLETE, function(deleted) {
                    cfg.log("SharkAttack", "Cleanup Finished");
                    Logging.recordTaskRun( { start: starttime, end: new Date(), name: 'packaging', details: deleted.length + ' files deleted' } );
                });
                clean.run(cfg.mediaDirectory, cfg.cleaning.ignoreDirectories, cfg.libLocation);
                break;
        }
    }, function(task) {
        schedule.refresh();
    });
});