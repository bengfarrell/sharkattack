var Config = require('./utils/Config');
var Logging = require('./utils/Logging');

var cfg = new Config().load('./engine/config.json');
cfg.log = Logging.console;
Logging.config = cfg;

var starttime = new Date();
var Clean = require('./clean/Clean.js');
var clean = new Clean(cfg);
clean.on(Clean.prototype.COMPLETE, function(deleted) {
    cfg.log("SharkAttack", "Cleanup Finished");
    Logging.recordTaskRun( { start: starttime, end: new Date(), name: 'packaging', details: deleted.length + ' files deleted' } );
});
clean.run(cfg.mediaDirectory, cfg.cleaning.ignoreDirectories, cfg.libLocation);