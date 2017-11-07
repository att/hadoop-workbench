define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load widget controllers
    require('./controllers/index');

    // load widget services
    require('./services/alertsManager');

    // load widget directives
    require('./directives/alertsContainer');

});
