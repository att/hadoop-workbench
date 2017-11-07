define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module controllers
    require('./controllers/index');

    // load module directives
    require('./directives/scroll-top-on-change');

    // load module services
    require('./services/rest-service');
    require('./services/file-navigator');
    require('./services/file-navigator-events');
    require('./services/chmod');
    require('./services/configuration');

    // load module models
    require('./models/item');

    // load module filters
    require('./filters/folders-only');


    // load module constants

    //load actions

    //load stores
});
