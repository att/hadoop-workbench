define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module constants
    require('./constants/action-types');

    // load module services
    require('./services/restService');
    require('./services/jsonSchemaHelper');

    // load module models

    // widgets

    require('./actions/actions');
});
