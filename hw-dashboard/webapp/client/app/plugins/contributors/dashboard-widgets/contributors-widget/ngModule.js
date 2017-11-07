define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');

    require('dap.core');
    require('shared.layouts');

    return ng.module('contributors-widget', [
        'dap.core',
        'shared.layouts'
    ]);
});
