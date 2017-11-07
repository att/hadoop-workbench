define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module controllers
    require('./controllers/index');

    require('./wizards/base/main');
    require('./wizards/flume/main');
    require('./wizards/oozie/main');
});
