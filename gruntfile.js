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
            },
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: [
                    'bower_components/underscore/underscore-min.js',
                    'bower_components/knockout/dist/knockout.js',
                    'bower_components/jquery/dist/jquery.min.js',
                    'bower_components/jquery.nicescroll/jquery.nicescroll.min.js',
                    'bower_components/q/q.js',
                    'bower_components/bootstrap3-typeahead/bootstrap3-typeahead.min.js',
                    'src/js/**/*.js'],
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

            scripts: {
                options: {
                    separator: '\r\r'
                },
                src: ['src/js/**/*.js'],
                dest: 'build/scripts.js'
            }

        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('default', ['concat']);
    grunt.registerTask('delta', ['concat', 'watch']);
    grunt.registerTask('build', ['uglify', 'cssmin']);

};