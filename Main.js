var express = require('express');
var grunt = require('grunt');
var app = express();
var fs = require('fs');
var git = require('git-rev');
var TaskRunner = require('./TaskRunner.js');

var StreamBuffer = require('./stream/StreamBuffer.js');
var config = {
    bufferInterval: 2
};

var file = __dirname + '/config.json';
var streamingConnections = [];
var buffer;
var taskrunner;

app.use(express.compress());
app.use(express.bodyParser());

fs.readFile(file, function (err, data) {
    if (err) { console.log('Error: ' + err); return; }

    config = JSON.parse(data);
    app.use(express.static(__dirname + '/server'));
    app.use(express.static(config.locations.libraryLocation));
    console.log("Library Location: " + config.locations.libraryLocation);

    taskrunner = new TaskRunner(config);
    var cronJob = require('cron').CronJob;
    config["scheduled-tasks"].forEach( function(t) {
        new cronJob(t.schedule, function(){ taskrunner.run(t); }, null, true);
    });
});

app.get('/kickoff', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Connection':'keep-alive'
    });

    try {
        taskrunner.run({name: req.query.task}, res);
    } catch (e) {
        res.end(e.toString());
    }
});

app.get('/about.json', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    git.branch(function (str) {
        res.end(JSON.stringify({"version": str}));
    });
});

app.get('/logfiles.json', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    var lgfiles = [];
    var files = fs.readdirSync(config.locations.libraryLocation + "/data");
    for (var c in files) {
        if (fs.lstatSync(config.locations.libraryLocation + "/data/" + files[c]).isDirectory()) {
            subfiles = fs.readdirSync(config.locations.libraryLocation + "/data/" + files[c]);
            subfiles.forEach( function(sub) {
                lgfiles.push({type: files[c], file: files[c] + path.sep + sub});
            });
        } else {
            lgfiles.push({type: "data", file: files[c] });
        }
    }
    res.end(JSON.stringify(lgfiles));

});

app.post('/save/sources', function(req, res){
    var data = req.body;
    fs.writeFile(config.locations.libraryLocation + "/data/feed-library.json", JSON.stringify(data, null, 4), function(err) {
        if(err) {
            console.log(err);
        }
    });
    res.send("ok");
});

app.post('/save/show', function(req, res){
    var data  = req.body;
    fs.writeFile(config.locations.libraryLocation + "/data/playlist-script.json", JSON.stringify(data, null, 4), function(err) {
        if(err) {
            console.log(err);
        }
    });
    res.send("ok");
});

app.get('/stream/nowplaying.json', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });
    if (buffer) {
        res.end(JSON.stringify(buffer.getHistory().reverse()));
    } else {
        res.end(JSON.stringify([]));
    }
});

app.get('/stream', function(req, res) {
    var data;
    if (streamingConnections.length == 0) {
        buffer = new StreamBuffer(config);
        data = buffer.bufferNext(config.radio.bufferTime);

        setInterval( function() {
            var data = buffer.bufferNext(config.radio.bufferTime);
            for (stream in streamingConnections) {
                streamingConnections[stream].write(data);
            }
        }, 2000);
    }
    res.writeHead(200, {
        'Content-Type': 'audio/mpegurl',
        'Connection':'keep-alive',
        'icy-name': buffer.getCurrentMeta().label,
        'icy-genre': "Cool Stuff",
        'icy-url': "http://sharkattack.com"
    });

    if (data) {
        res.write(data);
    }
    streamingConnections.push(res);
});

var server = app.listen(3000);

process.on('exit', function() {
    server.close();
});