define(function (require) {
    "use strict";

    require('../ngModule').controller('auth.loginController', loginController);

    loginController.$inject = ['$scope', '$rootScope', 'auth.authService', '$stateParams', 'auth.AUTH_EVENTS'];
    function loginController($scope, $rootScope, authService, $stateParams,  AUTH_EVENTS) {

        $scope.credentials = {
            login: '',
            password: ''
        };

        $scope.isDatalistVisible = false;
        $scope.errorMessage = '';

        $scope.logIn = logIn;

        $scope.showValidationErrors = false;

        function logIn(credentials) {
            if ($scope.authLoginForm.$invalid) {
                $scope.showValidationErrors = true;
                return;
            }
            $scope.errorMessage = '';
            authService.login(credentials).then(success, error);

            function success(user) {
                $scope.setCurrentUser(user);
                $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, {
                    user: user,
                    redirect: $stateParams.r
                });
            }

            function error(error) {
                $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
                $scope.errorMessage = (error && error.message ? error.message : "Something wrong on the server or with your credentials...");
            }
        }
    }
});
