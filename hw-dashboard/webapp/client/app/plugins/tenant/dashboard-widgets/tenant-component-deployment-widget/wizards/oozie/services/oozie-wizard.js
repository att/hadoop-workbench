define(function (require) {
    "use strict";

    require('../ngModule').service('tenant.deploy-component.wizards.services.oozie', OozieService);
    var ng = require('angular');

    OozieService.$inject = [
        'addService.models.Wizard',
        "oozie.restService",
        "hdfs.RestService",
        "dashboard.searchService",
        'dashboard.WidgetsActions',
        'main.alerts.alertsManagerService'
    ];
    function OozieService(Wizard, restService, hdfsRestService, searchService, WidgetsActions, alertsManagerService) {
        this.create = function (sharedData, setSpinner) {
            return create(sharedData, setSpinner);
        };

        function create(data, setSpinner) {
            return Wizard.factory({data: data})
                .step({
                    widgetName: 'tenant.deploy-component.wizards.oozie.path',
                    isCompleted: function () {
                        return !!this.data["path"];
                    },
                    isDisabled: function () {
                        return !!this.data['isDisabledState'];
                    },
                    isLastStep: true,
                    readyToDeploy: function () {
                        return true;
                    },
                    status: function () {
                        if (ng.isUndefined(this.data["path"])) {
                            this.data["path"] = '/';
                        }
                        if (this.isCompleted()) {
                            return killSpaces(this.data["path"]);
                        }
                        return 'Workflow path...';
                    },
                    finish: function (dashboardWidget) {
                        var path = this.data["path"];
                        if (isStringContainSpacesAndShowAlertOnError(path)) {
                            return;
                        }
                        setSpinner(true);
                        // isTargetDirEmpty(this.data, path).then(function (isEmpty) {
                        //     if (isEmpty) {
                                deployAndStopSpinner();
                            // } else {
                            //     confirmDeployToNonEmptyDir(
                            //         path,
                            //         deployAndStopSpinner,
                            //         function () {
                            //             setSpinner(false);
                            //         }
                            //     );
                            // }
                        // }).catch(function () {
                        //     setSpinner(false);
                        // });

                        function deployAndStopSpinner() {
                            deployComponent(data)
                                .then(function (source) {
                                    var instance = {
                                        source: {
                                            platform: data.platform,
                                            cluster: data.cluster,
                                            service: data.service,
                                            type: 'OOZIE',
                                            module: {
                                                id: source.path
                                            }
                                        }
                                    };
                                    WidgetsActions.addWidget({
                                        widgetName: 'oozie',
                                        params: {
                                            source: instance.source
                                        }
                                    }, {
                                        before: dashboardWidget
                                    });
                                    WidgetsActions.removeWidget(dashboardWidget, true);
                                })
                                .finally(function () {
                                    setSpinner(false);
                                });

                        }
                    }
                })
                .finalize();
        }

        function deployComponent(sharedData) {
            sharedData.service = {
                "id": "HDFS",
                "title": "hdfs (node1)",
                "plugin": {
                    "id": "oozie-web",
                    "apiVersion": "v1.0",
                    "title": "workflow configuration service",
                    "type": "oozie"
                }
            };

            var platformId = sharedData.platform.id;
            var clusterId = sharedData.cluster.id;
            var serviceId = sharedData.service.id;

            //Oozie components is deployed on HDFS service

            /*var hdfsServiceResolved = searchService.getServices(platformId, clusterId, "HDFS").then(function (services) {
                if (services.length > 0) {
                    sharedData.service = services[0];
                } else {
                    throw new Error("No HDFS services found for oozie component to use during deployment!");
                }
            });*/


            // return hdfsServiceResolved.then(function () {
                var data = {
                    "platformId": platformId,
                    "clusterId": clusterId,
                    // "serviceId": sharedData.service.id,
                    "serviceId": serviceId,
                    "path": sharedData.path,
                    "templateId": sharedData.componentDescriptor.info.id
                };

                return restService.deployComponent(data).then(function (data) {
                    if (data.errors.length > 0) {
                        var errors = "";
                        data.errors.forEach(function (error) {
                            errors += error.message + "<br>";
                        });

                        alertsManagerService.addAlertWarning({
                            title: 'Oozie component deployment errors',
                            text: 'Oozie component has been deployed with the following errors:\n' + errors
                        });
                    }
                    return data;
                });
            // });
        }

        function killSpaces(path) {
            return path.replace(/ /g, '');
        }

/*
        function isTargetDirEmpty(source, path) {
            return hdfsRestService.factory('hdfs').getFolderListing(source, path).then(function (listingObject) {
                if (listingObject && listingObject.children && listingObject.children.length === 0) {
                    return true;
                } else {
                    return false;
                }
            }, function (data) {
                var errorObj = {
                    title: 'Oozie component deployment error',
                    text: data.message || data.statusText
                };

                alertsManagerService.addAlertError(errorObj);
                throw new Error(errorObj);
            });
        }

        function confirmDeployToNonEmptyDir(path, callbackYesFn, callbackNoFn) {
            alertsManagerService.addAlertWarning({
                title: 'Oozie component deployment warning',
                text: 'Deployment folder [' + path +'] is not empty. <br>' +
                    'Existing files will be overwritten.<br>' +
                    'Confirm deployment into non-empty dir?',
                buttons: [
                    {
                        text: "Yes",
                        style: "action",
                        action: function (close) {
                            close();
                            callbackYesFn();
                        }
                    },
                    {
                        text: "No",
                        style: "cancel",
                        action: function (close) {
                            close();
                            callbackNoFn();
                        }
                    }
                ],
                action: function (close) {
                    close();
                    callbackNoFn();
                }
            });
        }
*/

        function isStringContainSpacesAndShowAlertOnError(str) {
            if (typeof str === 'string' || str instanceof String) {
                var position = str.indexOf(' ');
                if (position != -1) {
                    alertsManagerService.addAlertWarning({
                        title: "Component Deployment",
                        text: "Deployment path contains spaces.<br>" +
                                "Space character ' ' found at position ["+ position +"]<br>" +
                                "in path [" + str + "].<br>"
                    });
                    return true;
                }
            }
            return false;
        }
    }
});
