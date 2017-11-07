define(function (require) {
    "use strict";

    require('../ngModule').service('addService.wizards-tenant.services.flume', FlumeService);

    FlumeService.$inject = [
        'addService.models.Wizard',
        "flume.restService",
        'dashboard.WidgetsActions'
    ];
    function FlumeService(Wizard, restService, WidgetsActions) {
        this.create = function (sharedData, setSpinner) {
            return create(sharedData, setSpinner);
        };

        function create(data, setSpinner) {
            return Wizard.factory({data: data})
                .step({
                    widgetName: 'addService.wizards-tenant.flume.template',
                    isCompleted: function () {
                        return true;
                    },
                    readyToCreate: function () {
                        return false;
                    },
                    status: function () {
                        if (this.isCompleted()) {
                            var template = this.data["template"];
                            if (!template) {
                                return 'Blank';
                            } else {
                                return template.info.name;
                            }
                        }
                        return 'Template...';
                    }
                })
                .step({
                    widgetName: 'addService.wizards-tenant.flume.inputData',
                    isCompleted: function () {
                        return !!this.data["agentName"] && this.data["agentName"] !== '' &&
                            !!this.data["componentName"] && this.data["componentName"] !== '' &&
                            !!this.data["componentVersion"] && this.data["componentVersion"] !== '';
                    },
                    isLastStep: true,
                    readyToCreate: function () {
                        return true;
                    },
                    status: function () {
                        if (this.isCompleted()) {
                            return killSpaces(this.data["agentName"]);
                        }
                        return 'Agent name...';
                    },
                    finish: function (dashboardWidget) {
                        if (!this.isCompleted()) {
                            return;
                        }
                        setSpinner(true);
                        return createComponent(data)
                            .then(function (componentId) {
                                var componentDescriptor = {
                                    info: {
                                        id: componentId,
                                        name: data.componentName,
                                        version: data.componentVersion,
                                        title: data.agentName,
                                        tenantId: data.container.id,
                                        type: "flume"
                                    }
                                };

                                WidgetsActions.addWidget({
                                    widgetName: 'tenant-flume-template',
                                    params: {
                                        componentDescriptor: componentDescriptor
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

        function createComponent(sharedData) {
            var componentData = {
                tenantId: sharedData.container.id,
                name: sharedData.componentName,
                version: sharedData.componentVersion,
                agentName: sharedData.agentName,
                description: sharedData.componentDescription,
                templateId: !sharedData.template ? null : sharedData.template.info.id
            };

            return restService.createComponent(componentData);
        }

        function isValidModuleName(name) {
            return /^([a-zA-Z\$_][a-zA-Z0-9_]*)$/.test(name);
        }

        function killSpaces(path) {
            return path.replace(/ /g, '');
        }

    }
});
