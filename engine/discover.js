var Config = require('./utils/Config');
var Logging = require('./utils/Logging');

var cfg = new Config().load('./engine/config.json');
cfg.log = Logging.console;
Logging.config = cfg;

var starttime = new Date();
var Discover = require('./discover/Discover.js');
var discover = new Discover(cfg);
discover.on(Discover.prototype.COMPLETE, function(lib, stats) {
    cfg.log("SharkAttack", "Discovery Finished");
    Logging.recordTaskRun( { start: starttime, end: new Date(), name: 'discovery', details: stats.totalAssets + ' assets found' } );

});
discover.run(cfg.sourcefeed);