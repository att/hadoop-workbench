define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    //load constants
    // @TODO: @cleanup: remove widgetUiControl commented code
    // require('./constants/widgetUiActions');

    // load module controllers
    require('./controllers/index');

});
