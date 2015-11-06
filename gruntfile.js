// File modified from http://gruntjs.com/getting-started

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: ['temp'],

        watch: {
            styles: {
                files: ['src/css/**/*.css'],
                tasks: ['concat:styles'],
                options: {
                    spawn: false,
                }
            },
            scripts: {
                files: ['src/js/**/*.js'],
                tasks: ['concat:scripts'],
                options: {
                    spawn: false
                }
            }
        },

        uglify: {
            build: {
                options: {
                    banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                },
                src: ['src/js/app.js'],
                dest: 'temp/source.min.js'
            },
            deploy: {
                src: 'temp/deploy.js',
                dest: 'deploy/<%= pkg.name %>.min.js'
            }
        },
        cssmin: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                rebase: true
            },
            build: {
                src: [
                    'bower_components/bootstrap/dist/css/bootstrap.min.css',
                    'bower_components/font-awesome/css/font-awesome.min.css',
                    'src/css/**/*.css'],
                dest: 'deploy/<%= pkg.name %>.min.css'
            }

        },
        concat: {

            styles: {
                options: {
                    separator: '\r\r'
                },
                src: ['src/css/**/*.css'],
                dest: 'build/styles.css'
            },

            vendors: {
                options: {
                    separator: '\r\r'
                },
                src: [
                    'bower_components/underscore/underscore.js',
                    'bower_components/knockout/dist/knockout.js',
                    'bower_components/jquery/dist/jquery.js',
                    'bower_components/jquery.nicescroll/jquery.nicescroll.js',
                    'bower_components/q/q.js',
                    'bower_components/bootstrap3-typeahead/bootstrap3-typeahead.min.js',
                    'bower_components/fontawesome-markers/fontawesome-markers.min.js'
                ],
                dest: 'temp/vendors.js'
            },

            deploy: {
                options: {

                },
                src: [
                    'temp/vendors.js',
                    'temp/source.min.js'
                ],
                dest: 'temp/deploy.js'
            },

            scripts: {
                options: {
                    separator: '\r\r'
                },
                src: ['src/js/app.js'],
                dest: 'build/scripts.js'
            }

        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Default task(s).
    grunt.registerTask('default', ['build']);
    grunt.registerTask('delta', ['concat:styles', 'concat:scripts', 'watch']);

    // uglify source file
    // concat vendor files
    // concat vendor file with uglified source file
    // uglify the concat'ed file
    // cssmin
    // clean the temp dir
    grunt.registerTask('build', ['uglify:build', 'concat:vendors', 'concat:deploy', 'uglify:deploy', 'cssmin', 'clean']);

};