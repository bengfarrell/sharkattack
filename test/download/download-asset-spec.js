var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;

var Downloader = require('../../discovery/downloader/Downloader.js');

var log = function(type, message) {
    console.log("\n" + type + " , " + message);
}

var asset = {
    'description': 'test',
    'date': 'Wed Oct 15 2008 00:00:00 GMT-0700 (PDT)',
    'link': 'http://feeds.kexp.org/~r/kexp/songoftheday/~3/vrH1wyL7LV4/c0876cfc-bdb5-46fb-9d7c-4eb7a3527510.mp3',
    'media': 'http://feeds.kexp.org/~r/kexp/songoftheday/~3/vrH1wyL7LV4/c0876cfc-bdb5-46fb-9d7c-4eb7a3527510.mp3',
    'filename': 'c0876cfc-bdb5-46fb-9d7c-4eb7a3527510.mp3',
    'mediatype': 'mp3',
    'label': 'test',
    'page': 'http://kexp.org/podcasting/past.asp?podcast=songoftheday',
    'assetType': 'audio',
    'publisher': 'rss'
};

var cfg = {
    mediaDirectory: "_temp",
    logging: log
}

describe("When Downloading an asset", function() {
    this.timeout(120000)
    before(function(done){
        new Downloader(asset, function() { done(); }, cfg);
    });

    describe("Loading one RSS source", function () {
        it("should download a song", function () {
            expect(fs.existsSync(cfg.mediaDirectory + path.sep + asset.filename)).to.be.true;
        });
    });
});
