'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            safir: {
                src: [
                    'src/template/core/*.js',
                    'src/template/processor/*.js',
                    'src/core/object.js',
                    'src/core/listener.js',
                    'src/core/option.js',
                    'src/core/request.js',
                    'src/core/event_target.js',
                    'src/core/view.js',
                    'src/core/form.js',
                    'src/core/data.js',
                    'src/third-party/laravel.js',
                    'src/third-party/bootstrap.js',
                    'src/helpers/*.js',
                    'src/core/init.js'],
                dest: 'build/safir.js',
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['concat']);

};
