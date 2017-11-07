define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module constants
    require('./constants/icons');
    require('./constants/locations');
    require('./constants/action-types');
    require('./constants/indexation-status');
    require('./constants/indexation-types');
    require('./constants/config-request-status');
    require('./constants/config-request-types');
    require('./constants/platform-types');

    // load module services
    require('./services/locationService');
    require('./services/restService');
    require('./services/websocketService');
    require('./services/widgetHelper');

    // load module models
    require('./models/platform');
    // require('./models/cluster');
    require('./models/cluster-meta-factory');
    require('./models/json-section-property-meta-factory');
    // require('./models/cluster-hdfs-access');
    require('./models/cluster-indexation');
    require('./models/cluster-config-request');
    // require('./models/cluster-oozie-access');
    // require('./models/cluster-job-tracker-access');
    // require('./models/cluster-zoo-keeper-access');
    // require('./models/cluster-job-history-access');
    // require('./models/cluster-resource-manager-access');
    require('./models/platform-access-info');

    // widgets
    require('./dashboard-widgets/platform-manager-widget/main');

    require('./actions/actions');
});
