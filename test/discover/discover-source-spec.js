var expect = require('chai').expect;
var sinon = require('sinon');
var http = require('http');
var fs = require('fs');
var path = require('path');

var Discover = require('../../discovery/Discover.js');

describe("When using Discovery", function() {
    //this.timeout(15000);
    var data;
    before(function(){
        data = JSON.parse(fs.readFileSync('test/data/feed-library.json', 'utf8'));
        var d = new Discover();
        d.run( {}, data );
        //sinon.wrapMethod(http, "request", function () { console.log("hiya"); });
       // data = fs.readFileSync('test/data/feed-library.json');
    });

    describe("Loading one RSS source", function () {
        it("should return a song", function (done) {

        });
    });
});
