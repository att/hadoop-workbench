define(function (require) {
    "use strict";

    require('./config');

    require('./services/base-wizard');

    require('./widgets/platform/index');
    require('./widgets/cluster/index');
});
