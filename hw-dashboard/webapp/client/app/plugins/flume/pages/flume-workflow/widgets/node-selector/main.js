define(function (require) {
    "use strict";

    require('./ngModule');

    // load widget controllers
    require('./controllers/index');

    // load widget directives
    require('./directives/nodeSelector');
    require('./directives/highlightTextBySearch');

});
