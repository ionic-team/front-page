var gulp = require('gulp'),
  buildConfig = require('./config/build.config'),
  gutil = require('gulp-util'),
  concat = require('gulp-concat'),
  argv = require('minimist')(process.argv.slice(2)),
  footer = require('gulp-footer'),
  header = require('gulp-header'),
  jshint = require('gulp-jshint'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  sass = require('gulp-sass'),
  watch = require('gulp-watch');

gulp.task('build', function () {
  return gulp.src(buildConfig.jsFiles)
    .pipe(concat('ionic-analytics.js'))
    .pipe(header(buildConfig.closureStart))
    .pipe(footer(buildConfig.closureEnd))
    .pipe(header(buildConfig.banner))
    .pipe(gulp.dest(buildConfig.dist));
});

gulp.task('watch', ['build'], function() {
  gulp.watch(['src/**/*.js'], ['build']);
});

gulp.task('default', ['build']);
