define(function (require) {
    "use strict";

    require('dap.core');
    require('./pages/settings-page/main');
    require('./pages/settings-nodes/main');
    require('./pages/access-keys/main');
    require('./pages/service-users/main');
    require('./pages/user-settings-properties/main');
    require('./pages/security-settings-properties/main');
    require('./pages/aws-provision-settings-properties/main');
    require('./pages/settings-users/main');
    require('./dashboard-widgets/user-settings-widget/main');

    return require('angular').module('userSettings', [
        'dap.core',
        'userSettings.pages.settings-page',
        'userSettings.pages.settings-nodes',
        'user-settings.pages.access-keys',
        'user-settings.pages.service-users',
        'userSettings.pages.user-settings-properties',
        'userSettings.pages.security-settings-properties',
        'userSettings.pages.aws-provision-settings-properties',
        'userSettings.pages.settings-users',
        'user-settings-widget'
    ]);
});
