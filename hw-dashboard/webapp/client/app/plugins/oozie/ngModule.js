define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');
    require('./pages/oozie-workflow/main');
    require('./pages/workflow-page/main');
    require('./pages/oozie-node-properties/main');
    require('./pages/add-node/main');
    require('./pages/alerts/main');
    require('./pages/jobs/main');
    require('./pages/job-page/main');
    require('./pages/job/main');
    require('./pages/coordinator-job-page/main');
    require('./pages/coordinator-job/main');
    require('./pages/job-log/main');
    require('../../shared/pages/file-browser/main');
    require('../../shared/pages/file-text-viewer/main');
    require('../../shared/pages/info-viewer/main');
    require('../../shared/pages/config-properties-editor/main');
    require('../../shared/pages/config-page/main');
    require('../../shared/pages/uploaded-libs/main');

    require('./dashboard-widgets/oozie-widget/main');

    return ng.module('oozie', [
        'dashboard',
        'oozie.pages.oozie-workflow',
        'file-browser',
        'file-text-viewer',
        'oozie.pages.workflow-page',
        'oozie.pages.node-properties',
        'oozie.pages.add-node',
        'oozie.pages.alerts',
        'oozie.pages.oozie-jobs',
        'oozie.pages.job-page',
        'oozie.pages.coordinator-job-page',
        'oozie.pages.job-log',
        'oozie.pages.job',
        'oozie.pages.coordinator-job',
        'info-viewer',
        'shared.pages.config-properties-editor',
        'shared.pages.config-page',
        'shared.pages.uploaded-libs',
        'oozie-widget'
    ]);
});
