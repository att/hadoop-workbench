define(function (require) {
    "use strict";

    require('./config');

    require('./services/oozie-wizard');

    require('./services/oozie-space-wizard');

    require('./widgets/path/index');

    require('./widgets/space/index');
});
