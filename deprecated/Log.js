var fs = require('fs');

function Log() {}

Log.prototype.writeLog = function(msg) {
    if (Log.prototype.logFile) {
        var d = new Date();
        fs.appendFile(Log.prototype.logFile, d.toTimeString()  + " :: " + msg + "\n", function (err) {
            if (err) throw err;
        });
    }
}

Log.prototype._log = "";
Log.prototype._errors = "";

Log.prototype.log = function(origin, message) {
    console.log(origin + ": " + message);
    //Log.prototype.writeLog(origin + ": " + message);
    Log.prototype._log += message + "\n";
}

Log.prototype.unitTestLog = function(origin, message) {
    console.log("** UNIT TEST ** " + origin + ": " + message);
    Log.prototype._log += message + "\n";
}

Log.prototype.warn = function(origin, message) {
    console.log("WARNING " + origin + ": " + message);
    //Log.prototype.writeLog("WARN:: " + origin + ": " + message);
    Log.prototype._log += message + "\n";
    Log.prototype._errors += message + "\n";
}

Log.prototype.error = function(origin, message) {
    console.log("ERROR " + origin + ": " + message);
    //Log.prototype.writeLog("ERROR:: " + origin + ": " + message);
    Log.prototype._log += message + "\n";
    Log.prototype._errors += message + "\n";
}

Log.prototype.addLineBreak = function() {
    console.log(" ");
    //Log.prototype.writeLog("");
    Log.prototype._log += "\n";
}

Log.prototype.getLogData = function() {
    return Log.prototype._log;
}

Log.prototype.getErrorLogData = function() {
    return Log.prototype._errors;
}
exports = module.exports = Log;