var file = "http://www.youtube.com/watch?v=-to4zoe_Pjg";

var FileResolver = require('../../download/FileInfo.js');
var fs = require('fs');

var info = new FileResolver();
info.resolve("mp3", "tests/scratch/IRCanada10.mp3");
