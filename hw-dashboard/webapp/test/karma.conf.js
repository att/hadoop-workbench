module.exports = function (config) {
    "use strict";

    config.set({

        basePath: '../',

        files: [
            {pattern: 'client/bower_components/**/*.js', included: false},
            {pattern: 'client/app/**/*.js', included: false},
            {pattern: 'test/unit/**/*.js', included: false},
            'test/test-main.js'
        ],

        exclude: [
            'app/entry.js',
            'app/bootstrap.js'
        ],

        autoWatch: false,

        frameworks: ['jasmine', 'requirejs'],

        browsers: ['Chrome']

    });
};