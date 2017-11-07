define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module services
    require('./services/restService');
    require('./services/node-id-generator');
    require('./services/node-factory');
    require('./services/file-manager');
    require('./services/component-saver');

    // load module models
    require("./models/Module");
    require("./models/Node");
    require("./models/service-instance");
    require("./models/node-counter");
    require("./models/node-property");

    // load module values
    require("./values/gridOffset");
    require("./values/uuid");

    //load not included modules
    require("./dashboard-widgets/flume-widget/main");

    // load module constants
    require("./constants/actions");
});
