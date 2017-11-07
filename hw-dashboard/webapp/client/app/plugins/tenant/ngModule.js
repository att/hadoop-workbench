define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');

    require('shared.widgets');
    require('dap.shared.validation');
    require('dap.shared.dropdownWidget');
    require('angularFileUpload');

    require('./pages/tenant-browser/main');
    require('./pages/tenant-page/main');
    require('./pages/tenant-properties/main');
    require('./pages/tenant-upload/main');

    require('./dashboard-widgets/tenant-browser-widget/main');
    require('./dashboard-widgets/tenant-component-deployment-widget/main');
    require('./dashboard-widgets/tenant-flume-template-widget/main');
    require('./dashboard-widgets/tenant-workflow-template-widget/main');


    return ng.module('tenant', [
        'dashboard',

        'shared.widgets',
        'dap.shared.validation',
        'dap.shared.dropdownWidget',
        'angularFileUpload',

        'tenant.pages.tenant-browser',
        'tenant.pages.tenant-page',
        'tenant.pages.tenant-properties',
        'tenant.pages.tenant-upload',

        'tenant-browser-widget',
        'tenant-component-deployment-widget',
        'tenant-flume-template-widget',
        'tenant-workflow-template-widget'
    ]);
});
