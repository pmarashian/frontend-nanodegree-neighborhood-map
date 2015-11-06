// File modified from http://gruntjs.com/getting-started

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

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
                dest: 'deploy/source.min.js'
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
                    'bower_components/underscore/underscore-min.js',
                    'bower_components/knockout/dist/knockout.js',
                    'bower_components/jquery/dist/jquery.min.js',
                    'bower_components/jquery.nicescroll/jquery.nicescroll.js',
                    'bower_components/q/q.js',
                    'bower_components/bootstrap3-typeahead/bootstrap3-typeahead.min.js',
                    'bower_components/fontawesome-markers/fontawesome-markers.min.js'
                ],
                dest: 'deploy/vendors.js'
            },

            deploy: {
                options: {

                },
                src: [
                    'deploy/vendors.js',
                    'deploy/source.min.js'
                ],
                dest: 'deploy/<%= pkg.name %>.min.js'
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

    // Default task(s).
    grunt.registerTask('default', ['build']);
    grunt.registerTask('delta', ['concat:styles', 'concat:scripts', 'watch']);
    grunt.registerTask('build', ['uglify', 'concat:vendors', 'concat:deploy', 'cssmin']);

};