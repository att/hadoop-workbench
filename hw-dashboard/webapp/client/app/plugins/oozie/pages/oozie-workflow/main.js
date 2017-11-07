define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module controllers
    require('./controllers/indexController');
    require('./controllers/oozieErrorController');

    // load module services
    require('./services/NodeFactory');
    require('./services/ConnectionFactory');
    require('./services/node-id-generator');

    // load module values
    require("./values/gridOffset");
    require("./values/uuid");
    require("./values/connectors");

    // widgets
    require('./widgets/flowchart/main');
    require('./widgets/options-editor/main');
    require('./widgets/node-selector/main');
    require('./widgets/alerts-container/main');
});
