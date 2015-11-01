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
                },
            },
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/js/**/*.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },
        cssmin: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/css/**/*.css',
                dest: 'build/<%= pkg.name %>.min.css'
            }
        },
        concat: {

            styles: {
                options: {
                    separator: '\r\r'
                },
                src: ['src/css/**/*.css'],
                dest: 'build/styles.css'
            }

        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('default', ['concat']);

};