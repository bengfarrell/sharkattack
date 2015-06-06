var expect = require('chai').expect;

var Database = require('../../utils/Database.js');

var log = function(type, message, date) {
    //console.log("\n" + type + " , " + message);
}

describe("When connecting to a database asynchronously", function() {

    var db;
    before(function(done){
        db = new Database( {log: log, dbLocation: './database'} );
        db.connect('testtable');
        db.on(Database.prototype.CONNECTED, function() { done(); } );
    });

    describe("can insert a record", function () {
        var error;

        before(function(done){
            db.insert( 'test', { 'test': 'hi' }, function(err) {
                error = err;
                done();
            });
        });

        it("should not throw error", function () {
            expect(error).to.be.undefined;
        });
    });

    describe("can find a record", function () {
        var error;

        it("should return a record", function () {
            var result = db.find('test');
            expect(result.test).to.equal('hi');
        });
    });
});


describe("When connecting to a database synchronously", function() {
    var db;
    before( function() {
        db = new Database( {log: log, dbLocation: './database'} );
    });

    describe("can insert a record", function () {
        var error;
        before(function(done){
            db.connectSync('testtable2');
            db.insert( 'test', { 'test': 'hi' }, function(err) {
                error = err;
                done();
            });
        });

        it("should not throw error", function () {
            expect(error).to.be.undefined;
        });
    });

    describe("can find a record", function () {
        var error;

        it("should return a record", function () {
            db.connectSync('testtable2');
            var result = db.find('test');
            expect(result.test).to.equal('hi');
        });
    });
});
