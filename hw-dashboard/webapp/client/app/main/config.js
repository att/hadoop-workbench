import { createStore, applyMiddleware, compose } from 'redux';
import async from './middleware/async-action'
import thunk from 'redux-thunk'
import rootReducer from './reducers/index';
import ngModule from './ngModule';

ngModule.config(configure);
ngModule.config(($ngReduxProvider) => {
    $ngReduxProvider.createStoreWith(rootReducer, [thunk, async]);
}).run(['$ngRedux', ($ngRedux)=> {
    window.$ngRedux = $ngRedux;
}]);

configure.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];
function configure($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider.when("/", "/dashboard").otherwise(function () {
        return '/dashboard';
    });

    $stateProvider
        .state('app', {
            url: '/',
            templateUrl: '/app/main/views/index.html',
            controller: 'dap.main.indexController',
            resolve: {
                currentUser: resolveCurrentUser
            }
        });

    $locationProvider
        .html5Mode(false)
        .hashPrefix('');

    resolveCurrentUser.$inject = ['$q', 'auth.authService', '$rootScope'];
    function resolveCurrentUser($q, authService, $rootScope) {
        var deferred = $q.defer();
        if (angular.isDefined($rootScope.currentUser)) {
            deferred.resolve($rootScope.currentUser);
        } else {
            authService.getUser().then(function (user) {
                $rootScope.currentUser = user;
                $rootScope.$emit('currentUser-changed', user);
                deferred.resolve(user);
            }, function (error) {
                deferred.resolve(null);
                $rootScope.currentUser = null;
            });
        }
        return deferred.promise;
    }
}
