define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').service('auth.authService', AuthService);

    AuthService.$inject = ['$rootScope', '$http', '$window', 'dap.main.models.User', '$q'];
    function AuthService($rootScope, $http, $window, User, $q) {
        this.login = login;
        this.logout = logout;
        this.getUser = getUser;
        this.getToken = getToken;
        this.getRealms = getRealms;


        function getRealms() {
            return $http.get('/hw/auth/realms').then(function (data) {
                var realms = [].concat(data.data && data.data.data && data.data.data.realms);
                return realms.filter(function (realmObj) {
                    return realmObj && !!realmObj.realm;
                });
            }, processResponse);
        }

        /**
         * @param {{
         *  login:string,
         *  password: string
         * }} credentials
         */
        function login(credentials) {
            var data = {
                username: credentials.login,
                password: credentials.password
            };

            return $http.post('/hw/auth/login', data).then(processResponse, processResponse).then(success);

            function success(response) {
                $window.localStorage.token = response ? response.data.token : '';

                return getUser().then(function (user) {
                    $rootScope.currentUser = user;
                    $rootScope.$emit('currentUser-changed', user);
                    return user;
                });
            }
        }

        function logout() {
            return $http.post('/hw/auth/logout')
                .then(processResponse, processResponse);

        }

        function getUser() {
            return $http.get('/hw/auth/getUser')
                .then(processResponse, processResponse)
                .then(success);

            function success(response) {
                return User.factory({
                    login: response.data.username,
                    features: response.data.features
                });
            }
        }

        function getToken() {
            return $window.localStorage.token;
        }

        function processResponse(response) {
            var data;
            var isWrongFormat = false;
            try {
                data = JSON.parse(response.data);
            }
            catch (e) {
                if (ng.isObject(response.data)) {
                    data = response.data;
                } else {
                    isWrongFormat = true;
                    data = null;
                }
            }
            switch (response.status) {
                case 401:
                    return $q.reject({
                        message: 'Wrong credentials'
                    });
                case 403:
                    return $q.reject({
                        message: 'Not authorized'
                    });
                case 419:
                    return $q.reject({
                        message: 'Session expired'
                    });
                case 404:
                case 500:
                    if (isWrongFormat) {
                        return $q.reject({message: 'Something went wrong on the server'});
                    } else {
                        throw data;
                    }
                case 200:
                case 201:
                    return data;
                default:
                    throw data;
            }
        }
    }
});
