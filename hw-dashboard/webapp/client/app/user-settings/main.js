define(function (require) {
    "use strict";

    require('./ngModule');
    require('./config');

    require('./models/storage');
    require('./services/rest-service');
    require('./services/settingsResolver');

    require('./dashboard-widgets/user-settings-widget/main');
});
