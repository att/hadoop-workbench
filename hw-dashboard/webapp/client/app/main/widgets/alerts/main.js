define(function (require) {
    "use strict";

    require('./directives/alertsContainer');
    require('./directives/alertMessage');

    /*models*/
    require('./models/AlertButton');
    require('./models/AlertBase');
    require('./models/AlertSuccess');
    require('./models/AlertWarning');
    require('./models/AlertError');
    require('./models/AlertInfo');

    require('./constants/action-types');
    require('./actions/action-creators');

    require('./reducers/data');

    require('./services/alertsManager');
});