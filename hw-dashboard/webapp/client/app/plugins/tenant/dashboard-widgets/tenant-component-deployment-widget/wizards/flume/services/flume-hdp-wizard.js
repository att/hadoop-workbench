define(function (require) {
    "use strict";

    require('../ngModule').service('tenant.deploy-component.wizards.services.flume-hdp', FlumeHdpService);

    FlumeHdpService.$inject = [
        'addService.models.Wizard',
        "flume.restService",
        'dashboard.WidgetsActions'
    ];

    function FlumeHdpService(Wizard, restService, WidgetsActions) {
        this.create = function (sharedData, setSpinner) {
            return create(sharedData, setSpinner);
        };

        function create(data, setSpinner) {
            return Wizard.factory({data: data})
                .step({
                    widgetName: 'tenant.deploy-component.wizards.flume.service',
                    isCompleted: function () {
                        return !!this.data["service"];
                    },
                    status: function () {
                        if (this.isCompleted()) {
                            return this.data["service"].title;
                        }
                        return 'Service name...';
                    }
                })
                .step({
                    widgetName: 'tenant.deploy-component.wizards.flume.componentName',
                    isLastStep: true,
                    isCompleted: function () {
                        return !!this.data["flume-component"];
                    },
                    status: function () {
                        if (this.data['flume-component']) {
                            return this.data['flume-component'];
                        }
                        return 'Flume component name...';
                    },
                    readyToDeploy: function () {
                        return true;
                    },
                    finish: function (dashboardWidget) {
                        if (!this.isCompleted()) {
                            return;
                        }
                        setSpinner(true);
                        deployComponent(data)
                            .then(function (moduleId) {
                                var instance = {
                                    source: {
                                        platform: data.platform,
                                        cluster: data.cluster,
                                        service: data.service,
                                        type: 'FLUME',
                                        module: {
                                            id: moduleId,
                                            name: data["flume-component"],
                                            title: data.componentDescriptor.info.name
                                        }
                                    }
                                };
                                WidgetsActions.addWidget({
                                    widgetName: 'flume',
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
                })
                .finalize();
        }

        function deployComponent(info) {
            var data = {
                "platform": info.platform.id,
                "cluster": info.cluster.id,
                "service": info.service.id,
                "name": info["flume-component"],
                "templateId": info.componentDescriptor.info.id,
                "pluginDir": ""
        };

            return restService.deployComponent(data);
        }

    }
});
