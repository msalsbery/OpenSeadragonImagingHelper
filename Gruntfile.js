/* eslint-env node, es6 */

module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-eslint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-git-describe');
	grunt.loadNpmTasks('grunt-jsdoc');

	// //TODO Use config object in package.json (see https://docs.npmjs.com/files/package.json)
	// var devConfig;
	// try {
	// 	devConfig = require('./devconfig.js');
	// } catch (e) {
	// 	devConfig = null;
	// }

	var packageJson = grunt.file.readJSON('package.json');
	var docsGlobals = '../OpenSeadragonImaging/shared/docs/docs-globals.js';
	var distributionName = 'openseadragon-imaginghelper.js';
	var minifiedName = 'openseadragon-imaginghelper.min.js';
	var srcDir = 'src/';
	var buildDir = 'build/';
	var builtDir = buildDir + 'openseadragon-imaginghelper/';
	var distribution = builtDir + distributionName;
	var minified = builtDir + minifiedName;
	var docsDir = buildDir + 'docs/';
	var publishRepoBuildDir = '../OpenSeadragonImaging/builds/';
	var publishRepoDocsDir = '../OpenSeadragonImaging/docs/openseadragon-imaginghelper/';
	var publishRepoDemoDir = '../OpenSeadragonImaging/demo/';
	var publishRepoDemoLibDir = publishRepoDemoDir + 'lib/';
	// var publishDemoDirDev = devConfig ? devConfig.sitePhysPath : '';
	// var publishBuildDirDev = devConfig ? devConfig.buildPhysPath : '';

	var sources = [srcDir + 'imaginghelper.js'];
	var builtSources = [distributionName, minifiedName];
	var demoSiteSources = ['content/**', 'lib/**', 'scripts/**', 'index.html', 'Web.config'];

	var banner =
		'//! <%= pkg.name %> <%= pkg.version %>\n' +
		'//! Build date: <%= grunt.template.today("yyyy-mm-dd") %>\n' +
		'//! Git commit: <%= grunt.option("gitRevision") %>\n' +
		'//! https://github.com/msalsbery/OpenSeadragonImagingHelper\n';
	//+ '//! License: http://msalsbery.github.io/openseadragonannohost/index.html\n\n';

	grunt.event.once('git-describe', rev => {
		grunt.option('gitRevision', rev);
		// grunt.log.writeln('Git rev tag: ' + rev.tag);
		// grunt.log.writeln('Git rev since: ' + rev.since);
		// grunt.log.writeln('Git rev object: ' + rev.object);
		// grunt.log.writeln('Git rev dirty: ' + rev.dirty);
	});

	grunt.initConfig({
		pkg: packageJson,
		imaginghelperVersion: {
			versionStr: packageJson.version
		},
		'git-describe': {
			options: {
				failOnError: true
			},
			build: {}
		},
		clean: {
			build: {
				src: [builtDir]
			},
			// dev: {
			// 	src: [publishDemoDirDev],
			// 	options: {
			// 		force: true
			// 	}
			// },
			doc: {
				src: [docsDir]
			}
		},
		eslint: {
			options: {
				// fix: true,
				configFile: '.eslintrc.json'
			},
			target: sources
		},
		copy: {
			dev: {
				files: [
					// Copy built source(s) to demo site lib server folder
					{
						expand: true,
						cwd: builtDir,
						src: builtSources,
						dest: publishRepoDemoLibDir //,
						//filter: 'isFile'
					}
				]
			},
			prod: {
				files: [
					// Copy built source(s) to builds folder in OpenSeadragonImaging repository
					{
						expand: true,
						cwd: builtDir,
						src: builtSources,
						dest: publishRepoBuildDir
					},
					// Copy built source(s) to demo/lib folder in OpenSeadragonImaging repository
					{
						expand: true,
						cwd: builtDir,
						src: builtSources,
						dest: publishRepoDemoLibDir
					},
					// Copy documentation files to docs folder in OpenSeadragonImaging repository
					{
						expand: true,
						cwd: docsDir,
						src: ['**'],
						dest: publishRepoDocsDir
					}
				]
			}
		},
		concat: {
			options: {
				banner: banner,
				process: true,
				sourceMap: false
			},
			build: {
				//src:  ['<%= banner %>'].concat(sources),
				src: sources,
				dest: distribution
			}
		},
		uglify: {
			options: {
				compress: {
					sequences: false,
					join_vars: false
				},
				banner: banner,
				sourceMap: false,
				output: {
					comments: false
				}
			},
			build: {
				files: [
					{
						src: distribution,
						dest: minified
					}
				]
			}
		},
		watch: {
			files: ['Gruntfile.js', srcDir + '*.js'],
			tasks: ['build']
			//options: {
			//    event: ['added', 'deleted'], //'all', 'changed', 'added', 'deleted'
			//}
		},
		jsdoc: {
			dist: {
				src: [docsGlobals, distribution], //, 'README.md'
				options: {
					destination: docsDir,
					//template: "node_modules/docstrap/template",
					configure: 'doc-conf.json',
					private: false
				}
			}
		}
	});

	// grunt.registerTask('gitdescribe', () => {
	// 	grunt.event.once('git-describe', (rev) => {
	// 		grunt.option('gitRevision', rev);
	// 		// grunt.log.writeln('Git rev tag: ' + rev.tag);
	// 		// grunt.log.writeln('Git rev since: ' + rev.since);
	// 		// grunt.log.writeln('Git rev object: ' + rev.object);
	// 		// grunt.log.writeln('Git rev dirty: ' + rev.dirty);
	// 	});
	// 	grunt.task.run('git-describe');
	// });

	// // Copies built source to a local server publish folder (see /devconfig.js)
	// grunt.registerTask('publish-dev', function () {
	// 	if (publishDemoDirDev && publishBuildDirDev) {
	// 		grunt.log.writeln('publishBuildDirDev: ', publishBuildDirDev);
	// 		grunt.task.run(['copy:dev']);
	// 	} else {
	// 		throw new Error('devconfig.js error or not implemented!');
	// 	}
	// });

	// Builds and copies sources and docs to OpenSeadragonImaging repository
	grunt.registerTask('publish', ['build', 'doc', 'copy:prod']);

	// Build task(s).
	grunt.registerTask('build', ['clean:build', 'git-describe', 'eslint', 'concat', 'uglify']);

	// Dev task(s).
	grunt.registerTask('dev', ['build', 'copy:dev']);

	// Documentation task(s).
	grunt.registerTask('doc', ['clean:doc', 'jsdoc']);

	// Default task(s).
	grunt.registerTask('default', ['build']);
};
