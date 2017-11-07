define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dap.core');
    require('shared.layouts');
    require('hdfs');

    return ng.module('tenant-workflow-template-widget', [
        'dap.core',
        'shared.layouts',
        'hdfs-manager-widget'
    ]);
});
