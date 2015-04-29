var log = function(type, message) {
    //console.log("\n" + type + " , " + message);
};

var config = {
    mediaInfoExecutable: './libs/MediaInfo.exe',
    youtubedlExecutable: './libs/youtube-dl.exe',
    ffmpegExecutable: './libs/ffmpeg.exe',
    mediaDirectory: './localstore/media',
    showLocation: './localstore/shows',
    showIntro: 'VO_intro.mp3',
    showOutro: 'VO_outtro.mp3',
    libLocation: './localstore/output.json',
    dbLocation: './localstore/database',
    allowYouTube: true,
    allowVimeo: true,
    logging: log };

var BuildShow = require('./package/BuildShow.js');
var showbuilder = new BuildShow(config);
var show = 'test';
showbuilder.on(BuildShow.prototype.COMPLETE, function() { config.logging("SharkAttack", "Show " + show + " created" ); });
showbuilder.run(show, 10800, './localstore/output.json');

/*
var VOCreation = require('./package/VOCreation.js');
var fs = require('fs');

var vo = new VOCreation();
vo.create('en', 'You just heard Black Eunuch by Algiers and before that you heard Should Have Known Better by Sufjan Stevens', function(result) {
    if(result.success) {
        fs.writeFileSync( 'tstvo.mp3', result.audio, 'base64');
    }
});*/

/*var fs = require('fs');
var tts = require('node-google-text-to-speech')

tts.translate('en', 'hi from me', function(result) {
    console.log(result);
    if(result.success) { //check for success
        fs.writeFileSync( 'tstvo.mp3', result.audio, 'base64');
    }
});*/