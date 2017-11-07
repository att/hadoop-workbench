define(function (require) {
    "use strict";

    require('./config');

    require('./services/flume-wizard');
    require('./services/flume-hdp-wizard');

    require('./widgets/service/index');
    require('./widgets/componentName/index');
    require('./widgets/plugin-dirs/index');
});
