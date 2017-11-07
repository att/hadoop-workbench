define(function (require) {
    "use strict";

    require('./config');

    require('./services/oozie-wizard');

    require('./widgets/version/index');
    require('./widgets/template/index');
    require('./widgets/input-data/index');
});
