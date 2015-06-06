var Config = require('./utils/Config');
var Logging = require('./utils/Logging');

var cfg = new Config().load('engine/config.json');
cfg.log = Logging.console;
Logging.config = cfg;

var starttime = new Date();
var BuildShow = require('./package/BuildShow.js');
var showbuilder = new BuildShow(cfg);
var show = 'test';//'SA164';

showbuilder.on(BuildShow.prototype.COMPLETE, function(stats) {
    cfg.log("SharkAttack", "Show " + show + " created" );
    Logging.recordTaskRun( { start: starttime, end: new Date(), name: 'packaging', details: 'Show ' + show + ' created' } );
});
showbuilder.run(show, 10800, cfg.libLocation);