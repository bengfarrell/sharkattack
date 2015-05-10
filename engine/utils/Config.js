var fs = require('fs');
var path = require('path');
var osenv = require('osenv');

/**
 * Configuration
 * @constructor
 */
var Config = function() {
    var self = this;

    /** vars to use */
    this.vars = {
        home: osenv.home()
    };

    /**
     * load config
     * @param file
     */
    this.load = function(file) {
        var cfg = JSON.parse(fs.readFileSync(file));
        this.parse(cfg);
        return cfg;
    };

    /**
     * parse config
     * @param cfg
     */
    this.parse = function(cfg) {
        cfg.vars = this.parsevars(cfg.vars);
        cfg = this.injectvars(cfg);
        cfg = this.resolvePaths(cfg);
        return cfg;
    };

    /**
     * resolve/normalize paths in config
     * @param cfg
     */
    this.resolvePaths = function(cfg) {
        for ( var c in cfg ) {
            if (typeof cfg[c] === 'string' && (cfg[c].indexOf('/') !== -1 || cfg[c].indexOf('\\') !== -1)) {
                cfg[c] = path.resolve(cfg[c]);
            } else if (typeof cfg[c] === 'object') {
                cfg[c] = self.resolvePaths(cfg[c]);
            }
        }
        return cfg;
    };

    /**
     * inject vars into config
     * @param cfg
     */
    this.injectvars = function(cfg) {
        for ( var c in cfg ) {
            if (typeof cfg[c] === 'string') {
                var matches = cfg[c].match(/{{([^}]*)}}/g);
                for (var d in matches) {
                    var item = matches[d].substr(2, matches[d].length-4);
                    if (self.vars[item]) {
                        var re = new RegExp('{{' + item + '}}','g');
                        cfg[c] = cfg[c].replace(re, self.vars[item]);
                    }
                }
            } else if (typeof cfg[c] === 'object') {
               cfg[c] = self.injectvars(cfg[c]);
            }
        }
        return cfg;
    };

    /**
     * parse vars
     * @param cfg
     * @param counter
     */
    this.parsevars = function(cfgvars, counter) {
        if (!counter) { counter = 0; }
        counter ++;
        for ( var c in cfgvars ) {
            if (typeof cfgvars[c] === 'string') {
                var matches = cfgvars[c].match(/{{([^}]*)}}/g);
                for (var d in matches) {
                    var item = matches[d].substr(2, matches[d].length-4);
                    if (self.vars[item]) {
                        var re = new RegExp('{{' + item + '}}','g');
                        cfgvars[c] = cfgvars[c].replace(re, self.vars[item]);
                    }
                }
            }
            self.vars[c] = cfgvars[c];
        }

        if (counter > 100) {
            console.log('Malformed Configuration File, please fix');
            return cfgvars;
        }

        if (JSON.stringify(cfgvars).indexOf('{{') !== -1) {
            cfgvars = self.parsevars(cfgvars, counter)
        }

        return cfgvars;
    };
};

module.exports = Config;