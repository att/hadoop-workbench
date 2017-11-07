import {SELECT_MENU_ITEM, SET_MENU_SEARCH_QUERY, CLOSE_MENU} from '../constants/action-types'

require('../ngModule').controller('dap.main.indexController', indexController);
indexController.$inject = [
    '$rootScope',
    '$scope',
    'auth.authService',
    'auth.AUTH_EVENTS',
    'dashboard.WidgetsActions',
    '$ngRedux'
];
function indexController($rootScope, $scope, authService, AUTH_EVENTS, WidgetsActions, $ngRedux) {
    $scope.isLoginDropdownOpen = false;
    $scope.logOut = logOut;
    $scope.appSettingsRead = hasAppSettingsReadAccess($rootScope.currentUser);

    //----------------------------------------------------//
    //-------------------- redux -------------------------//
    //----------------------------------------------------//
    let closeMenu = ()=> $ngRedux.dispatch({type: CLOSE_MENU});

    let unsubscribe = $ngRedux.connect(state => ({
        menuItems: state.ui.menu.items,
        searchQuery: state.ui.menu.searchQuery,
        selectedItem: state.ui.menu.selectedItem
    }))($scope);
    $scope.$on('$destroy', unsubscribe);
    $rootScope.$on('currentUser-changed', function (event, newUser) {
        $scope.appSettingsRead = hasAppSettingsReadAccess(newUser);
    });

    $scope.selectMenuItem = item => {
        if (item.action === "addWidget") {
            WidgetsActions.addWidget(
                {
                    widgetName: item.dapWidget
                },
                {
                    top: true
                });

            console.log("creating widget directly");
            return;
        }
        $ngRedux.dispatch({
            type: SELECT_MENU_ITEM,
            item: item
        });
    };

    $rootScope.menuItems = $scope.menuItems;

    //----------------------------------------------------//
    //----------------- end of redux ---------------------//
    //----------------------------------------------------//


    $scope.loginDropdownClicked = function () {
        $scope.isLoginDropdownOpen = !$scope.isLoginDropdownOpen;
    };

    $scope.closeAllWidgets = function () {
        WidgetsActions.removeAllWidgets();
    };

    $scope.clickOutsideLoginDropdown = function () {
        $scope.isLoginDropdownOpen = false;
    };

    $scope.clickOutsideMenu = function () {
        closeMenu();
    };

    $scope.openUserSettingsWidget = function () {
        WidgetsActions.addWidget({
                widgetName: 'user-settings'
            },
            {
                top: true
            });
    };

    $scope.openConfigurationWidget = function () {
        WidgetsActions.addWidget({
                widgetName: 'configuration'
            },
            {
                top: true
            });
    };

    $scope.openContributorsWidget = function () {
        WidgetsActions.addWidget({
                widgetName: 'contributors'
            },
            {
                top: true
            });
    };

    $scope.$on('close.search-component', function (event) {
        closeMenu();
    });
    $scope.$on('close.search-tenant', function (event) {
        closeMenu();
    });
    $scope.$on('close.search-cluster', function (event) {
        closeMenu();
    });

    $scope.$on('close.search-provision-web', function (event) {
        closeMenu();
    });

    function logOut() {
        authService.logout().then(function () {
            $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess, null);
        });
    }
    
    function hasAppSettingsReadAccess(user) {
        if (user) {
            return user.features.indexOf('APP_SETTINGS_READ') !== -1;
        }

        return false;
    }
}
