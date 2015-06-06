var fs = require('fs');
var path = require('path');
var File = require('./File');
var time = require('./Time');

function Logging() {}

/**
 * Log to console
 * @param type of log
 * @param message
 */
Logging.console = function(type, message) {
    console.log("\n" + type + " , " + message);
};

/**
 * record that a task has run and completed
 * @param cfg object
 * @param task object
 */
Logging.recordTaskRun = function(task) {
    File.prototype.ensureDirectoriesExist([Logging.config.vars.logsDirectory]);
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
exports = module.exports = Logging;