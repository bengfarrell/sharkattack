// WEAK SAUCE TEST - YOU SHOULD PROBABLY CHANGE THE FILE IF YOU WANNA RUN IT

var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;

var Transcoder = require('../../discovery/assettasks/Transcoder.js');

var log = function(type, message) {
    console.log("\n" + type + " , " + message);
}

var asset = {
    'description': 'test',
    'date': 'Wed Oct 15 2008 00:00:00 GMT-0700 (PDT)',
    'link': 'http://www.youtube.com/embed/OJlKutKKWMU',
    'media': 'http://www.youtube.com/embed/OJlKutKKWMU',
    'label': 'test',
    'filename': "eoaAP11p3sI.mp4",
    'mediaType': 'youtube',
    'assetType': 'video',
    'publisher': 'youtube'
};

var cfg = {
    mediaDirectory: "_temp",
    logging: log
}

describe("When transcoding a video asset", function () {
    this.timeout(20000)
    before(function(done){
        new Transcoder(asset, function() { done(); }, cfg);
    });

    it("should exist as mp3 afterwards", function () {
        expect(fs.existsSync(cfg.mediaDirectory + path.sep + "eoaAP11p3sI.mp3")).to.be.true;
    });
});
