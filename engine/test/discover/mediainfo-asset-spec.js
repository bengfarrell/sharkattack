// WEAK SAUCE TEST - YOU SHOULD PROBABLY CHANGE THE FILE IF YOU WANNA RUN IT

var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;

var GetMediaInfo = require('../../utils/GetMediaInfo.js');

var log = function(type, message) {
    console.log("\n" + type + " , " + message);
}

var asset = {
    'description': 'test',
    'date': 'Wed Oct 15 2008 00:00:00 GMT-0700 (PDT)',
    'link': 'http://www.youtube.com/embed/OJlKutKKWMU',
    'media': 'http://www.youtube.com/embed/OJlKutKKWMU',
    'label': 'test',
    'filename': "11076632.mp3",
    'mediaType': 'youtube',
    'assetType': 'video',
    'publisher': 'youtube'
};

var cfg = {
    mediaDirectory: "_temp",
    log: log
}

describe("When getting media info for an asset", function () {
    this.timeout(20000)
    before(function(done){
        new GetMediaInfo(asset, function() { done(); }, cfg);
    });

    it("should have a duration", function () {
        expect(asset.duration).is.greaterThan(0);
    });
});
