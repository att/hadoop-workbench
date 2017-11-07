define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // load module config
    require('./filters/filesize');

    // load module controllers
    require('./controllers/index');
});
