define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module controllers
    require('./controllers/index');

    // load module directives

    // load module services

    // load module models

    // load module values

    // widgets
    require('./widgets/flowchart/main');
    require('./widgets/options-editor/main');
    require('./widgets/node-selector/main');
    require('./widgets/alerts-container/main');
});
