var expect = require('chai').expect;
var fs = require('fs');

var Discover = require('../../discovery/Discover.js');

describe("When using Discovery", function() {

    var data;

    before(function(){
        data = fs.readSync('.test/data/feed-library.json');
    });

    describe("Loading one RSS source", function () {
        it("should return a song", function (done) {
            var d = new Discover();
            d.run( {}, data );
            expect(cow.name).to.equal("Anon cow");
        });
    });
});
