define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dap.core');
    require('shared.layouts');
    require('shared/pages/info-viewer/main');
    require('shared/pages/file-browser/main');
    require('hdfs');

    return ng.module('oozie-widget', [
        'dap.core',
        'shared.layouts',
        'info-viewer',
        'file-browser',
        'hdfs-manager-widget'
    ]);
});
