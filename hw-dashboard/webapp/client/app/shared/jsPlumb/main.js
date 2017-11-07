define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module directives
    require('./directives/jsPlumbConnections');
    require('./directives/jsPlumbContainer');
    require('./directives/jsPlumbItem');
    require('./directives/jsPlumbRemoveNode');

});
