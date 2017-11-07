define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');
    require('editor');

    return ng.module('file-text-viewer', ['dashboard', 'editor']);
});
