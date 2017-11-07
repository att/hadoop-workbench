define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');
    require('./pages/platforms-browser/main');
    require('./pages/platforms-page/main');
    require('./pages/platform-info/main');
    require('./pages/clusters-browser/main');
    require('./pages/clusters-page/main');
    require('./pages/cluster-info/main');
    require('./pages/kafka-topics-browser/main');
    require('./pages/kafka-topics-page/main');
    require('./pages/access-keys/main');
    require('./pages/service-users/main');
    require('./pages/cluster-users/main');
    require('./dashboard-widgets/cluster-configuration-widget/main');
    require('./dashboard-widgets/platform-manager-widget/main');

    return ng.module('platform', [
        'dashboard',
        'platform.pages.platforms-browser',
        'platform.pages.platforms-page',
        'platform.pages.platform-info',
        'platform.pages.clusters-browser',
        'platform.pages.clusters-page',
        'platform.pages.cluster-info',
        'platform.pages.kafka-topics-browser',
        'platform.pages.kafka-topics-page',
        'platform.pages.access-keys',
        'platform.pages.service-users',
        'platform.pages.cluster-info.cluster-users',
        'cluster-configuration-widget',
        'platform-manager-widget'
    ]);
});
