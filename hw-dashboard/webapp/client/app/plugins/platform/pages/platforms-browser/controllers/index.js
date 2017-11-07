/*jshint maxparams: 13*/
import {TYPE_HDP, TYPE_CDH, TYPE_KAFKA, TYPE_CASSANDRA} from "../../../constants/platform-types";

define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('platform.pages.PlatformsBrowserPageController', Controller);

    Controller.$inject = [
        '$rootScope',
        '$scope',
        '$q',
        'main.alerts.alertsManagerService',
        'platform-manager-widget.Widget.PlatformsActions',
        'platform-manager-widget.Widget.PlatformsStore',
        'platform-manager-widget.Widget.ClustersActions',
        'platform-manager-widget.Widget.ClustersStore',
        'platformWriteAccess',
        'dashboard.models.PageControl',
        'dashboard.models.TabPage',
        'dashboard-isolated-widget-accessor.WidgetStore',
        'platform.widgetHelper',
        '$widgetParams',
        'platform.models.Platform',
        'platform.models.PlatformAccessInfo',
        '$timeout',
        'dashboard.models.TabPage.EVENTS',
        '$ngRedux',
        'provision.redux-actions',
    ];
    function Controller($rootScope, $scope, $q, alertsManager, PlatformsActions, PlatformsStore, ClustersActions, ClustersStore,
                        platformWriteAccess, PageControl, TabPage, WidgetStore, platformWidgetHelper, $widgetParams,
                        Platform, PlatformAccessInfo, $timeout, TabPageEvents, $ngRedux, provisionReduxActions) {

        var isListeningPlatformsStatus = false;

        ng.extend($scope, {
            platformTypes: PlatformsStore.getTypes(),
            platforms: PlatformsStore.getPlatforms(),
            selectedItem: PlatformsStore.getSelectedPlatform(),
            newPlatform: null,
            isAutoRefresh: true,
            refreshInterval: 5000,
            refreshIntervalTimeout: null,
            loading: false,
            pageErrorMessage: null,
            platformWriteAccess: platformWriteAccess,
            platformIcons: {
                [TYPE_CDH]: 'b-platforms-browser__icon-platform-cloudera',
                [TYPE_HDP]: 'b-platforms-browser__icon-platform-hdp',
                [TYPE_CASSANDRA]: 'b-platforms-browser__icon-platform-cassandra',
                [TYPE_KAFKA]: 'b-platforms-browser__icon-platform-kafka',
            },
        });

        ng.extend($scope, {
            selectPlatform: function (platform) {
                PlatformsActions.selectPlatform(platform);
            },

            showPlatformTypeSelector: function() {
                $scope.newPlatform = true;
            },

            setNewPlatformType: function ({id}) {
                $scope.addPlatform({id});
            },

            addPlatform: function ({name: platformName = 'New platform', id: platformType = ''}) {
                const schema = getOrFetchTypeMetadata(platformType);
                const version = getLatestVersionFromSchema(schema);
                const newPlatform = Platform.factory({title: platformName, type: platformType, version: version});
                newPlatform.accessInfo = PlatformAccessInfo.factory();
                $scope.newPlatform = newPlatform;
                PlatformsActions.selectPlatform(newPlatform);
            },
            deletePlatformRecord: function (platform) {
                alertsManager.addAlertInfo({
                    type: "confirm",
                    title: 'Confirmation',
                    text: 'Are you sure you want to delete a platform "' + platform.title + '"?',
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                PlatformsActions.removePlatform(platform);
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
            destroyPlatform: function (platform) {
                alertsManager.addAlertWarning({
                    type: "warning",
                    title: 'Confirmation',
                    text: 'Are you sure you want to destroy a platform "' + platform.title + '"?<br> This action will remove platform from the cloud.',
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                $ngRedux.dispatch(provisionReduxActions.destroyPlatform(platform.installationId));
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
            cancelNewPlatform: function () {
                alertsManager.addAlertInfo({
                    type: "confirm",
                    title: 'Confirmation',
                    text: 'Are you sure you want to cancel the creating of a new platform?',
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                var $dashboardWidget = WidgetStore.getWidget();
                                close();
                                $scope.newPlatform = null;
                                platformWidgetHelper.clearNewPlatformNameParam($dashboardWidget);
                                platformWidgetHelper.clearNewPlatformTypeIdParam($dashboardWidget);
                                PlatformsActions.selectPlatform($scope.platforms[0] || null);
                                platformWidgetHelper.setPlatformParam($dashboardWidget, $scope.platforms[0] || null);
                                $scope.$emit('widgetHasBeenChanged', $dashboardWidget);
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
            openClusters: function (platform) {
                $scope.$emit('open-clusters.platforms-browser', platform);
            },
            isPlatformClustersCouldBeOpened: function (platform) {
                return platform &&
                    (platform.type == TYPE_HDP ||
                     platform.type == TYPE_CDH ||
                     platform.type == TYPE_KAFKA);
            },
            testConnectionApi: function (platform) {
                PlatformsActions.testConnectionApi(platform);
            }
        });

        init();

        function init() {
            setupWatchers();

            if ($widgetParams.params.newPlatformName) {
                console.log('newPlatformName', $widgetParams.params.newPlatformName);
                $scope.addPlatform({
                    name: $widgetParams.params.newPlatformName,
                    id: $widgetParams.params.newPlatformTypeId
                });
            }
            var addPlatformControl;

            addPlatformControl = PageControl.factory({
                label: '',
                tooltip: 'New Platform',
                type: 'control',
                icon: 'icon-plus',
                css: '',
                active: false,
                enable: true,
                action: $scope.platformWriteAccess ? function () {
                    this.popup.visible = true;
                }: function () {
                    alertsManager.addAlertError({
                        title: 'Error',
                        text: `User \"${$rootScope.currentUser.login}\" unauthorized to create new platform`
                    });
                },
                popup: $scope.platformWriteAccess ?  {
                    type: 'list',
                    items: $scope.platformTypes,
                    icons: $scope.platformIcons,
                    action: $scope.setNewPlatformType,
                    visible: false
                }: false
            });

            var platformInfoPage = TabPage.factory({
                active: true,
                name: 'platform.pages.platform-info',
                params: {}
            });
            var index = $widgetParams.page.rightTabManager.addTab(platformInfoPage, '', 'Properties', 'b-platforms-browser__properties-widget__icon', false);


            $widgetParams.page.rightTabManager.addTab(TabPage.factory({
                active: true,
                name: 'platform.pages.access-keys',
                params: {
                    mode: 'PEM'
                }
            }), '', 'Access Keys', 'b-platforms-browser__access-keys-widget__icon', false);
            $widgetParams.page.rightTabManager.setActive(index);

            $widgetParams.page.addControl(addPlatformControl);

            $widgetParams.page.on(TabPageEvents.ACTIVE_STATE_CHANGE, function (event, active) {
                $scope.isAutoRefresh = active;
            });

            startOrContinueListeningPlatformsStatus();
        }

        function setupWatchers() {
            $scope.$listenTo(PlatformsStore, 'change', function () {
                $scope.platformTypes = PlatformsStore.getTypes();
                $scope.platforms = PlatformsStore.getPlatforms();
                $scope.selectedItem = PlatformsStore.getSelectedPlatform();

                var newPlatformIsSaved = $scope.newPlatform && $scope.newPlatform.id;
                if (newPlatformIsSaved) {
                    $scope.newPlatform = null;
                }

                // if during platform status refresh cycle there are no platforms isAutoRefresh is set to `false`,
                // we need to reset it to `true` if new platforms appear
                if (!$scope.isAutoRefresh && $scope.platforms.length > 0) {
                    $scope.isAutoRefresh = true;
                }
            });

            $scope.$listenTo(PlatformsStore, 'platforms-store-PLATFORMS_STATUS_UPDATE', function () {
                $scope.pageErrorMessage = null;
            });

            $scope.$listenTo(PlatformsStore, 'platforms-store-PLATFORMS_STATUS_UPDATE_REQUEST_ERROR', function () {
                $scope.pageErrorMessage = PlatformsStore.getLastPlatformStatusError();
            });

            $scope.$on('$destroy', function () {
                $scope.isAutoRefresh = false;
            });

            $scope.$watch('isAutoRefresh', function (newValue, oldValue) {
                if (newValue !== oldValue && newValue) {
                    startOrContinueListeningPlatformsStatus();
                } else {
                    if (newValue === false) {
                        stopListeningPlatformsStatus();
                    }
                }
            });

            $scope.$on('$destroy', function () {
                stopListeningPlatformsStatus();
            });

        }

        function startOrContinueListeningPlatformsStatus() {
            if (!isListeningPlatformsStatus) {
                isListeningPlatformsStatus = true;
                PlatformsActions.listenersPlatformsStatusIncreaseCount();
            }
        }

        function stopListeningPlatformsStatus() {
            if (isListeningPlatformsStatus) {
                /**
                 * If cluster-browser widget is opened
                 * Then open cluster page and start listening platform before stopping listening websocket
                 */
                $scope.$applyAsync(function () {
                    PlatformsActions.listenersPlatformsStatusDecreaseCount();
                });
                isListeningPlatformsStatus = false;
            }
        }

        function getOrFetchTypeMetadata(typeId) {
            if (typeId === null) {
                return null;
            }
            let requestedTypes = {};
            let schema = PlatformsStore.getTypeMetadata(typeId);
            if (!schema) {
                if (!requestedTypes[typeId]) {
                    requestedTypes[typeId] = true;
                    PlatformsActions.fetchPlatformTypeMetadata(typeId);
                }
            }
            return schema;
        }

        function getLatestVersionFromSchema(schema){
            const defaultVersion = "2.5";

            if (schema) {
                let distribution = schema.info.properties.distribution.default;
                distribution = distribution ? distribution : schema.info.properties.distribution.enum[0];
                if (distribution) {
                    const arr = distribution.split(' ');
                    return arr[arr.length - 1];
                }
            }

            return defaultVersion;
        }

    }
});
