var Config = require('./utils/Config');

var log = function(type, message) {
    console.log("\n" + type + " , " + message);
};

var cfg = new Config().load('./engine/config.json');
cfg.logging = log;

var Discover = require('./discover/Discover.js');
var discover = new Discover(cfg);
discover.on(Discover.prototype.COMPLETE, function() { cfg.logging("SharkAttack", "Discovery Finished"); });
discover.run(cfg.sourcefeed);