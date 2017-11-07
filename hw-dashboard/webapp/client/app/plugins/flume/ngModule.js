define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dap.core');
    require('dashboard');
    require('./pages/flume-workflow/main');
    require('./pages/flume-instances/main');
    require('./pages/pipeline-page/main');
    require('./pages/node-properties/main');
    require('./pages/add-node/main');
    require('./pages/alerts/main');
    require('./pages/instance-page/main');
    require('./pages/instance/main');
    require('../../shared/pages/info-viewer/main');
    require('./dashboard-widgets/flume-widget/main');

    return ng.module('flume', [
        'dap.core',
        'dashboard',
        'flume.pages.flume-workflow',
        'flume.pages.flume-instances',
        'flume.pages.pipeline-page',
        'flume.pages.node-properties',
        'flume.pages.add-node',
        'flume.pages.alerts',
        'flume.pages.instance-page',
        'flume.pages.instance',
        'info-viewer',
        'flume-widget'
    ]);
});
