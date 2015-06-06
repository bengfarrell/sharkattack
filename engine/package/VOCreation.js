/**
 * Copied from Node-Google-Text-To-Speech module
 * https://github.com/ashafir20/node-google-text-to-speech
 *
 * Altered to not change output to Base64 String, and since I'm
 * modifying it for my own purposes, I'll make it more directly tied in
 * as a VO creation script
 */

var request = require('request');
var fs = require('fs');
var File = require('../utils/File')
var http = require('http');
var path = require('path');

/**
 * Escape special characters in the given string of html.
 *
 * @param  {String} languageLocale = the target locale language (example : en)
 * @param  {String} word = the word to translate to speech
 * @param  {function({'audio' : String, 'message' : String })} callback = function invoked on translate completed with two
 * arguments : audio data as base64 and success true for translated ok and false otherwise
 */
var VOCreation = function(config) {
    var self = this;

    /** voice cache to avoid duplicate requests */
    this.voiceCache = {};

    /** max chars in each network request */
    this.maxChars = 80;

    /** response speech data */
    this.data = [''];

    /** url for TTS request */
    this.url = 'http://translate.google.com/translate_tts?tl=';

    /** language locale */
    this.locale = '';

    /**
     * c-tor
     */
    this.init = function() {
        if ( !fs.existsSync(config.mediaDirectory + '/vosegments')) {
            fs.mkdirSync(config.mediaDirectory + '/vosegments');
        }
    };

    /**
     * create VO
     * @param languageLocale
     * @param words
     * @param callback
     */
    this.create = function(languageLocale, words, callback) {
        config.log('VOCreation', 'Creating VO: ' + words, { date: new Date(), level: "verbose" });
        this.callback = callback;
        this.locale = languageLocale;
        var chunked = words.split(' ');
        this.requests = [''];

        // separate network requests by words vs character limits
        for (var chunk in chunked) {
            this.appendWord(chunked[chunk]);
        }

        // clean the list
        this.requests = this.requests.filter(function(value) {
            return value !== '';
        });

        this.requests.reverse();
        this.nextRequest();
    };

    /**
     * append word to requests
     * @param txt
     */
    this.appendWord = function(txt) {
        if (txt === '' || txt === ' ') {
            return;
        }

        // handle speech breaks
        if (txt.indexOf(VOCreation.SPEECHBREAK) > -1) {
            var wrds = txt.split(VOCreation.SPEECHBREAK);
            for (var c in wrds) {
                if ( self.requests[self.requests.length-1] !== '') {
                    self.appendWord(wrds[c]);
                    self.requests[self.requests.length-1] = self.requests[self.requests.length-1].trim();
                    self.requests.push('');
                } else {
                    self.appendWord(wrds[c]);
                }
            }
            return;
        }

        // make new request if over max char limit
        if (self.requests[self.requests.length-1].length + txt.length >= self.maxChars) {
            self.requests[self.requests.length-1] = self.requests[self.requests.length-1].trim();
            self.requests.push(txt);
        } else {
            self.requests[self.requests.length-1] += txt + ' ';
        }
    };

    /**
     * make request
     */
    this.nextRequest = function() {
        var txt = self.requests.pop();

        // can we use a cached response?

        if ( fs.existsSync(config.mediaDirectory + path.sep + 'vosegments'  + path.sep + escape(txt) + '.mp3')) {
            var data = fs.readFileSync(config.mediaDirectory + path.sep + 'vosegments' + path.sep + File.prototype.safeFilename(txt) + '.mp3', 'base64');
            self.data[self.data.length-1] += data;
            config.log('VOCreation', 'Using previously created VO segment: ' + txt, { date: new Date(), level: "verbose" });
            self.onRequestComplete(txt);
            return;
        }

        http.get(self.url + self.locale + '&q=' + txt, function(response) {
            response.setEncoding('base64');
            response.on('data', function (chunk) {
                self.data[self.data.length-1] += chunk;
            });

            response.on('end', function () {
                config.log('VOCreation', 'Created VO Segment: ' + txt, { date: new Date(), level: "verbose" });
                self.onRequestComplete(txt);
            });
        });
    };

    /**
     * on request complete - finish or do next
     */
    this.onRequestComplete = function(txt) {
        if (self.requests.length > 0 ) {
            config.log('VOCreation', 'Caching VO Segment: ' + txt, { date: new Date(), level: "verbose" });
            fs.writeFileSync(config.mediaDirectory + path.sep + 'vosegments' + path.sep + File.prototype.safeFilename(txt) + '.mp3', self.data[self.data.length-1], 'base64');
            self.data.push('');
            self.nextRequest();
        } else {
            var result = {'audio': self.data.join(), 'success': true};
            self.callback(result);
            self.data = [];
        }
    };

    this.init();
};

VOCreation.SPEECHBREAK = '<speechbreak>';

exports = module.exports = VOCreation;