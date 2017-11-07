require('../ngModule').controller('main.SearchComponentController', Controller);
import {TYPE_CDH, TYPE_HDP} from '../../../../plugins/platform/constants/platform-types';
import {getCuidById} from '../../../../plugins/tenant/reducers/tenants';
let {keys, assign} = Object;

Controller.$inject = [
    '$scope',
    'userSettings.storage',
    "dashboard.WidgetsActions",
    '$ngRedux',
    'tenant.redux-actions',
    'platform.redux-actions'
];
function Controller($scope, storage, WidgetsActions, $ngRedux, tenantActions, platformActions) {

    let componentsFilteredVisibleLimit = 15;
    //let componentsFilteredVisibleStart = 0;
    let componentsFilteredVisibleStep = 4;
    let componentsFilteredNotLimited = [];

    assign($scope, {
        searchStr: '',
        componentsFiltered: [],
        components: [],
        isRequesting: false,
        limitComponentList: componentsFilteredVisibleLimit,
        availFilters: [
            {isActive: false, isTemplate: true, type: 'flume'},
            {isActive: false, isTemplate: true, type: 'oozie'},
            {isActive: false, isDeployedComponent: true, type: 'FLUME', platformType: TYPE_HDP},
            {isActive: false, isDeployedComponent: true, type: 'FLUME', platformType: TYPE_CDH},
            {isActive: false, isDeployedComponent: true, type: 'OOZIE', platformType: TYPE_HDP},
            {isActive: false, isDeployedComponent: true, type: 'OOZIE', platformType: TYPE_CDH}
        ],
        showSearchFilter: storage.get("showSearchFilter"),
        isSearchFilterStyleInline: storage.get("isSearchFilterStyleInline"),
        activeFilters: []
    });

    assign($scope, {
        openComponent: function (component) {
            if (!component) {
                return;
            }

            if (component.tenant) {
                return $scope.openTenantComponent(component);
            }

            WidgetsActions.addWidget({
                widgetName: component.type.toLowerCase(),
                params: {
                    source: component
                }
            }, {top: true});

            $scope.close();
        },
        openTenantComponent: function (template) {
            if (!template) {
                return;
            }

            if (template.info.type === 'flume') {
                WidgetsActions.addWidget({
                    widgetName: 'tenant-flume-template',
                    params: {
                        componentDescriptor: template
                    }
                }, {top: true});
            } else if (template.info.type === 'oozie') {
                WidgetsActions.addWidget({
                    widgetName: 'tenant-workflow-template',
                    params: {
                        componentDescriptor: template
                    }
                }, {top: true});
            }

            $scope.close();
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
            }, {top: true});

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
        }
    });

    let lastSavedTemplates, lastSavedTenants, lastSavedModules;

    let unsubscribe = $ngRedux.connect(retrieveComponentsFromStore)($scope);

    $scope.$on('$destroy', unsubscribe);
    $scope.$watch('components', function (newVal) {
        filterList($scope.searchStr);
    });
    $scope.$watch('searchStr', filterList);

    $scope.$watch('activeFilters', function () {
        filterList($scope.searchStr);
    });

    init();

    function init() {
        $ngRedux.dispatch(tenantActions.getComponentsListing());
        $ngRedux.dispatch(platformActions.getModulesListing());
    }

    function retrieveComponentsFromStore(state) {
        let modules = state.data.platform.modules;
        let templates = state.data.tenant.templates;
        let tenants = state.data.tenant.tenants;
        let status = state.ui.menu.searchStatus;

        let result = {
            requesting: status.getIn(['requesting', 'component', 'tenants']) || status.getIn(['requesting', 'component', 'platforms'])
        };

        if (!(lastSavedTemplates === templates && lastSavedTenants === tenants && lastSavedModules === modules)) {
            lastSavedModules = modules;
            lastSavedTemplates = templates;
            lastSavedTenants = tenants;
            result.components = retrieveTemplates(state).concat(retrieveModules(state));
        }

        return result;
    }

    function retrieveModules(state) {
        let modules = state.data.platform.modules;

        return keys(modules).map(function (moduleId) {
            let moduleItem = assign({}, modules[moduleId]);
            let str2Check = [
                moduleItem.type,
                moduleItem.module.title || moduleItem.module.id,
                moduleItem.renderedName,
                moduleItem.agentName,
                moduleItem.platform.title,
                moduleItem.cluster.title,
                moduleItem.service.title
            ];
            if (moduleItem.path) {
                str2Check.push(moduleItem.path);
            }
            moduleItem.str2Check = str2Check;
            moduleItem.isDeployedComponent = true;
            return moduleItem;
        });
    }

    function retrieveTemplates(state) {
        let templates = state.data.tenant.templates;
        let tenants = state.data.tenant.tenants;

        return keys(templates).map(function (templateId) {
            let template = assign({}, templates[templateId]);
            let tenant = tenants[getCuidById(template.info.tenantId)];
            let str2Check = [
                template.workflowVersion,
                template.info.name,
                template.info.description,
                template.info.displayType,
                template.info.type,
                'template',
                'tenant'
            ];
            if (tenant && tenant.info) {
                str2Check.push(tenant.info.name);
                str2Check.push(tenant.info.version);
            }
            template.str2Check = str2Check;
            template.isTemplate = true;
            return template;
        });
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
        if (activeFilters.length > 0 ) {
            var propertyFilterFunction = propertyFilterFunctionFactory(activeFilters);
            filterFunctionComposition = function (c) {
                return propertyFilterFunction(c) && filterFunction(c);
            }
        } else {
            filterFunctionComposition = function (c) {
                return filterFunction(c);
            }
        }

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
}
