define(function (require) {
    require('../ngModule').constant('STATES', {
        app: 'app',
        authLogin: 'app.auth-login',
        dashboard: 'app.dashboard',
        moduleError: 'app.moduleError',
        userSettings: 'app.userSettings'
    });
});