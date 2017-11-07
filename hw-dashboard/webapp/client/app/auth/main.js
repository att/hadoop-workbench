define(function (require) {
    "use strict";

    require('./ngModule');

    require('./config');

    require('./controllers/login');

    require('./services/auth');
    require('./services/authInterceptor');
    require('./services/authResolver');

    require('./constants/AUTH_EVENTS');
});
