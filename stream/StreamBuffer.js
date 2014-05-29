var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    Time = require('../utils/Time.js');

var AssetLibrary = require('../utils/AssetsLibrary.js');

function StreamBuffer(config) {
    var self = this;

    /** configuration */
    this.config = config;

    /** current buffer position */
    this.bufferPosition = 0;

    /** played asset history */
    this.history = [];

    /** assets */
    this.media = AssetLibrary.prototype.flatten(
        JSON.parse( fs.readFileSync(config.locations.libraryLocation + "/data/assets.json") ));
    this.media.sort(function(a, b) {
        return a.date > b.date;
    });

    /**
     * get current metadata
     */
    this.getCurrentMeta = function() {
        return self.current;
    }
    /**
     * write next segment to response
     * @param response buffer
     */
    this.bufferNext = function(seconds) {
        var burst = false;
        if (!self.current) {
            burst = true;
            self.loadNextAsset();
        }
        var bufferSize = Math.ceil(self.config.radio.bufferTime / self.current.duration * self.current.data.length);
        if (burst) {
            bufferSize *= 5; // buffer 5x the data to have a good start buffer
        }

        var remainingBuffer;
        var remainingBufferLength = 0;
        if (self.current.data.length < self.bufferPosition + bufferSize) {
            // fill whats remaining of the asset
            remainingBuffer = new Buffer(self.current.data.length - self.bufferPosition);
            remainingBufferLength = self.current.data.length - self.bufferPosition;
            self.current.data.copy(remainingBuffer, 0, self.bufferPosition, self.current.data.length);
            self.loadNextAsset();
        }

        var blen = bufferSize + remainingBufferLength;
        var b = new Buffer(blen);
        if (remainingBufferLength > 0) {
            remainingBuffer.copy(b);
        }

        self.current.data.copy(b, remainingBufferLength, self.bufferPosition, self.bufferPosition + bufferSize);
        self.bufferPosition += bufferSize;
        return b
    }

    /**
     * load next asset
     */
    this.loadNextAsset = function() {
        if (self.media.length > 0) {
            self.current = self.media.pop();
            console.log("Opening: " + self.config.locations.mediaLocation + path.sep + self.current.filename);
            console.log(self.current.label + " - " + self.current.duration)
            self.current.data = fs.readFileSync(config.locations.mediaLocation + path.sep + self.current.filename);
            self.bufferPosition = 0;
            self.history.push(self.current);
        }
    }

    /**
     * get playback history
     */
    this.getHistory = function() {
        var resp = [];
        for (var c in self.history) {
            resp.push( {
                label: self.history[c].label,
                duration: self.history[c].duration,
                formattedDuration: Time.prototype.formatToString(self.history[c].duration),
                source: self.history[c].source,
                media: self.history[c].media,
                date: new Date(self.history[c].date).toDateString()
            });
        }
        return resp;
    }
}

exports = module.exports = StreamBuffer;