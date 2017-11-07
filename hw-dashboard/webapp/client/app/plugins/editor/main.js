define(function (require) {
    "use strict";

    require('codemirrorWrapper');
    require('./ngModule');
    require('./config');
    require('./controllers/index');
    require('./directives/pagination');
});
