define(function (require) {
    "use strict";

    require('../ngModule').controller('appController', [
        '$rootScope',
        '$scope',
        '$state',
        '$location',
        '$timeout',
        'auth.AUTH_EVENTS',
        'STATES',
        'core.credits',
        'core.settings',
        function ($rootScope, $scope, $state, $location, $timeout, AUTH_EVENTS, STATES, credits, settings) {
            $rootScope.setCurrentUser = setCurrentUser;

            $rootScope.menuItems = [];
            $scope.menuItemsToRender = [];

            $rootScope.settings = {};

            $scope.isUserLoaded = false;
            $scope.isMenuLoaded = false;
            $scope.isMenuAndUserChanged = 0;

            $rootScope.$on('$stateChangeError', onStateChangeError);
            $rootScope.$on(AUTH_EVENTS.loginSuccess, onLoginSuccessEvent);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, onLogoutSuccessEvent);
            $rootScope.$on(AUTH_EVENTS.notAuthenticated, onNotAuth);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, onNotAuth);

            credits.getCredits().then(setCredits);

            $rootScope.$watch('currentUser', function (currentUser) {
                if (currentUser && currentUser.login) {
                    $scope.isUserLoaded = true;
                } else {
                    $scope.isUserLoaded = false;
                }
                $scope.isMenuAndUserChanged++;
            });
            $rootScope.$watch('menuItems', function (menuItems) {
                if (menuItems && menuItems.length) {
                    $scope.isMenuLoaded = true;
                } else {
                    $scope.isMenuLoaded = false;
                }
                $scope.isMenuAndUserChanged++;
            });
            $scope.$watch('isMenuAndUserChanged', function() {
                if ($scope.isMenuLoaded && $scope.isUserLoaded) {
                    settings.getSettings().then(setSettings);
                } else if (!$scope.isUserLoaded) {
                    $scope.menuItemsToRender = [];
                }
            });

            function setCredits(credits) {
                $rootScope.credits = credits;
            }

            function setSettings(settings) {
                settings = settings.data;
                $rootScope.settings = settings;

                var isSettingsMenuDisabledEmpty =
                    !(
                        !angular.equals({}, settings) &&
                        settings.menu &&
                        settings.menu.disabled &&
                        settings.menu.disabled.length
                    );

                if (!isSettingsMenuDisabledEmpty) {
                    $rootScope.menuItems.forEach(function(item) {
                        if (settings.menu.disabled.indexOf(item.id) == -1) {
                            $scope.menuItemsToRender.push(item);
                        }
                    });
                } else {
                    $scope.menuItemsToRender = $rootScope.menuItems;
                }

            }

            function setCurrentUser(user) {
                $rootScope.currentUser = user;
            }

            function onStateChangeError(event, toState, toParams, fromState, fromParams, error) {
                if (error && error.reason === 'unauthorised') {
                    if (!$state.is(STATES.authLogin)) {
                        event.preventDefault();
                        $state.go(STATES.authLogin, {
                            r: $location.url()
                        });
                    }
                    return;
                }

                var defaultErrorState = 'moduleResolveError';
                var redirectOnErrorState = toState.redirectOnErrorState || defaultErrorState;
                var toStateName = toState.name || '';
                var toStateUrl = toState.url;
                var defaultErrorDescription = 'state "' + toStateName + '" failed to resolve to URL "' + toStateUrl + '" because of the error "' + (error ? error.description : 'UNKNOWN') + '"';

                $rootScope.resolveErrorDescription = defaultErrorDescription;
                $state.go(redirectOnErrorState);
            }

            function onLoginSuccessEvent(event, data) {
                if (data && data.redirect) {
                    $location.url(data.redirect);
                } else {
                    if ($state.is(STATES.authLogin)) {
                        $state.go(STATES.dashboard);
                    }
                }
            }

            function onLogoutSuccessEvent(event, data) {
                $rootScope.setCurrentUser(null);
                $state.reload();
            }

            function onNotAuth() {
                $rootScope.setCurrentUser(null);
                $timeout(function () {
                    if (!$state.is(STATES.authLogin)) {
                        $state.go(STATES.authLogin, {
                            r: $location.url()
                        });
                    }
                });
            }
        }]);
});
