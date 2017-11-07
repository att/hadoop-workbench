define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module controllers
    require('./controllers/index');

    // load module services
    require('./services/rest-service');
    require('./services/file-manager');

    // load module models


    // load module values


    // load module constants
    require('./constants/action-events');

    //load actions
    require('./actions/configuration');

    //load stores
    require('./stores/configuration');
});
