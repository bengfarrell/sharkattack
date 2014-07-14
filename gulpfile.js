var gulp = require('gulp');
var shell = require('gulp-shell');
var downloadatomshell = require('gulp-download-atom-shell');

gulp.task('downloadatomshell', function(cb){
    downloadatomshell({
        version: '0.13.3',
        outputDir: 'binaries'
    }, cb);
});

gulp.task('demo', shell.task([
    'binaries/atom client true'
]));

gulp.task('democ', shell.task([
    'binaries/atom client true components/' + gulp.env.comp + '/demo.html'
]));

gulp.task('default', ['downloadatomshell']);