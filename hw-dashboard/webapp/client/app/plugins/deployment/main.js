define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module constants

    // load module services
    // require('./services/restService');

    // load module models

    // widgets
    require('./dashboard-widgets/deployment-manager-widget/main');

    require('./widgets/search-component-oozie/main');

    // require('./actions/actions');


});
