var config = require('./models/ConfigurationModel.js');

var Log = require('./utils/Log.js'),
    events = require('events');

var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db;

var OAuth= require('oauth').OAuth;
var https = require('https');


var server = new Server(config.database.server, config.database.port, {auto_reconnect: true});
var db = new Db(config.database.dbName, server);

db.open(function(err, mydb) {
    if(!err) {
        Log.prototype.log("Delayed Tweet", "MongoDB Connected");
        db.authenticate(config.database.username, config.database.password, function(err, mydb){
            db.collection("pendingTweets", function(err, collection) {
                pendingTweets = collection;
                pendingTweets.find().limit(1).toArray(onResult);
            });
        });
    } else {
        Log.prototype.error("Delayed Tweet", "Cannot connect to MongoDB: " + err);
    }
});


function onResult(error, results) {
    var tweeter = new OAuth(
        "https://api.twitter.com/oauth/request_token",
        "https://api.twitter.com/oauth/access_token",
        config.twitter.consumerKey,
        config.twitter.consumerSecret,
        "1.0",
        null,
        "HMAC-SHA1"
    );

    if (results.length > 0) {
        var body = ({'status': results[0].status});
        tweeter.post("http://api.twitter.com/1/statuses/update.json", config.twitter.token, config.twitter.secret, body, "application/json", onTweeted);
        Log.prototype.log("Delayed Tweet", "Tweet: " + body);
        pendingTweets.remove(results[0]);
    } else {
        db.close();
        Log.prototype.log("Delayed Tweet", "Tweet Not Found");
        process.exit(code=0);
    }
}

function onTweeted() {
    Log.prototype.log("Delayed Tweet", "Finished Tweet");
    db.close();
    process.exit(code=0);
}