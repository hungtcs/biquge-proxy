/* eslint-disable @typescript-eslint/no-var-requires */
const del = require('del');
const gulp = require('gulp');
const sass = require('gulp-sass');

function clean() {
  const task = () => {
    return del([
      'dist/assets/**/*',
    ]);
  };
  return (task.displayName = 'clean', task);
}

function styles(outputStyle = 'expanded') {
  const task = () => {
    return gulp.src('src/styles/**/*.{sass,scss}')
      .pipe(sass({ outputStyle }).on('error', sass.logError))
      .pipe(gulp.dest('dist/assets/styles'));
  };
  return (task.displayName = 'styles', task);
}

function views() {
  const task = () => gulp.src('src/views/**/*').pipe(gulp.dest('dist/views'));
  return (task.displayName = 'views', task);
}

function assets() {
  const task = () => gulp.src('src/assets/**/*').pipe(gulp.dest('dist/assets'));
  return (task.displayName = 'assets', task);
}

function watch() {
  const task = () => {
    // gulp.watch('src/views/**/*', views);
    // gulp.watch('src/assets/**/*', assets);
    gulp.watch('src/styles/**/*.{sass,scss}', styles());
  };
  return (task.displayName = 'watch', task);
}

exports.default = gulp.series(
  clean(),
  // gulp.parallel(styles, views, assets),
  gulp.parallel(styles()),
  watch(),
);

exports.build = gulp.series(
  clean(),
  // gulp.parallel(styles, views, assets),
  gulp.parallel(styles('compressed')),
);
