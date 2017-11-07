/*jshint maxparams: 7*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('main.SearchProviderController', Controller);

    Controller.$inject = [
        '$scope',
        'main.alerts.alertsManagerService',
        'dashboard.WidgetsActions',
        'provision.restService',
        '$ngRedux',
        'provision.redux-actions',
    ];
    function Controller($scope, dashboardAlertsManager, WidgetsActions, provisionRestService, $ngRedux, provisionReduxActions) {

        ng.extend($scope, {
            searchStr: '',
            providers: [],
            providersFiltered: [],
            requesting: false
        });

        ng.extend($scope, {
            openProvider: function (provider) {
                if (!provider) {
                    return;
                }
                $scope.close();

                WidgetsActions.addWidget({
                    widgetName: 'provision-platform',
                    params: {
                        provider: provider
                    }
                }, {top: true});
            },
            close: function () {
                $scope.$emit('close.search-provider');
            },
            onKeyDown: function (event) {
                var escKeyCode = 27;
                if (event.keyCode === escKeyCode) {
                    $scope.close();
                }
            }
        });

        let lastStoredProviders;
        let unsubscribe = $ngRedux.connect(onStateChange)($scope);
        $scope.$on('$destroy', unsubscribe);

        $ngRedux.dispatch(provisionReduxActions.getPlatformProviderListing());

        function onStateChange(state) {
            if (lastStoredProviders === state.data.provision.providers) {
                return {};
            }
            lastStoredProviders = state.data.provision.providers;
            return {
                providers: retrieveProviders(state),
                requesting: state.data.provision.isUpdating
            };
        }

        $scope.$watch('providers', function (newValue) {
            filterList($scope.searchStr);
        });

        $scope.$watch('searchStr', filterList);

        function filterList(newVal) {
            let lowerCaseNewVal = newVal.toLowerCase();

            var result = $scope.providers.filter(function (provider) {
                return lowerCaseNewVal === "" || provider.title.toLowerCase().indexOf(lowerCaseNewVal) !== -1;
            });
            $scope.providersFiltered.splice(0);
            $scope.providersFiltered.push.apply($scope.providersFiltered, result);

        }

        function fetchProviders() {
            $scope.requesting = true;
            provisionRestService.getPlatformProviders().then(function (providersData) {
                $scope.providers = convertProvidersToFlatList(providersData);
            }).catch(function (error) {
                dashboardAlertsManager.addAlertError({
                    title: 'Search platform providers',
                    text: "Failed to get providers because of the error: " + error.message
                });
            }).finally(function () {
                $scope.requesting = false;
            });
        }

        function retrieveProviders(state) {
            return convertProvidersToFlatList(state.data.provision.providers);
        }

        /**
         * Convert tree structure into flat one
         * {
              "data": {
                "providers": [{
                  "name": "AWS",
                  "title": "AWS",
                  "distributions": [{
                    "name": "HDP",
                    "title": "Hortonworks",
                    "versions": ["2.4.0"]
                  }, {
                    "name": "KAFKA",
                    "title": "Kafka",
                    "versions": ["0.9.0.1"]
                  }, {
                    "name": "CASSANDRA",
                    "title": "Casandra",
                    "versions": ["3.0.1"]
                  }]
                }, {
                  "name": "K8S",
                  "title": "Kubernetes",
                  "distributions": [{
                    "name": "HDP",
                    "title": "Hortonworks",
                    "versions": ["2.4.0"]
                  }]
                }]
              }
            }
         * @param providers
         * @returns {Array}
         */
        function convertProvidersToFlatList(providers) {
            let providersFlat = [];
            providers.forEach((provider) => {
                provider.distributions.forEach((distribution) => {
                    distribution.versions.forEach((version) => {
                        providersFlat.push({
                            title: provider.title + ' ' + distribution.title + ' ' + version,
                            provider: provider.name,
                            distribution: distribution.name,
                            version
                        })
                    })
                })
            });
            return providersFlat;
        }
    }
});
