define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load module controllers
    require('./controllers/tabset');

    // load module directives
    require('./directives/tabset');
    require('./directives/tab');
    require('./directives/tab-content-transclude');
    require('./directives/tab-heading-transclude');

});
