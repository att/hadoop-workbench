define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dap.core');
    require('shared.layouts');

    return ng.module('provision-platform-widget', [
        'dap.core',
        'shared.layouts'
    ]);
});
