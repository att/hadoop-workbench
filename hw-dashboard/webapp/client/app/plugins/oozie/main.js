define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    //constants
    require('./constants/actions');

    //actions
    require('./actions/actions');

    // load module services
    require('./services/restService');
    require('./services/job-rest-service');
    require('./services/oozie-file-manager');
    require('./services/job-pages-coordinator');
    require('./services/component-saver');

    // load module models
    require('./models/Module');
    require('./models/Node');
    require('./models/Job');
    require('./models/job-action');

    require('./dashboard-widgets/oozie-widget/main');
});
