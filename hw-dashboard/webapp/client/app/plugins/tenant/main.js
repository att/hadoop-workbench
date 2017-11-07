define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module services
    require('./services/restService');
    require('./services/tenant-file-manager');
    require('./services/oozie-component-saver');
    require('./services/flume-component-saver');

    // load module models
    require('./models/TenantContainer');
    require('./models/TenantTemplateContainer');

    // widgets
    require('./widgets/upload-tenant/main');
    require('./widgets/edit-tenant/main');

    require('./dashboard-widgets/tenant-browser-widget/main');
    require('./dashboard-widgets/tenant-workflow-template-widget/main');
    require('./dashboard-widgets/tenant-flume-template-widget/main');
    require('./dashboard-widgets/tenant-component-deployment-widget/main');

    require('./constants/action-types');
    require('./constants/error-types');
    require('./actions/actions');

});
