var log = function(type, message) {
    //console.log("\n" + type + " , " + message);
};

var config = {
    mediaInfoExecutable: './libs/MediaInfo.exe',
    youtubedlExecutable: './libs/youtube-dl.exe',
    ffmpegExecutable: './libs/ffmpeg.exe',
    mediaDirectory: './localstore/media',
    packaging: {
        showLocation: './localstore/shows',
        showIntro: 'VO_intro.mp3',
        showVOBed: 'VO_musicbed.mp3',
        voFadeInDuration: 5,
        voFadeOutDuration: 2,
        voDelay: 7,
        voEndPadding: 4,
        voOutFileSampleRate: 44100
    },
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