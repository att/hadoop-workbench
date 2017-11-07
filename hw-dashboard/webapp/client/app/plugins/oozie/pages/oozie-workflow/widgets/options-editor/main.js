define(function (require) {
    "use strict";

    // load module definition
    require('./ngModule');

    // load widget controllers
    require('./controllers/indexController');

    // load widget directives
    require('./directives/optionsEditor');

});
