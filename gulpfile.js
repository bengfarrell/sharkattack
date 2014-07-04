var gulp = require('gulp');
var shell = require('gulp-shell');
var downloadatomshell = require('gulp-download-atom-shell');

gulp.task('downloadatomshell', function(cb){
    downloadatomshell({
        version: '0.13.3',
        outputDir: 'binaries'
    }, cb);
});

gulp.task('dev', shell.task([
    'binaries/atom client'
]))

gulp.task('default', ['downloadatomshell']);