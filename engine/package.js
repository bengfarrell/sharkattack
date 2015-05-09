var Config = require('./utils/Config');

var log = function(type, message) {
    console.log("\n" + type + " , " + message);
};

var cfg = new Config().load('engine/config.json');
cfg.logging = log;


var BuildShow = require('./package/BuildShow.js');
var showbuilder = new BuildShow(cfg);
var show = 'test';
showbuilder.on(BuildShow.prototype.COMPLETE, function() { cfg.logging("SharkAttack", "Show " + show + " created" ); });
showbuilder.run(show, 10800, cfg.libLocation);