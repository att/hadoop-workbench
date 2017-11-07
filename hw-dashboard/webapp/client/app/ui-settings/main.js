define(function (require) {
    "use strict";

    require('./ngModule');

    require('./models/storage');
    require('./services/rest-service');
    require('./services/settingsResolver');
});
