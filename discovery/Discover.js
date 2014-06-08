var Queue = require( '../utils/Queue');
var Parser = require('./parsers/Parser');
var http = require('http');

function Discover() {
    var self = this;

    var q = new Queue();

    /**
     * run through and discover media from our sources
     * @param sources
     */
    this.run = function(config, data) {
        data.sources.forEach( function (src) {
            q.add(src, self.loadSource, self.onSourcesLoaded, true);
        });
        q.run();
    }


    this.loadSource = function(src) {
        new Parser(src, self.onSourceLoaded)
    }

    this.onSourceLoaded = function(src) {
        self.emit(SoundCloudParser.prototype.SOUNDCLOUD_PARSING_COMPLETE, src);
    }

    this.onSourcesLoaded = function() {
        self.emit(Discover.prototype.COMPLETE, q);
    }
}

Discover.prototype.COMPLETE = "DiscoverComplete";
exports = module.exports = Discover;