define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    require('./constants/storage-keys');

    // load module controllers
    require('./controllers/index');
});
