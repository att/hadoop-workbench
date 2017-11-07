define(function (require) {
    "use strict";

    require('../ngModule').service('tenant.deploy-component.wizards.services.oozie-space', OozieSpaceService);
    var ng = require('angular');

    OozieSpaceService.$inject = [
        'addService.models.Wizard',
        "oozie.restService",
        'dashboard.WidgetsActions',
        'main.alerts.alertsManagerService'
    ];
    function OozieSpaceService(Wizard, restService, WidgetsActions, alertsManagerService) {
        this.create = function (sharedData, setSpinner) {
            return create(sharedData, setSpinner);
        };

        function create(data, setSpinner) {
            return Wizard.factory({data: data})
                .step({
                    widgetName: 'tenant.deploy-component.wizards.oozie.space',
                    isCompleted: function () {
                        return !!this.data["env"];
                    },
                    isDisabled: function () {
                        return !!this.data['isDisabledState'];
                    },
                    isLastStep: true,
                    readyToDeploy: function () {
                        return true;
                    },
                    status: function () {
                        if (this.isCompleted()) {
                            return this.data["env"];
                        }
                        return 'Workflow environment...';
                    },
                    finish: function (dashboardWidget, parentWidget) {
                        setSpinner(true);
                        deployAndStopSpinner();

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
                                    let replaceWidget = parentWidget ? parentWidget : {
                                        widgetName: 'oozie',
                                        params: {
                                            source: instance.source
                                        }
                                    };
                                    WidgetsActions.addWidget(replaceWidget, { replace: dashboardWidget });
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
                    "env": sharedData.env,
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
    }
});
