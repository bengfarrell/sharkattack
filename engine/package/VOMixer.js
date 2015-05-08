/**
 * Copied from Node-Google-Text-To-Speech module
 * https://github.com/ashafir20/node-google-text-to-speech
 *
 * Altered to not change output to Base64 String, and since I'm
 * modifying it for my own purposes, I'll make it more directly tied in
 * as a VO creation script (mix with bed if I can)
 */

var request = require('request');
var fs = require('fs');
var http = require('http');
var path = require('path');
var ffmpeg = require('./../utils/ffmpeg-node');
var GetMediaInfo = require('./../utils/GetMediaInfo');

/**
 * Mix a spoken VO with a music bed
 */
var VOMixer = function(config) {
    var self = this;

    /**
     * c-tor
     */
    this.init = function() {};

    /**
     * mix VO with music bed
     * @param options
     * @param callback
     */
    this.mix = function(opts, callback) {
        config.logging('VOMixer', 'Mixing: ' + opts.vo + ' and  ' + opts.bed + ' to ' + opts.outfile, { date: new Date(), level: "verbose" });

        new GetMediaInfo(opts.vo, function(err, asset) {
            /**
             * Example FFMPEG call
             ffmpeg -i vo-block-1.mp3 -i VO_musicbed.mp3 -filter_complex "[1:0]afade=t=in:d=5,afade=t=out:st=30:d=5[BED];[0:0]adelay=7000,a
             pad=pad_len=40000[VO];[VO][BED]amix=inputs=2:duration=shortest" -ar 44100 out.mp3
             */
            // please note that VO end padding is not in seconds but number of samples
            var endPaddingSamples = opts.voEndPadding * asset.samplingrate;

            ffmpeg.exec(['-i', opts.vo, '-i', opts.bed, "-filter_complex",
                    '[1:0]afade=t=in:d=' + opts.fadeInDuration +
                    ',afade=t=out:st=' + (asset.duration + opts.voDelay + opts.voEndPadding - opts.fadeOutDuration) + ':d=' + opts.fadeOutDuration +
                    '[BED];[0:0]adelay=' + opts.voDelay * 1000 + ',apad=pad_len=' +
                    endPaddingSamples + '[VO];[VO][BED]amix=inputs=2:duration=shortest',
                    '-ar', opts.outFileSampleRate, opts.outfile], config,
                function() {
                    // update with new duration
                    asset.duration = asset.duration + opts.voDelay + opts.voEndPadding;
                    self.onMixComplete(callback, asset);
                });
        }, config);
    };

    /**
     * on mix complete
     */
    this.onMixComplete = function(callback, asset) {
        callback.apply(self, [asset]);
    };

    this.init();
};

exports = module.exports = VOMixer;