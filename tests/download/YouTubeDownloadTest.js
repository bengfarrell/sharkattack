var testURL = "http://www.youtube.com/watch?v=-to4zoe_Pjg";

var YouTubeDownload = require('../../download/YouTubeDownload.js');
var spawn = require('child_process').spawn
var FileUtils = require('../../utils/File.js');
var Log = require('../../utils/Log.js');
var fs = require('fs');

var youtubedl = new YouTubeDownload();
youtubedl.download(testURL, "test.mp4","");
