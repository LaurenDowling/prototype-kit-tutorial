const browserSync = require('browser-sync');
const browserify = require('browserify');
const gulp = require('gulp');
const gulpIf = require('gulp-if');
const gulpPostCss = require('gulp-postcss');
const gulpDartSass = require('gulp-dart-sass');
const gulpSourcemaps = require('gulp-sourcemaps');
const gulpTerser = require('gulp-terser');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');

require('@babel/register');

const babelEsmConfig = require('./babel.conf.esm');
const babelNomoduleConfig = require('./babel.conf.nomodule');
const nunjucksRendererPipe = require('./lib/rendering/nunjucks-renderer-pipe.js').default;
const searchIndexPipe = require('./lib/rendering/search-index-pipe.js').default;
const postCssPlugins = require('./postcss.config').default;

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

const terserOptions = {
  compress: {
    drop_console: true,
  },
};

const sassOptions = {
  includePaths: ['./node_modules/normalize.css', './node_modules/prismjs/themes'],
  outputStyle: 'compressed',
};

const scripts = [
  {
    entryPoint: './src/js/main.js',
    outputFile: 'main.js',
    config: babelEsmConfig,
  },
  {
    entryPoint: ['./src/js/polyfills.js', './src/js/main.js'],
    outputFile: 'main.es5.js',
    config: babelNomoduleConfig,
  },
  {
    entryPoint: './src/js/patternlib/index.js',
    outputFile: 'patternlib.js',
    config: babelEsmConfig,
  },
  {
    entryPoint: './src/js/patternlib/index.js',
    outputFile: 'patternlib.es5.js',
    config: babelNomoduleConfig,
  },
];

gulp.task('clean', () => {
  return Promise.resolve();
});

function createBuildScriptTask({ entryPoint, outputFile, config }) {
  const taskName = `build-script:${outputFile}`;
  gulp.task(taskName, () => {
    return browserify(entryPoint, { debug: isDevelopment })
      .transform('babelify', { ...config, sourceMaps: isDevelopment })
      .bundle()
      .pipe(source(outputFile))
      .pipe(buffer())
      .pipe(gulpIf(isDevelopment, gulpSourcemaps.init({ loadMaps: true })))
      .pipe(gulpIf(isProduction, gulpTerser(terserOptions)))
      .pipe(gulpIf(isDevelopment, gulpSourcemaps.write('./')))
      .pipe(gulp.dest('./build/scripts'))
      .pipe(browserSync.stream());
  });
  return taskName;
}

gulp.task('build-script', gulp.series(...scripts.map(createBuildScriptTask)));

gulp.task('build-styles', () => {
  return gulp
    .src(`./src/scss/*.scss`)
    .pipe(gulpIf(isDevelopment, gulpSourcemaps.init()))
    .pipe(gulpDartSass(sassOptions).on('error', gulpDartSass.logError))
    .pipe(gulpPostCss(postCssPlugins()))
    .pipe(gulpIf(isDevelopment, gulpSourcemaps.write('./')))
    .pipe(gulp.dest('./build/css'))
    .pipe(browserSync.stream());
});

gulp.task('build-pages', () => {
  return gulp
    .src(['./src/**/*.njk', '!**/_*/**'])
    .pipe(nunjucksRendererPipe)
    .pipe(gulp.dest('./build'));
});

gulp.task('build-search-index', () => {
  return gulp
    .src('./src/search-index.json')
    .pipe(searchIndexPipe)
    .pipe(gulp.dest('./build'));
});

gulp.task('copy-static-files', () => {
  return gulp.src('./src/static/**/*').pipe(gulp.dest('./build'));
});

gulp.task('copy-js-files', () => {
  return gulp.src('./src/js/*.js').pipe(gulp.dest('./build/js'));
});

gulp.task('watch-and-build', async () => {
  browserSync.init({
    proxy: 'localhost:3010',
  });

  gulp.watch('./src/**/*.njk').on('change', browserSync.reload);
  gulp.watch('./src/**/*.scss', gulp.series('build-styles'));
  gulp.watch('./src/**/*.js', gulp.series('build-script'));
});

gulp.task('start-dev-server', async () => {
  await import('./lib/dev-server.js');
});

gulp.task('build-assets', gulp.series('build-script', 'build-styles', 'build-search-index'));
gulp.task('build-assets-for-testing', gulp.series('build-script', 'build-styles'));

gulp.task('start', gulp.series('build-assets', 'watch-and-build', 'start-dev-server'));
gulp.task('watch', gulp.series('watch-and-build', 'start-dev-server'));
gulp.task('build', gulp.series('copy-static-files', 'build-assets', 'build-pages'));
gulp.task('build-package', gulp.series('copy-static-files', 'copy-js-files', 'build-assets'));
