define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dap.core');
    require('shared.layouts');
    require('../../pages/flume-instances/main');
    require('shared/pages/info-viewer/main');
    require('shared/pages/file-browser/main');

    return ng.module('flume-widget', [
        'dap.core',
        'shared.layouts',
        'flume.pages.flume-instances',
        'info-viewer',
        'file-browser'
    ]);
});
