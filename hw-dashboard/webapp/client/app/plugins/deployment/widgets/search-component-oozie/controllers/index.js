require('../ngModule').controller('deployment.SearchComponentOozieController', Controller);
import {TYPE_CDH, TYPE_HDP} from '../../../../platform/constants/platform-types';
import {JOB_TYPE_COORDINATOR, JOB_TYPE_WORKFLOW} from '../../../../oozie/constants/job-types';
// import {getCuidById} from '../../../../tenant/reducers/tenants';
import {getCompositeId} from '../../../../oozie/reducers/oozieDeployedComponents'
let {keys, assign} = Object;

Controller.$inject = [
    '$scope',
    '$widgetParams',
    'dap.core.config',
    'userSettings.storage',
    'dashboard-isolated-widget-accessor.WidgetStore',
    "dashboard.WidgetsActions",
    'dashboard.searchService',
    'uiSettings.storage',
    'main.alerts.alertsManagerService',
    '$ngRedux',
    'oozie.redux-actions',
    'oozie.job-rest-service',
    'tenant.restService',
    '$q',
    '$interval',
];
function Controller($scope, $widgetParams, dapConfig, storage, WidgetStore, WidgetsActions, searchService, uiSettingsStorage, alertsManagerService, $ngRedux, oozieActions, oozieJobRestService, tenantRestServise, $q, $interval) {

    let showPromotionButtons = uiSettingsStorage.get('deploymentManagerShowPromoteButtons', true);

    let componentsFilteredVisibleLimit = 9;
    //let componentsFilteredVisibleStart = 0;
    let componentsFilteredVisibleStep = 4;
    let componentsFilteredNotLimited = [];

    var $dashboardWidget = WidgetStore.getWidget();

    let statusTimer = false;
    let {clusterId, platformId, clusterTypes = {}} = $widgetParams;

        assign($scope, {
            showPromotionButtons: showPromotionButtons,
        options: {
            columns: ['icon', 'name', 'version', 'appPath', 'type'],
            tplPath: dapConfig.pathToPlugins + "/deployment/widgets/search-component-oozie/views/"
        },
        searchStr: '',
        componentsFiltered: [],
        componentsStatus: {},
        components: [],
        // clusters: [],
        // clusterTypes: {},
        // sources: [],
        isRequesting: false,
        showPreloader: false,
        limitComponentList: componentsFilteredVisibleLimit,
        availFilters: [
            // {isActive: false, isTemplate: true, type: 'flume'},
            {isActive: false, isTemplate: true, type: 'oozie'},
            // {isActive: false, isDeployedComponent: true, type: 'FLUME', platformType: TYPE_HDP},
            // {isActive: false, isDeployedComponent: true, type: 'FLUME', platformType: TYPE_CDH},
            {isActive: false, isDeployedComponent: true, type: 'OOZIE', platformType: TYPE_HDP},
            {isActive: false, isDeployedComponent: true, type: 'OOZIE', platformType: TYPE_CDH}
        ],
        showSearchFilter: storage.get("showSearchFilter"),
        isSearchFilterStyleInline: storage.get("isSearchFilterStyleInline"),
        activeFilters: [],
        componentStatusParallelRequestsCount: 0,
        initStatusesQueue: []
    });

    assign($scope, {
        openComponent: function (component) {
            if (!component) {
                return;
            }

            WidgetsActions.addWidget({
                widgetName: 'oozie',
                params: {
                    source: convertComponentToSource(component)
                }
            }, {top: true});

            $scope.close();
        },
        openTenantComponent: function (component) {
            if (!component) {
                return;
            }

            let template = {
                info: component.component
            };

            WidgetsActions.addWidget({
                widgetName: "tenant-workflow-template",
                params: {
                    componentDescriptor: template
                }
            }, {before: $dashboardWidget});

            $scope.close();
        },
        deploy: function (component) {

            let componentDescriptor = convertComponent2ComponentDescriptor(component);
            WidgetsActions.addWidget({
                widgetName: "tenant-component-deployment",
                params: {
                    componentDescriptor: componentDescriptor,
                    deploymentDescriptor: Object.assign(
                        {
                            useSpaces: true,
                            // @TODO: implement cluster select on dropdown
                            // component
                            // platformId: null,
                            // clusterId: null,

                            parentWidget: {
                                widgetName: 'deployment-manager',
                                params: {}
                            }
                        },
                    )

                }
            }, {replace: $dashboardWidget});

        },
        deployToProduction: function (component) {
            alertsManagerService.addAlertInfo({
                type: "confirm",
                title: 'Confirmation',
                text: 'Are you sure you want to promote component "' + component.name + '" to production?',
                buttons: [
                    {
                        text: "Yes",
                        style: "action",
                        action: function (close) {
                            close();
                            $scope.showPreloader = true;
                            tenantRestServise.promoteToProduction(component.component.id).then(
                                () => {
                                    alertsManagerService.addAlertSuccess({
                                        title: 'Promotion succeed',
                                        text: 'Promotion to production scheduled'
                                    });

                                    $scope.showPreloader = false;
                                },(error) => {
                                    alertsManagerService.addAlertError({
                                        title: 'Promotion failed',
                                        text: 'Promotion to production failed with error: ' + error.message
                                    });

                                    $scope.showPreloader = false;
                                }
                            );
                        }
                    },
                    {
                        text: "No",
                        style: "cancel",
                        action: function (close) {
                            close();
                        }
                    }]
            });
        },
        startCoordinator: function (component) {

            component.isCoordinatorStarting = true;
            oozieJobRestService.postJob(convertComponentToSource(component), JOB_TYPE_COORDINATOR).then((job) => {

                alertsManagerService.addAlertSuccess({
                    title: 'Coordinator Job started',
                    text: "Coordinator Job started on component: " + component.path
                });
            }).catch((err) => {
            }).finally(() => {
                component.isCoordinatorStarting = false;
            });
        },
        stopCoordinator: function (component) {
            component.isCoordinatorStopping = true;

            oozieJobRestService.killAllJob(convertComponentToSource(component), JOB_TYPE_COORDINATOR).then((job) => {

                // $scope.newJobCreatedIds.push(job.id);
                alertsManagerService.addAlertSuccess({
                    title: 'Coordinator Job stopped',
                    text: "Coordinator Job stopped on component: " + component.path
                });
            }).catch((err) => {
            }).finally(() => {
                component.isCoordinatorStopping = false;
            });
        },

        startWorkflow: function (component) {
            component.isWorkflowStarting = true;

            oozieJobRestService.postJob(convertComponentToSource(component), JOB_TYPE_WORKFLOW).then((job) => {
                alertsManagerService.addAlertSuccess({
                    title: 'Workflow Job started',
                    text: "Workflow Job started on component: " + component.path
                });
            }).catch((err) => {
            }).finally(() => {
                component.isWorkflowStarting = false;
            });
        },
        stopWorkflow: function (component) {
            component.isWorkflowStopping = true;

            oozieJobRestService.killAllJob(convertComponentToSource(component), JOB_TYPE_WORKFLOW).then((job) => {

                // $scope.newJobCreatedIds.push(job.id);
                alertsManagerService.addAlertSuccess({
                    title: 'Workflow Job stopped',
                    text: "Workflow Job stopped on component: " + component.path
                });
            }).catch((err) => {
            }).finally(() => {
                component.isWorkflowStopping = false;
            });
        },
        toggleFilter: function (filter) {
            filter.isActive = !filter.isActive;
            $scope.activeFilters = $scope.availFilters.filter(function (f) {
                return f.isActive;
            })
        },

        createNewComponent: function () {
            WidgetsActions.addWidget({
                widgetName: 'create-tenant-component',
                params: {
                    sharedData: {
                        'componentName': $scope.searchStr
                    }
                }
            }, {replace: $dashboardWidget});

            $scope.close();
        },
        close: function () {
            $scope.$emit('close.search-component');
        },
        onKeyDown: function (event) {
            var escKeyCode = 27;
            if (event.keyCode === escKeyCode) {
                $scope.close();
            }
        },
        loadMoreFilteredComponents: function () {
            $scope.limitComponentList += componentsFilteredVisibleStep;
        },
        inView: function(index, inview, inviewpart, component, isLastCheckedItem) {
            component.inview = inview;
        }
    });

    let lastSavedDeployment;

    let unsubscribe = $ngRedux.connect(retrieveComponentsFromStore)($scope);

    $scope.$on('$destroy', unsubscribe);
    $scope.$watch('components', function (newVal) {
        filterList($scope.searchStr);
        initStatuses($scope.componentsFiltered, $scope.componentsStatus);
    });
    $scope.$watch('searchStr', filterList);

    $scope.$watch('activeFilters', function () {
        filterList($scope.searchStr);
    });

    $scope.$on('$destroy', function() {
        removeTimers();
    });
    init();

    function init() {
/*
        fetchClusters().then(function () {
            $scope.sources.forEach((source) =>
                $ngRedux.dispatch(oozieActions.getDeployedComponents(source)));
        });
*/

        initTimers();
    }

    function retrieveComponentsFromStore(state) {
        let deployment = state.data.deployment;
        let status = state.ui.menu.searchStatus;

        let result = {
            requesting: status.getIn(['requesting', /*'component', 'tenants', */'deployment']) /*|| status.getIn(['requesting', 'component', 'platforms'])*/
        };

        if (!(lastSavedDeployment === deployment)) {
            /*
             // example ComponentItem
             {
             clusterId : "lab7",
             component : {
             id : 553,
             name : "event-enrichment-wf",
             tenantId : 1,
             version : "0.0.1-SNAPSHOT"
             },
             name : "event-enrichment-wf",
             path : "/user/vv/event",
             platformId : 7,
             renderedName : "event-enrichment-wf",
             version : "0.0.1-SNAPSHOT"
             }
             */
            result.components = retrieveDeployment(state);
        }

        return result;
    }

    function initTimers() {
        statusTimer = $interval(() => {
            initStatuses($scope.componentsFiltered, $scope.componentsStatus);
        }, 2000, 1000);
    }

    function removeTimers() {
        if (statusTimer) {
            $interval.cancel(statusTimer);
        }
    }

    function retrieveDeployment(state) {
        let deployment = state.data.deployment;
        return Object.keys(deployment.componentClusters).reduce((flatComponents, componentClusterId) => {

            let {components = [], idObject} = deployment.componentClusters[componentClusterId];
            if (idObject.clusterId === clusterId && idObject.platformId === platformId) {
                let filteredComponents = components.filter(({component}) => {
                    return component !== undefined;
                });

                let type = clusterTypes[getCompositeId(idObject)];
                filteredComponents.forEach(component => {
                    component.compositeId = makeComponentCompositeId(component);
                    component.type = type;
                    let {name, version, path} = component;
                    component.str2Check = [
                        type,
                        name,
                        version,
                        path
                    ];
                });
                flatComponents.push(...filteredComponents);
            }
            return flatComponents;
        }, []);
    }

    function filterList(searchString) {
        /*
         var filteredArray = $filter('filter')($scope.components, {path2Display: searchString});
         */
        componentsFilteredNotLimited = filterComponents($scope.components, searchString, $scope.activeFilters);

        /*
         * Save pointer to the existing array!
         */
        $scope.componentsFiltered.splice(0);
        $scope.componentsFiltered.push.apply(
            $scope.componentsFiltered,
            componentsFilteredNotLimited);
    }

    function filterComponents(components, searchString, activeFilters) {
        var queries = searchString.split(/\s+|\//).reduce(function (result, query) {
            if (query && result.indexOf(query) === -1) {
                result.push(query);
            }
            return result;
        }, []);

        var filterFunction = function (c) {
            return checkIfMatchQueries(c.str2Check, queries);
        };

        var filterFunctionComposition;
        // if (activeFilters.length > 0 ) {
        //     var propertyFilterFunction = propertyFilterFunctionFactory(activeFilters);
        //     filterFunctionComposition = function (c) {
        //         return propertyFilterFunction(c) && filterFunction(c);
        //     };
        // } else {
        filterFunctionComposition = function (c) {
            return filterFunction(c);
        };
        // }

        return components.filter(filterFunctionComposition);
    }

    function propertyFilterFunctionFactory(activeFilters) {
        return function (itemToFilter) {
            return activeFilters.some(function (filterRule) {
                if (!itemToFilter) {
                    return false;
                }
                if (filterRule.isTemplate) {
                    return itemToFilter.isTemplate == true &&
                        itemToFilter.info && itemToFilter.info.type === filterRule.type;
                } else if (filterRule.isDeployedComponent) {
                    return itemToFilter.isDeployedComponent == true &&
                        itemToFilter.type === filterRule.type &&
                        itemToFilter.platform && itemToFilter.platform.type === filterRule.platformType;
                }
            });
        }
    }

    function checkIfMatchQueries(str2Check, queries) {
        return queries.length > 0 ?
            queries.every(function (q) {
                return str2Check.some(function (str) {
                    return (str || '').search(new RegExp(q, 'i')) > -1;
                });
            }) :
            true;
    }

    function initStatuses(components, componentsStatus) {
        if ($scope.initStatusesQueue.length !== 0) {
            return;
        }

        let queue = $scope.initStatusesQueue;
        queue.push (...components.filter((component) => component.inview));

        while (queue.length !== 0 && $scope.componentStatusParallelRequestsCount < 4) {
            getComponentStatus(queue, componentsStatus);
        }
    }

    function getComponentStatus(queue, componentsStatus) {
        if ((queue.length === 0 || $scope.componentStatusParallelRequestsCount >= 4)) {
            return;
        }

        ++$scope.componentStatusParallelRequestsCount;

        let component = queue.shift();
        let componentCompositeId = component.compositeId;
        if (componentsStatus[componentCompositeId] === undefined) {
            componentsStatus[componentCompositeId] = {
                isRequesting: false,
                runningWorkflow: 0,
                runningCoordinator: 0,
            };
        }

        if (componentsStatus[componentCompositeId].isRequesting !== true) {
            componentsStatus[componentCompositeId].isRequesting = true;
            getComponentStatusAsync(component).then((statusObject) => {
                --$scope.componentStatusParallelRequestsCount;
                componentsStatus[componentCompositeId] = statusObject;
                getComponentStatus(queue, componentsStatus);
            })
        }
    }

    function getComponentStatusAsync(component) {
        var deferred = $q.defer();

        let source = convertComponentToSource(component);

        oozieJobRestService.silent().getJobsStatistics(source)
            .then(({
                workflow: {running: runningWorkflow = 0} = {},
                coordinator: { running: runningCoordinator = 0} = {}
            } = {}) =>
                deferred.resolve({runningWorkflow, runningCoordinator, isRequesting: false})
            ).catch(error =>
                deferred.resolve({runningWorkflow: 0, runningCoordinator: 0, isRequesting: false}));
        return deferred.promise;
    }

    function makeComponentCompositeId({clusterId = '', platformId = '', path = ''}) {
        return 'cmp' + clusterId + '_' + platformId + '_' + path;
    }

    function convertComponent2ComponentDescriptor(component = {}) {
        let {component: info = {}} = component;
        info.type = 'oozie';
        return {
            info,
            properties : {},
            tenant: {}
        }
    }

    function convertComponentToSource({clusterId = '', platformId = '', path = '', serviceId = 'HDFS'}) {
        return {
            platform: { id: platformId },
            cluster: { id: clusterId },
            module: { id: path },
            service: { id: serviceId } // @TODO: add serviceId into server response
        };
    }
}
