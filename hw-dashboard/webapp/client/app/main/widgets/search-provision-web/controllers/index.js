/*jshint maxparams: 7*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('main.SearchProvisionWebController', Controller);

    Controller.$inject = [
        '$scope',
        '$ngRedux',
        'provision.redux-actions',
        '$window',
    ];
    function Controller($scope, $ngRedux, provisionReduxActions, $window) {

        ng.extend($scope, {
            searchStr: '',
            provisionWebs: [],
            provisionWebsFiltered: [],
            requesting: false
        });

        ng.extend($scope, {
            openProvisionWeb: function (provisionWeb) {
                if (!provisionWeb) {
                    return;
                }
                $scope.close();
                $window.open(provisionWeb.url);
            },
            close: function () {
                $scope.$emit('close.search-provision-web');
            },
            onKeyDown: function (event) {
                var escKeyCode = 27;
                if (event.keyCode === escKeyCode) {
                    $scope.close();
                }
            }
        });

        let lastStoredProvisionWebs;
        let unsubscribe = $ngRedux.connect(onStateChange)($scope);
        $scope.$on('$destroy', unsubscribe);

        $ngRedux.dispatch(provisionReduxActions.getPlatformProvisionWebListing());

        function onStateChange(state) {
            if (lastStoredProvisionWebs === state.data.provision.provisionWebs) {
                return {};
            }
            lastStoredProvisionWebs = state.data.provision.provisionWebs;
            return {
                provisionWebs: retrieveProvisionWebs(state),
                requesting: state.data.provision.isUpdatingProvisionWeb
            };
        }

        $scope.$watch('provisionWebs', function (newValue) {
            filterList($scope.searchStr);
        });

        $scope.$watch('searchStr', filterList);

        function filterList(newVal) {
            let lowerCaseNewVal = newVal.toLowerCase();

            var result = $scope.provisionWebs.filter(function (provisionWeb) {
                return lowerCaseNewVal === "" || provisionWeb.title.toLowerCase().indexOf(lowerCaseNewVal) !== -1;
            });
            $scope.provisionWebsFiltered.splice(0);
            $scope.provisionWebsFiltered.push.apply($scope.provisionWebsFiltered, result);

        }

        function retrieveProvisionWebs(state) {
            return state.data.provision.provisionWebs;
        }

    }
});
