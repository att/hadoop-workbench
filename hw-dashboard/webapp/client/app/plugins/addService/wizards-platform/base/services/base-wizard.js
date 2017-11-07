define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').service('addService.wizards-platform.services.base', BaseService);

    BaseService.$inject = [
        'addService.models.Wizard',
        'provision.restService',
        'platform.restService',
        'dashboard.WidgetsActions',
        'provision.jsonSchemaHelper',
    ];
    function BaseService(Wizard, restService, platformRestService, WidgetsActions, jsonSchemaHelper) {
        this.create = function (sharedData, setSpinner) {
            return create(sharedData, setSpinner);
        };

        function create(data, setSpinner) {
            var steps = [];
            var i = 0;
            var schemaSteps = data.schemaSteps;
            console.assert(i < 9, "Exceeded maximum step number 10");
            if (i > 9) {
                return;
            }
            schemaSteps.forEach((schemaStep) => {
                steps.push(ordinalStepOptionsDecoration({}, schemaStep))
            });
            if (steps.length) {
                let finalStepId = steps.length - 1;
                ng.extend(steps[finalStepId], finalStepOptionsDecoration(steps[finalStepId]));

            }

            function ordinalStepOptionsDecoration(step, schema) {

                var titles = Object.keys(schema.properties)
                    .reduce((host, propertyName) => {
                        host[propertyName] =  schema.properties[propertyName].title;
                        return host;
                    }, {} );

                var stepDone = ng.extend({}, step, {
                    widgetName: 'addService.platformWizards.base.universal' + i,
                    stepIndex: i,
                    schema: schema,
                    isCompleted: function () {
                        if (this.schema.required) {
                            let schemaInstance = this.data.schemaInstanceSteps[this.stepIndex];

                            if (schemaInstance) {
                                let values = schemaInstance.toJSON();
                                var result = this.schema.required.every((fieldName) => !!values[fieldName]);
                                return result;
                            }
                        }
                        return true;
                    },
                    readyToCreate: function () {
                        return false;
                    },
                    // @NOTE: not used in current implementation
                    status: function () {
                        let schemaInstance = this.data.schemaInstanceSteps[this.stepIndex];
                        if (schemaInstance) {
                            var info = schemaInstance.toJSON(true);
                            var res = Object.keys(info)
                                .filter((field) => !isEmptyStringOrUndefined(info[field]))
                                .reduce((host, field) => (host + ', ' + titles[field] + ': ' + info[field]));
                            return res;
                        }
                        return '';
                    }
                });
                i++;
                return stepDone;

                function isEmptyStringOrUndefined(value) {
                    return value === undefined || value === "";
                }
            }

            function finalStepOptionsDecoration(step) {
                return ng.extend({}, step, {
                    readyToCreate: function () {
                        return true;
                    },
                    isLastStep: true,
                    finish: function (dashboardWidget) {
                        setSpinner(true);
                        return provisionPlatform(data)
                            .then(processSuccessProvisionPlatformResponseFactory(dashboardWidget))
                            .finally(function () {
                                setSpinner(false);
                            });
                    }
                });
            }

            var wizard = Wizard.factory({data: data});
            var wizardProcessed = steps.reduce((wiz, step) => {
                return wiz.step(step)
            }, wizard);
            wizardProcessed.finalize();
            return wizardProcessed;

            function provisionPlatform(sharedData) {
                var preSubmitCallbackPropertyName = jsonSchemaHelper.getPreSubmitDataFilterCallbackPropertyName();
                var provider = {
                    provider: sharedData.provider.provider,
                    distribution: sharedData.provider.distribution,
                    version: sharedData.provider.version,
                };

                var params = {};
                sharedData.schemaInstanceSteps.forEach((schemaInstance, i) => {
                    var jsonfiedSchemaInstance = schemaInstance.toJSON();
                    var dataConverterFunc = sharedData.schemaSteps[i][preSubmitCallbackPropertyName];
                    if (dataConverterFunc) {
                        jsonfiedSchemaInstance = dataConverterFunc(jsonfiedSchemaInstance);
                    }
                    return ng.extend(params, jsonfiedSchemaInstance);
                });
                return restService.provisionPlatform(provider.provider, provider.distribution, provider.version, params);
            }

            function loadPlatform(platformId) {
                return platformRestService.getPlatform('v1.0', platformId);
            }

            function processSuccessProvisionPlatformResponseFactory(dashboardWidget) {
                return function (response) {
                    if (response && response.platformId !== undefined) {
                        loadPlatform(response.platformId).then((platform) => {

                            WidgetsActions.addWidgetSingleton(
                                {
                                    widgetName: 'platform-manager',
                                    params: {
                                        platform: platform
                                    }
                                },
                                {
                                    top: true
                                },
                                null,
                                function(widget){
                                    return (widget.dashboardWidget && widget.dashboardWidget.widgetName == "platform-manager");
                                },

                            );
                            WidgetsActions.removeWidget(dashboardWidget, true);
                        })
                    }
                }
            }
        }
    }
});
