define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module controllers
    require('./controllers/accordionWidget');

    // load module directives
    require('./directives/accordionWidget');
    require('./directives/pane');
    require('./directives/paneContent');
    require('./directives/paneHeader');

});