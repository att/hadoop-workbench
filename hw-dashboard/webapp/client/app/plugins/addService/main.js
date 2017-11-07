define(function (require) {
    "use strict";

    require('./ngModule');

    require('./config');

    require('./models/wizard');
    require('./models/wizard-step');

    require('./wizards-tenant/base/main');
    require('./wizards-tenant/flume/main');
    require('./wizards-tenant/oozie/main');

    require('./wizards-platform/base/main');


    require('./dashboard-widgets/create-tenant-component-widget/main');
    require('./dashboard-widgets/create-tenant-widget/main');

    require('./dashboard-widgets/provision-platform-widget/main');
});
