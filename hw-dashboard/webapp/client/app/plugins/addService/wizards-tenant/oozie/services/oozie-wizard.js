define(function (require) {
    "use strict";

    require('../ngModule').service('addService.wizards-tenant.services.oozie', OozieService);
    var ng = require('angular');

    OozieService.$inject = [
        'addService.models.Wizard',
        "oozie.restService",
        'dashboard.WidgetsActions'
    ];
    function OozieService(Wizard, restService, WidgetsActions) {
        this.create = function (sharedData, setSpinner) {
            return create(sharedData, setSpinner);
        };

        function create(data, setSpinner) {
            return Wizard.factory({data: data})
                .step({
                    widgetName: 'addService.wizards-tenant.oozie.version',
                    isCompleted: function () {
                        return !!this.data["version"] && this.data["version"] !== '';
                    },
                    readyToCreate: function () {
                        return false;
                    },
                    status: function () {
                        if (this.isCompleted()) {
                            return killSpaces(this.data["version"]);
                        }
                        return 'Workflow version...';
                    }
                })
                .step({
                    widgetName: 'addService.wizards-tenant.oozie.template',
                    isCompleted: function () {
                        return true;
                    },
                    readyToCreate: function () {
                        return false;
                    },
                    status: function () {
                        if (this.isCompleted()) {
                            var template = this.data["workflow-template"];
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
                    widgetName: 'addService.wizards-tenant.oozie.inputData',
                    isCompleted: function () {
                        return !!this.data["componentName"] && this.data['componentName'] && !!this.data["componentVersion"] && this.data["componentVersion"] !== '';
                    },
                    isLastStep: true,
                    readyToCreate: function () {
                        return true;
                    },
                    finish: function (dashboardWidget) {
                        setSpinner(true);
                        return createComponent(data)
                            .then(function (componentId) {
                                var componentDescriptor = {
                                    info: {
                                        description: data.componentDescription || "",
                                        displayType: "Workflow",
                                        id: componentId,
                                        name: data.componentName,
                                        version: data.componentVersion,
                                        tenantId: data.container.id,
                                        type: "oozie",
                                        oozieVersion: data["version"]
                                    },
                                    files: [],
                                    tenantId: data.container.id
                                };

                                WidgetsActions.addWidget({
                                    widgetName: 'tenant-workflow-template',
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
                description: sharedData.componentDescription,
                workflowVersion: sharedData.version,
                workflowName: sharedData.workflowName,
                templateId: !sharedData['workflow-template'] ? null : sharedData['workflow-template'].info.id
            };

            return restService.createComponent(componentData);
        }

        function killSpaces(path) {
            return path.replace(/ /g, '');
        }
    }
});
