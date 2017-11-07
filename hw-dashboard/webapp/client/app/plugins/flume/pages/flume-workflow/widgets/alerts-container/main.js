define(function (require) {
    "use strict";

    require('./ngModule');

    // load widget controllers
    require('./controllers/index');

    // load widget services
    require('./services/alertsManager');

    // load widget directives
    require('./directives/alertsContainer');

});
