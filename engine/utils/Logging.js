var fs = require('fs');
var path = require('path');
var util = require('util');
var File = require('./File');
var time = require('./Time');

function Logging() {}

Logging._filestreams = {};

/**
 * Log to console
 * @param type of log
 * @param message
 */
Logging.console = function(type, message) {
    console.log("\n" + type + " , " + message);
};

/**
 * start new job for logging
 * @param job
 */
Logging.newJob = function(job) {
    Logging._currentJob = new Date().getTime() + '-' + job;
};

/**
 * write to file
 * @param file id
 * @param type of log
 * @param message
 * @param details
 */
Logging.write = function(type, message, details) {
    var now = new Date();
    var folder = now.getFullYear() + '-' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()];
    File.prototype.ensureDirectoriesExist(Logging.config.vars.logsDirectory + path.sep + folder);

    var loglevel = 'no log level';
    if (details && details.level) {
        loglevel = details.level;
    }
    var file = Logging._currentJob + '-' + loglevel;

    if (!Logging._filestreams[file]) {
        Logging._filestreams[file] = fs.createWriteStream(Logging.config.vars.logsDirectory + path.sep + folder + path.sep + file + '.txt');
    }

    Logging._filestreams[file].write(details.date + '\t' + type + '\t' + message + '\n');

    if (loglevel === 'error') {
        Logging._filestreams[file].write(util.inspect(details, { showHidden: true, depth: null }) + '\n');
    }

    Logging._filestreams[file].write('\n\n');
};

/**
 * record that a task has run and completed
 * @param cfg object
 * @param task object
 */
Logging.recordTaskRun = function(task) {
    File.prototype.ensureDirectoriesExist(Logging.config.vars.logsDirectory);
    var log = {};
    if (fs.existsSync(Logging.config.logging.runlog)) {
        log = JSON.parse(fs.readFileSync(Logging.config.logging.runlog));
    }

    if (!log[task.name]) {
        log[task.name] = [];
    }

    var diffinseconds = Math.abs(task.end.getTime() - task.start.getTime()) / 1000;
    log[task.name].push( { start: task.start.toString(), end: task.end.toString(), duration: time.prototype.formatToString(diffinseconds), details: task.details } );
    if (log[task.name].length > 100) {
        log[task.name] = log[task.name].splice(log[task.name].length - 100, log[task.name].length);
    }
    fs.writeFileSync(Logging.config.logging.runlog, JSON.stringify(log, null, 2));
};

Logging.newJob('default');
exports = module.exports = Logging;