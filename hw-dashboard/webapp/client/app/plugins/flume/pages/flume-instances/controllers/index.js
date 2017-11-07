/*jshint maxparams:8*/
define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').controller('flume.pages.FlumeInstancesController', indexController);

    indexController.$inject = [
        '$scope',
        'main.alerts.alertsManagerService',
        'dashboard.models.TabPage',
        'flume.restService',
        'loadedAgent',
        'dashboard-isolated-widget-accessor.WidgetStore',
        '$timeout',
        '$widgetParams'
    ];
    function indexController($scope, alertsManager, TabPage, restService, agentContainer, WidgetStore, $timeout, $widgetParams) {
        var $dashboardWidget = WidgetStore.getWidget();
        var source = $dashboardWidget.params.source;

        function increaseLoadersCounter() {
            $scope.loadersCounter += 1;
        }

        function decreaseLoadersCounter() {
            if ($scope.loadersCounter > 0) {
                $scope.loadersCounter -= 1;
            }
        }

        //scope properties
        ng.extend($scope, {
            instances: [],
            availableHosts: [],
            loadersCounter: 0,
            addHostFieldVisible: false,
            isAutoRefresh: true,
            refreshInterval: 5000,
            selectedInstance: null,
            states: {
                STARTED: 'STARTED',
                BUSY: 'BUSY',
                STOPPED: 'STOPPED',
                UNKNOWN: 'UNKNOWN'
            },
            expandedInstances: {},//key - instance ID, value - boolean (true for expanded)
            page: $widgetParams.page
        });
        $scope.addedHost = createAddedHost(0);

        //scope methods
        ng.extend($scope, {
            hide: function () {
                $scope.$emit('hide.left-tab-panel');
            },
            selectInstance: function (instance, openPipeline) {
                if (!instance) {
                    $scope.selectedInstance = null;
                    return;
                }
                $scope.selectedInstance = instance;
                if (openPipeline) {
                    /**
                     * Temporary disabled
                     */
//                    $scope.openPipeline(instance);
                }
            },
            openPipeline: function (instance) {
                //open a tab with the pipeline in the read only mode
                //create new Page for this purpose
                var pageName = 'flume.pages.instance-page';
                var page = TabPage.factory({
                    name: pageName,
                    params: {
                        file: {
                            path: 'conf/flume.properties'
                        },
                        instanceId: instance.id,
                        source: $dashboardWidget.params.source
                    }
                });
                var existedTab = $dashboardWidget.tabManager.getTabs().filter(function (tab) {
                    return tab.page.name === pageName && tab.page.params.instanceId === instance.id;
                })[0];
                var index;
                if (existedTab) {
                    index = $dashboardWidget.tabManager.getTabs().indexOf(existedTab);
                } else {
                    index = $dashboardWidget.tabManager.addTab(page, instance.host.hostname);
                }
                if (index > -1) {
                    $dashboardWidget.tabManager.setActive(index);
                }
            },
            refreshServiceInstances: function () {
                if ($scope.refreshIntervalTimeout) {
                    $timeout.cancel($scope.refreshIntervalTimeout);
                    $scope.refreshIntervalTimeout = null;
                }
                increaseLoadersCounter();
                restService.refreshInstancesAndAvailableHosts(source).then(function (response) {
                    $scope.instances = response.instances;
                    $scope.availableHosts = response.availableHosts;
                }).finally(function () {
                    decreaseLoadersCounter();
                    autoRefreshData();
                });
            },
            toggleAddHostField: function () {
                if ($scope.availableHosts.length === 0) {
                    return;
                }
                $scope.addHostFieldVisible = !$scope.addHostFieldVisible;
                $scope.addedHost = createAddedHost(0);
            },
            confirmAddHost: function (host) {
                alertsManager.addAlertWarning({
                    title: "Create flume instance",
                    text: "You are about to create flume instance. All files in directory '" +
                    agentContainer.pluginDir + "' will be removed and plugin files will be deployed instead.",
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                addHost(host);
                            }
                        },
                        {
                            text: "No",
                            style: "cancel",
                            action: function (close) {
                                close();
                            }
                        }
                    ]
                });

                function addHost(host) {
                    var data = {hostId: host.data.id};
                    increaseLoadersCounter();
                    $scope.addHostFieldVisible = false;
                    restService.createInstance(source, data)
                        .finally(function () {
                            decreaseLoadersCounter();
                            $scope.refreshServiceInstances();
                        });
                }
            },
            removeInstance: function (instance) {
                alertsManager.addAlertWarning({
                    title: instance.host.hostname,
                    text: "Do you really want to delete \"" + instance.host.hostname + "\" ?",
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                remove();
                            }
                        },
                        {
                            text: "No",
                            style: "cancel",
                            action: function (close) {
                                close();
                            }
                        }
                    ]
                });

                function remove() {
                    increaseLoadersCounter();
                    restService.removeInstance(source, instance.id)
                        .then(function () {
                            alertsManager.addAlertSuccess({
                                title: $dashboardWidget.title || 'Success',
                                text: 'Instance "' + instance.host.hostname + '" has been successfully deleted.'
                            });
                        })
                        .finally(function () {
                            decreaseLoadersCounter();
                            $scope.refreshServiceInstances();
                        });
                }
            },
            toggleShowErrorsForInstance: function (event, instance) {
                event.stopPropagation();
                $scope.expandedInstances[instance.id] = instance.errors.length > 0 ?
                    !$scope.expandedInstances[instance.id] :
                    false;
            },
            startInstance: function (instance) {
                if (!instance || instance.state === $scope.states.STARTED) {
                    return;
                }
                $scope.runInstanceAction(instance, 'start');
            },
            stopInstance: function (instance) {
                if (!instance || instance.state === $scope.states.STOPPED) {
                    return;
                }
                $scope.runInstanceAction(instance, 'stop');
            },
            runInstanceAction: function (instance, action) {
                increaseLoadersCounter();
                restService.runInstanceAction(source, instance.id, action)
                    .finally(function () {
                        decreaseLoadersCounter();
                        $scope.refreshServiceInstances();
                    });
            }
        });

        $scope.selectInstance($scope.instances[0]);

        $scope.$watchCollection('instances', function (newCollection) {
            if ($scope.selectedInstance) {
                $scope.selectedInstance = newCollection.filter(function (inst) {
                        return inst.id === $scope.selectedInstance.id;
                    })[0] || null;
            }
            $scope.expandedInstances = newCollection.reduce(function (obj, instance) {
                obj[instance.id] = instance.errors.length > 0 ? !!$scope.expandedInstances[instance.id] : false;
                return obj;
            }, {});
        });
        $scope.$watch('isAutoRefresh', function (newValue, oldValue) {
            if (newValue !== oldValue && newValue) {
                autoRefreshData();
            }
        });
        $scope.$watch('page.isActive', function (newVal, oldVal) {
            if (newVal && oldVal !== newVal) {
                init();
            }
        });
        $scope.$on('$destroy', function () {
            $scope.isAutoRefresh = false;
        });

        init();

        function init() {
            increaseLoadersCounter();
            loadInstances()
                .finally(function () {
                    decreaseLoadersCounter();
                });
        }

        function createAddedHost(index) {
            return {
                data: $scope.availableHosts && $scope.availableHosts[index]
            };
        }

        function autoRefreshData() {
            if ($scope.refreshIntervalTimeout) {
                $timeout.cancel($scope.refreshIntervalTimeout);
                $scope.refreshIntervalTimeout = null;
            }
            if ($scope.isAutoRefresh && $scope.page.isActive) {
                $scope.refreshIntervalTimeout = $timeout(function () {
                    if ($scope.isAutoRefresh && $scope.page.isActive) {
                        loadInstances();
                    }
                }, $scope.refreshInterval);
            }
        }

        function loadInstances() {
            return restService.fetchInstancesAndAvailableHosts(source).then(function (response) {
                $scope.instances = response.instances;
                $scope.availableHosts = response.availableHosts;
                $scope.error = null;
            }).catch(function (response) {
                $scope.error = {message: "Cannot refresh instances list: " + response.message};
            }).finally(function () {
                autoRefreshData();
            });
        }
    }
});
