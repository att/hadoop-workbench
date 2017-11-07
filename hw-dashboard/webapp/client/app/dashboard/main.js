define(function (require) {
    "use strict";

    require('./ngModule');

    require('./config');

    /*models*/
    require('./models/Widget');
    require('./models/WidgetHeaderTab');
    require("./models/tab-page");
    require("./models/tab-page-events");
    require('./models/page-control');

    /*controllers*/
    require('./controllers/index');

    /*service*/
    require('./services/widget-manager');
    require('./services/search');
    require('./services/dashboard-widget-tab-manager');
    require('./services/dashboard-widget-tab-manager-events');
    require('./services/deferred-result-event');
    require('./services/dashboard-widgets-manager');
    require('./services/user-dashboard-state-service');
    require('./services/user-dashboard-state-resolver');

    //actions
    require('./constants/actions');
    require('./actions/widgets');
    require('./stores/widgets');

    //directives
    require('./directives/dashboard-widget-size');
});
