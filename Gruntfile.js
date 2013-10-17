module.exports = function(grunt) {

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jsdoc');

    var packageJson = grunt.file.readJSON("package.json"),
        src = 'scripts/openseadragon-imaginghelper.js',
        minified = 'scripts/openseadragon-imaginghelper.min.js';

    grunt.initConfig({
        pkg: packageJson,
        clean: {
            doc: {
                src: [
                    'docs/'
                ]
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
                banner: '//! <%= pkg.name %> ' + packageJson.version + ' <%= grunt.template.today("yyyy-mm-dd") %>\n'
            },
            build: {
                src: src,
                dest: minified
            }
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

    // Documentation task(s).
    grunt.registerTask('doc', ['clean:doc', 'jsdoc']);

    // Default task(s).
    grunt.registerTask('default', ['jshint', 'uglify']);

};