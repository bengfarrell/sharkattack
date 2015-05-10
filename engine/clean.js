var Config = require('./utils/Config');

var log = function(type, message) {
    console.log("\n" + type + " , " + message);
};

var cfg = new Config().load('./engine/config.json');
cfg.logging = log;

var Clean = require('./clean/Clean.js');
var clean = new Clean(cfg);
clean.on(Clean.prototype.COMPLETE, function() { cfg.logging("SharkAttack", "Cleanup Finished"); });
clean.run(cfg.mediaDirectory, cfg.cleaning.ignoreDirectories, cfg.libLocation);