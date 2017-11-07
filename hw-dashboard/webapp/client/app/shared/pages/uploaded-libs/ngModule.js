define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');

    return ng.module('shared.pages.uploaded-libs', ['dashboard']);
});
