define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module config
    require('./config');

    // widgets
    require('./json-schema/main');
    require('./object-properties/main');
    require('./workflow-files-viewer/main');
    require('./status-bar-tabs/main');
    require('./css-loader/main');

});
