var expect = require('chai').expect;

var Queue = require('../../utils/Queue.js');

var mockdata = [
    { "name": "Queue Item 1", "type": "queue item", "message": "i am"},
    { "name": "Queue Item 2", "type": "queue item", "message": " a completed"},
    { "name": "Queue Item 3", "type": "queue item", "message": " queue"}
];

var log = function(type, message, date) {
    //console.log("\n" + type + " , " + message);
}

describe("Queue", function() {

    var q;
    var concat = "";
    var completecount = 0;

    before(function(){
        q = new Queue( {logging: log} );
    });

    describe("create a queue", function () {
        it("should instantiate", function () {
            expect(q).to.not.be.undefined;
        });
    });

    describe("add an item", function () {

        before(function(){
            var task = function(item, cb) {
                concat += item.message;
                cb();
            }

            var callback = function() {
                completecount ++;
            }
            q.add(mockdata[0], task, callback, true);
            q.add(mockdata[1], task, callback, true);
            q.add(mockdata[2], task, callback, true);
        });

        it("should have 3 items in queue", function () {
            expect(q.getLength()).to.equal(3);
        });
    });

    describe("run the queue", function () {

        var result;

        before(function(done){
            q.run( function(items) {
                result = items;
                done();
            });
        });

        it("should do all the work tasks in order", function () {
             expect(concat).to.equal("i am a completed queue");
        });

        it("should have fired all the callbacks and incremented this tests callback count", function () {
            expect(completecount).to.equal(3);
        });

        it("should have a result returned on callback that contains the input items", function () {
            expect(result[0].name).to.equal("Queue Item 1");
            expect(result[1].name).to.equal("Queue Item 2");
            expect(result[2].name).to.equal("Queue Item 3");
        });
    });

    describe("clear the queue", function () {
        before(function(){
            q.clear();
        });

        it("should be empty", function () {
            expect(q.getLength()).to.equal(0);
        });
    });

    describe("run new async tasks in queue", function () {
        before(function(done){
            completecount = 0;
            var task = function(item, cb) {
                setTimeout( function() {
                    cb();
                }, Math.random()*500);
            }

            var callback = function() {
                completecount ++;
            }

            q.add(mockdata[0], task, callback, true);
            q.add(mockdata[1], task, callback, true);
            q.add(mockdata[2], task, callback, true);
            q.run( function() { done(); });
        });

        it("should have run and counted 3 completed tasks", function () {
            expect(completecount).to.equal(3);
        });

        after(function() {
            q.clear();
        });
    });


    describe("run new async tasks in queue and ignore those that keep firing", function () {
        before(function(done){
            completecount = 0;
            var task = function(item, cb) {
                setInterval( function() {
                    // an interval will repeatedly fire
                    cb();
                }, Math.random()*500);
            }

            var callback = function() {
                completecount ++;
            }

            q.add(mockdata[0], task, callback, true);
            q.add(mockdata[1], task, callback, true);
            q.add(mockdata[2], task, callback, true);
            q.run( function() { done(); });
        });

        it("should have run and counted 3 completed tasks", function () {
            expect(completecount).to.equal(3);
        });

        after(function() {
            q.clear();
        });
    });


    describe("run a series of tasks with one not concurrent and firing last", function () {
        var lastmessage = "";
        var result;

        before(function(done){

            var task = function(item, cb) {
                setTimeout( function() {
                    lastmessage = item.name;
                    cb();
                }, Math.random()*500);
            }

            var callback = function() {}

            q.add(mockdata[0], task, callback, true);
            q.add(mockdata[1], task, callback, true);
            q.add(mockdata[2], task, callback, false);
            q.run( function(items) {
                result = items;
                done();
            });
        });

        it("should have run 3 tasks", function () {
            expect(result.length).to.equal(3);
        });

        after(function() {
            q.clear();
        });
    });
});
