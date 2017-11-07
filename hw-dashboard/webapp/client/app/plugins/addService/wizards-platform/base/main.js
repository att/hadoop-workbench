define(function (require) {
    "use strict";

    require('./config');

    require('./services/base-wizard');

    require('./widgets/cluster-details/index');

    require('./widgets/access/index');

    require('./widgets/universal/index');
});
