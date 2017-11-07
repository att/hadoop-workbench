define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dap.core');
    require('shared.layouts');
    require('dashboard');

    return ng.module('user-settings-widget', [
        'dap.core',
        'shared.layouts',
        'dashboard',
        'userSettings',
        'shared.widgets'
    ]);
});
