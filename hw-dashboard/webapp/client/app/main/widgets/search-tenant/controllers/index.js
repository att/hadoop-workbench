define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('main.SearchTenantController', Controller);

    Controller.$inject = [
        '$scope',
        '$filter',
        'dashboard.searchService',
        'core.utils.string-format',
        "dashboard.WidgetsActions",
        'main.alerts.alertsManagerService'
    ];
    function Controller($scope, $filter, searchService, stringFormat, WidgetsActions, alertsManagerService) {
        ng.extend($scope, {
            searchStr: '',
            tenantsFiltered: [],
            components: [],
            requesting: false
        });

        ng.extend($scope, {
            openComponent: function (component) {
                if (!component) {
                    return;
                }
                if (!component.info) {
                    WidgetsActions.addWidget({
                        widgetName: 'tenant-browser',
                        params: {
                            tenantCuid: component.$cuid,
                            tenantId: component.id,
                            tenant: component
                        }
                    }, {top: true});
                } else if (component.info.type === 'flume') {
                    WidgetsActions.addWidget({
                        widgetName: 'tenant-flume-template',
                        params: {
                            componentDescriptor: component
                        }
                    }, {top: true});
                } else if (component.info.type === 'oozie') {
                    WidgetsActions.addWidget({
                        widgetName: 'tenant-workflow-template',
                        params: {
                            componentDescriptor: component
                        }
                    }, {top: true});
                }
                $scope.close();
            },
            createNewTenant: function () {
                WidgetsActions.addWidget({
                    widgetName: 'create-tenant',
                    params: {
                        tenantName: $scope.searchStr
                    }
                }, {top: true});

                $scope.close();
            },
            close: function () {
                $scope.$emit('close.search-tenant');
            },
            onKeyDown: function (event) {
                var escKeyCode = 27;
                if (event.keyCode === escKeyCode) {
                    $scope.close();
                }
            }
        });

        $scope.$watch('components', function (newVal) {
            filterList($scope.searchStr);
        });
        $scope.$watch('searchStr', filterList);

        fetchComponents();

        function filterList(newVal) {
            var filteredArray = $filter('filter')($scope.components, {path2Display: newVal});
            $scope.tenantsFiltered.splice(0);
            $scope.tenantsFiltered.push.apply($scope.tenantsFiltered, filteredArray);
        }

        function fetchComponents() {
            $scope.requesting = true;
            searchService.getTenantsListing().then(function (tenants) {
                return tenants.map(function (tenant) {
                    tenant.path2Display = stringFormat('{0}', tenant.name);
                    return tenant;
                });
            }).then(function (components) {
                $scope.components = components;
            }).catch(function (error) {
                alertsManagerService.addAlertError({
                    title: 'Search tenants',
                    text: "Failed to get tenants because of the error: " + error.message
                });
            }).finally(function () {
                $scope.requesting = false;
                $scope.components.sort(function (a, b) {
                    if (!a.info || !b.info) {
                        return !a.info ? -1 : 1;
                    }
                    return a.info.type > b.info.type;
                });
            });
        }
    }
});
