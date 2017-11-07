define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load widget controllers
    require('./controllers/index');

    // load widget directives
    require('./directives/nodeSelector');
    require('./directives/highlightTextBySearch');

    // load widget filters
    require('./filters/subtypeFilter');

});
