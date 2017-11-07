define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    //load constants
    require('./constants/widgetUiActions');

    // load module controllers
    require('./controllers/index');

    //services
    require('./services/file-helper');

});
