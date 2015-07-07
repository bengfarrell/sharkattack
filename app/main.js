var Config = require('../engine/utils/Config');
var Scheduler = require('../engine/schedule/Scheduler');
var Logging = require('../engine/utils/Logging');
var Discover = require('../engine/discover/Discover.js');
var BuildShow = require('../engine/package/BuildShow.js');
var Clean = require('../engine/clean/Clean.js');
var ipc = require('ipc');

var tron = require('tron-app');
var app = new tron.app();
global['config'] = new Config().load('engine/config.json');

ipc.on('guiEvent', function(e, event) {
    app.runTask(event.details.task);
});

app.on('ready', function() {
    var self = this;
    global['config'].log = function(type, message, details) {
        // need to convert from date to string to send over
        if (!details) {details = {}};
        if (!details.date) { details.date = new Date()};
        details.datestring = details.date.toString();
        self.mainWindow.send('engineEvent', {type: 'log', details: {type: type, message: message, details: details} });
        Logging.write(type, message, details);
    };
    Logging.config = global['config'];
    var schedule = new Scheduler(global['config']);
    schedule.on(Scheduler.RUN_TASK, function(task) {
        var starttime = new Date();
        self.runTask(task);
    });
});

/**
 * run a task
 * @param task
 */
app.runTask = function(task) {
    var self = this;
    if (typeof task === 'object') {
        task = task.detail.task;
    }
    global['config'].log('SharkAttack', 'Run task ' + task, { date: new Date(), level: 'verbose' });
    var starttime = new Date();
    Logging.newJob(task);

    switch(task) {
        case 'discovery':
            self.mainWindow.send('engineEvent', {type: 'taskRunningStatus', details: {task: task, running: true } });
            var discover = new Discover(global['config']);
            discover.on(Discover.prototype.COMPLETE, function(lib, stats) {
                global['config'].log('SharkAttack', 'Discovery Finished', { date: new Date(), level: 'verbose' });
                Logging.recordTaskRun( { start: starttime, end: new Date(), name: 'discovery', details: stats.totalAssets + ' assets found' } );
                self.mainWindow.send('engineEvent', {type: 'taskRunningStatus', details: {task: task, running: false } });
            });
            discover.run(global['config'].sourcefeed);
            Logging.newJob('default');
            break;

        case 'packaging':
            var showbuilder = new BuildShow(global['config']);
            var shonum = 165;
            var show = 'SA' + shownum;
            showbuilder.on(BuildShow.prototype.COMPLETE, function(stats) {
                global['config'].log("SharkAttack", "Show " + show + " created" );
                Logging.recordTaskRun(global['config'], { start: starttime, end: new Date(), name: 'packaging', details: 'Show ' + show + ' created', shownum: shownum } );
                Logging.newJob('default');
            });
            showbuilder.run(show, 10800, global['config'].libLocation);
            break;

        case 'cleaning':
            var clean = new Clean(global['config']);
            clean.on(Clean.prototype.COMPLETE, function(deleted) {
                global['config'].log("SharkAttack", "Cleanup Finished");
                Logging.recordTaskRun( { start: starttime, end: new Date(), name: 'packaging', details: deleted.length + ' files deleted' } );
                Logging.newJob('default');
            });
            clean.run(global['config'].mediaDirectory, global['config'].cleaning.ignoreDirectories, global['config'].libLocation);
            break;
    }
};

