import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import pngquant from 'imagemin-pngquant';
import ftp from 'vinyl-ftp';
import del from 'del';

const $ = gulpLoadPlugins({
	rename: {
		'gulp-connect-php': 'phpConnect'
	}
});

const paths = {
	styles: {
		src: 'src/scss/**/*.scss',
		dest: 'build/css/'
	},
	scripts: {
		src: 'src/js/**/*.js',
		dest: 'build/js/'
	},
	images: {
		src: 'src/{images,favicons}/**/*.{jpg,jpeg,png}',
		dest: 'build/'
	},
	html: {
		src: 'src/**/*.{php,html}',
		watch: ['src/*.php', 'src/components/**/*.html'],
		dest: 'build/'
	}
};
const liveReloadFiles = [
	'build/css/**/*.css',
	'build/js/**/*.js',
	'build/images/**/*.{png,jpg,jpeg}',
	'build/components/**/*.html',
	'build/**/index.php'
];

gulp.task('default', ['serve', 'watch']);

gulp.task('serve', ['connect', 'browser-sync']);

gulp.task('watch', () => {
	gulp.watch(paths.styles.src, ['build:scss']);
	gulp.watch(paths.scripts.src, ['eslint', 'build:js']);
	gulp.watch(paths.images.src, ['minify-images']);
	gulp.watch(paths.html.watch, ['build:html']);
});

// Start the server
gulp.task('connect', () => {
	// PHP server (will be proxied)
	$.phpConnect.server({
		base: './build/',
		hostname: '0.0.0.0',
		port: 6000
	});
});

gulp.task('browser-sync', () => {
	browserSync({
		files: liveReloadFiles,
		proxy: 'localhost:6000',
    	port: 8080,
    	open: false,
    	ui: {
    		port: 3001,
    		weinre: {
    			port: 8000
    		}
    	}
	}, (err, bs) => {
		if (err)
			console.log(err);
		else
			console.log('BrowserSync is ready.');
	});
});

// Build all
gulp.task('build', ['build:html', 'build:scss', 'build:js', 'minify-images'], () => {
	// Copy other required files to build if changed
	gulp.src('src/fonts/**.*')
		.pipe($.changed('build/fonts'))
		.pipe(gulp.dest('build/fonts'));
	gulp.src('src/favicons/**.{json,xml,ico,svg}')
		.pipe($.changed('build/favicons'))
		.pipe(gulp.dest('build/favicons'));
	gulp.src('src/robots.txt')
		.pipe($.changed('build/'))
		.pipe(gulp.dest('build/'));

	if ($.util.env.type === 'deploy') deploy();
});

// HTML/php stuff
gulp.task('build:html', () => {
	gulp.src(paths.html.src)
		.pipe($.changed(paths.html.dest))
		.pipe($.rename((path) => {
			if (path.dirname === '.' && path.extname === '.php' && path.basename !== 'index') {
				path.dirname = path.basename;
				path.basename = 'index';
			}
		}))
		.pipe(gulp.dest(paths.html.dest))
		.pipe(browserSync.reload({
			stream: true
		}));
});

// scss stuff
gulp.task('build:scss', () => {
	gulp.src(paths.styles.src)
		.pipe($.sass().on('error', $.sass.logError))
		.pipe($.autoprefixer())
		// Only uglify if gulp is ran with '--type production' or '--type deploy'
		.pipe($.util.env.type === 'production' || $.util.env.type === 'deploy' ? $.cssnano() : $.util.noop())
		.pipe(gulp.dest(paths.styles.dest))
		.pipe(browserSync.reload({
			stream: true
		}));
});

// JS stuff
gulp.task('eslint', () => {
	gulp.src(paths.scripts.src)
		.pipe($.eslint('.eslintrc'))
		.pipe($.eslint.format());
});

gulp.task('build:js', () => {
	gulp.src(paths.scripts.src)
		.pipe($.changed(paths.scripts.dest))
		.pipe($.babel())
		.pipe($.concat('script.js'))
		// Only uglify if gulp is ran with '--type production' or '--type deploy'
		.pipe($.util.env.type === 'production' || $.util.env.type === 'deploy' ? $.uglify() : $.util.noop())
		.pipe(gulp.dest(paths.scripts.dest))
		.pipe(browserSync.reload({
			stream: true
		}));
});

// Images
gulp.task('minify-images', () => {
	gulp.src(paths.images.src)
		.pipe($.changed(paths.images.dest))
		.pipe($.imagemin({
			progressive: true,
			use: [pngquant()]
		}))
		.pipe(gulp.dest(paths.images.dest));
});

// Deploying
gulp.task('deploy', deploy);
function deploy() {
	const config = require('./config.json');
	const connection = ftp.create({
		host: config.host,
		user: config.user,
		password: config.password,
		log: $.util.log
	});

	const globs = 'build/**';
	const remotePath = config.remote_path;

	// using base = './build' will transfer everything to folder correctly 
	// turn off buffering in gulp.src for best performance 
	return gulp.src(globs, { base: './build', buffer: false })
		.pipe(connection.newer(remotePath)) // only upload newer files 
		.pipe(connection.dest(remotePath));
}

// MISC
gulp.task('rebuild', ['clear:build', 'build']);

gulp.task('clear:build', done => {
	return del('build');
});
