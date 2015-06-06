var http = require('http');
var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;

process.setMaxListeners(0);

var Discover = require('../../discovery/Discover.js');

var log = function(type, message) {
    console.log("\n" + type + " , " + message);
}

var soundcloudkey = fs.readFileSync('private/soundcloud_key.txt', 'utf-8'); // private!
var googleanalytics_account = fs.readFileSync('private/google_analytics_account.txt', 'utf-8'); // private!
var googleanalytics_password = fs.readFileSync('private/google_analytics_password.txt', 'utf-8'); // private!


describe("When using Discovery to parse an RSS feed", function() {
    this.timeout(480000);
    var result = [];
    var rssassets = [];

    before(function(done){

        var d = new Discover( {
            mediaDirectory: "_temp",
            dbLocation: './localstore/database',
            log: log } );

        d.on(Discover.prototype.COMPLETE, function (data) {
            result = data.sources;
            result.forEach( function(i) {
                if (i.type == "rss") {
                    rssassets = i.assets;
                }
            });

            done();
        });
        d.run( {
            "sources": [
                {
                    "label": "KEXP Song of the Day",
                    "type": "rss",
                    "url": "http://feeds.kexp.org/kexp/songoftheday?format=xml",
                    "page": "http://kexp.org/podcasting/past.asp?podcast=songoftheday",
                    "description": "KEXP is more than a radio station. KEXP is a dynamic arts organization that provides rich music experiences on the air, online, and on the streets. KEXPs unique services benefit three distinct groups: Music Lovers, Artists, and the Arts Community. KEXPs curatorial staff of 40 DJs, who are widely recognized as experts in their field, present the newest emerging popular artists alongside established bands. KEXPs programming features both variety and specialty shows that brings you the emerging sounds and long-time favorites from the Pacific Northwest, the country, and throughout the world.",
                    "id": "kxpsotd",
                    "thumb": "http://www.blastanova.com/images/kxpsotd.jpg",
                    "maxItems": 5
                }
            ]
        } );
    });

    it("should return at least one asset", function () {
        expect(rssassets.length).to.be.greaterThan(0);
    });

    it("should have durations for assets", function () {
        expect(rssassets[0].duration).to.be.greaterThan(0);
    });
});

describe("When using Discovery to parse a normal webpage", function() {
    this.timeout(240000);
    var result = [];
    before(function(done){

        var d = new Discover( {
            mediaDirectory: "_temp",
            dbLocation: './localstore/database',
            allowYouTube: true,
            allowVimeo: true,
            log: log } );

        d.on(Discover.prototype.COMPLETE, function (data) {
            result = data;
            done();
        });
        d.run( {
            "sources": [
                {
                    label: "Matador Records",
                    type: "webpage",
                    url: "http://matablog.matadorrecords.com",
                    page: "http://matablog.matadorrecords.com",
                    description: "Matador is a NY-based record label with a music blog they update featuring their artists.",
                    id: "matador",
                    thumb: "http://www.blastanova.com/images/matador.jpg",
                    maxItems: 5
                }
            ]
        } );
    });

    it("should return at least one asset", function () {
        var webassets = [];
        result.sources.forEach( function(i) {
            if (i.type == "webpage") {
                webassets = i.assets;
            }
        });
        expect(webassets.length).to.be.greaterThan(0);
    });
});


describe("When using Discovery to parse a SoundCloud playlist", function() {
    this.timeout(120000);
    var result = [];
    before(function(done){

        var d = new Discover( {
            mediaDirectory: "_temp",
            dbLocation: './localstore/database',
            libLocation: './localstore/library.json',
            allowYouTube: true,
            allowVimeo: true,
            "soundcloud": {
                "clientID": soundcloudkey
            },
            log: log } );

        d.on(Discover.prototype.COMPLETE, function (data) {
            result = data;
            done();
        });
        d.run( {
            "sources": [
                {
                    url: "https://api.soundcloud.com/playlists/33749975",
                    type: "soundcloud",
                    label: "Wolfpack",
                    id: "wolfpack",
                    maxItems: 5,
                    description: "Wolfpack Playlist",
                    page: "https://soundcloud.com/derek-wragge/sets/wolfpack"
                }
            ]
        } );
    });

    it("should return at least one asset", function () {
        var soundcloudcount = 0;
        result.sources.forEach( function(i) {
            if (i.type == "soundcloud") {
                soundcloudcount = i.assets.length;
            }
        });
        expect(soundcloudcount).to.be.greaterThan(0);
    });
});



// TEST DOESN'T WORK BECAUSE ASSETS DONT HAVE INFO ENOUGH TO DOWNLOAD THE ITEM
/*describe("When using Discovery to parse a GoogleAnalytics favorite set", function() {
    this.timeout(120000);
    var result = [];
    before(function(done){

        var d = new Discover( {
            mediaDirectory: "_temp",
            log: log } );

        d.on(Discover.prototype.COMPLETE, function (data) {
            result = data;
            done();
        });
        d.run( {
            "sources": [
                {
                    type: "googleanalytics",
                    label: "Blastanova Favorites",
                    id: "bnovafavs",
                    maxItems: 5,
                    description: "Blastanova Favorites",
                    "startDate": new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
                    "endDate": new Date(Date.now()),
                    "account": googleanalytics_account,
                    "username": "bengfarrell@gmail.com",
                    "password": googleanalytics_password,
                    "filters": "eventAction==favorite",
                    "sort": "visitors",
                    "metrics": "visitors",
                    "dimensions": "eventLabel"
                }
            ]
        } );
    });

    it("should return at least one asset", function () {
        expect(result.length).to.be.greaterThan(0);
    });
}); */