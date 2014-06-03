var Queue = require( '../utils/Queue');
var Parser = require('./parsers/Parser')

function Discover() {
    var self = this;

    var q = new Queue();

    /**
     * run through and discover media from our sources
     * @param sources
     */
    this.run = function(config, sources) {
        sources.forEach( function (src) {
            q.add(src, loadSource, onSourcesLoaded, true);
        });
    }


    this.loadSource = function(src) {
        new Parser(src, self.onSourceLoaded)
    }

    this.onSourceLoaded = function(src) {

    }

    this.onSourcesLoaded = function() {

    }
}


exports = module.exports = Discover;