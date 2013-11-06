module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks("grunt-git-describe");
    grunt.loadNpmTasks('grunt-jsdoc');

    var packageJson = grunt.file.readJSON("package.json"),
        srcName = 'openseadragon-imaginghelper.js',
        minifiedName = 'openseadragon-imaginghelper.min.js',
        srcDir = 'src/',
        buildDir = 'build/',
        docsDir = 'docs/',
        demoScriptsDir = 'demo/scripts/',
        src = srcDir + srcName,
        minified = buildDir + minifiedName;

    grunt.initConfig({
        pkg: packageJson,
        "git-describe": {
            build: {
                options: {
                    prop: "gitInfo"
                }
            }
        },
        clean: {
            build: {
                src: [buildDir]
            },
            doc: {
                src: [docsDir]
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            files: [src]
        },
        uglify: {
            options: {
                preserveComments: 'some',
                banner: '//! <%= pkg.name %> <%= pkg.version %>\n'
                      + '//! Build date: <%= grunt.template.today("yyyy-mm-dd") %>\n'
                      + '//! Git commit: <%= gitInfo %>\n'
                      + '//! https://github.com/msalsbery/OpenSeadragonImagingHelper\n',
                      //+ '//! License: http://msalsbery.github.io/openseadragonannohost/index.html\n\n',
            },
            build: {
                src: src,
                dest: minified
            }
        },
        watch: {
            files: ['Gruntfile.js', srcDir + '*.js'],
            tasks: ['build']
            //options: {
            //    event: ['added', 'deleted'], //'all', 'changed', 'added', 'deleted'
            //}
        },
        jsdoc : {
            dist : {
                src: [src, 'README.md'], 
                options: {
                    destination: 'docs',
                    //template: "node_modules/docstrap/template",
                    configure: 'doc-conf.json'
                }
            }
        }
    });

    // Copies un-minified source to build folder
    grunt.registerTask('copy:debugbuild', function() {
        grunt.file.copy(src, buildDir + srcName);
    });

    // Copies built source to demo site folder
    grunt.registerTask('publish', function() {
        grunt.file.copy(buildDir + srcName, demoScriptsDir + srcName);
        grunt.file.copy(minified, demoScriptsDir + minifiedName);
    });

    // Build task(s).
    grunt.registerTask('build', ['clean:build', 'git-describe', 'jshint', 'uglify', 'copy:debugbuild']);

    // Documentation task(s).
    grunt.registerTask('doc', ['clean:doc', 'jsdoc']);

    // Default task(s).
    grunt.registerTask('default', ['build']);

};