define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module controllers
    require('./controllers/index');

    require('./actions/platforms');
    require('./actions/clusters');

    require('./stores/platforms');
    require('./stores/clusters');
});
