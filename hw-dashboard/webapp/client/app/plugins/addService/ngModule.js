define(function (require) {
    "use strict";

    require('dap.core');
    require('dashboard');
    require('./dashboard-widgets/create-tenant-component-widget/main');
    require('./dashboard-widgets/create-tenant-widget/main');
    require('./dashboard-widgets/provision-platform-widget/main');

    return require('angular').module('addService', [
        'dashboard',
        'dap.core',
        'create-tenant-component-widget',
        'create-tenant-widget',
        'provision-platform-widget'
    ]);
});
