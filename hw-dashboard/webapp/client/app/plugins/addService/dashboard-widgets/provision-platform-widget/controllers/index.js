/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('provision-platform-widget.IndexController', SearchController);

    SearchController.$inject = [
        '$scope',
        'dashboard-isolated-widget-accessor.WidgetStore',
        'addService.wizards-platform.services.base',
        '$widgetParams',
        "dashboard.WidgetsActions",
        '$ngRedux',
        'provision.redux-actions',
        'provision.restService',
        'provision.jsonSchemaHelper',
        '$q',
        "main.alerts.alertsManagerService",
        'dap.shared.validation.RestrictionsService',
        'shared.subtypePropertyRestrictionPreprocessor'
    ];
    function SearchController($scope, WidgetStore, baseWizard, $widgetParams, WidgetsActions, $ngRedux
        , provisionReduxActions, provisionRestService, jsonSchemaHelper, $q, dashboardAlertsManager, RestrictionService, RestrictionPreprocessor) {
        var dashboardWidget = WidgetStore.getWidget();
        var provider = $widgetParams.provider;

        var schemaErrors = [];

        dashboardWidget.title = 'Provision ' + (provider.title ? provider.title : ' Platform');
        dashboardWidget.fullWidth = true;
        dashboardWidget.hSize = 3;
        dashboardWidget.hideSizeControls = true;


        /*--------------------------------------------------------------------*/
        ng.extend($scope, {
            steps: [],
            sharedData: $widgetParams.sharedData || {},
            currentStep: null,
            currentStepNumber: 1,
            isLoading: false
        });

        /**
         * Set default properties
         */
        ng.extend($scope.sharedData, {
            schemaSteps: [],
            schemaInstanceSteps: [],
            provider
        });

        /*--------------------------------------------------------------------*/
        ng.extend($scope, {
            provider: provider.provider,
            distribution: provider.distribution,
            version: provider.version,
        });

        var requests = {
            provider: provisionRestService.getPlatformProviderMetadata(
                provider.provider,
                provider.distribution,
                provider.version
            )
        };
        if (provider.distribution == jsonSchemaHelper.getHdpProviderName()) {
            ng.extend(requests, {
                service: provisionRestService.getPlatformProviderServiceMetadata(
                    provider.provider,
                    provider.distribution,
                    provider.version
                ),
                hostGroups: provisionRestService.getPlatformProviderHostGroupsMetadata(
                    provider.provider,
                    provider.distribution,
                    provider.version
                )
            });
        }
        $q.all(requests).then(
            ({provider: jsonSchemaContainer, service, hostGroups}) => {
                if (service && hostGroups) {
                    jsonSchemaHelper.addHdpGroupsToSchema(jsonSchemaContainer.jsonSchema, service.services, hostGroups.groups);
                }

                init(jsonSchemaContainer.jsonSchema);

            });


        function init(schema) {
            var validator = RestrictionService.factory();
            var preprocessedRestrictions = RestrictionPreprocessor.unpackRestrictions(schema);
            validator.processRestrictions(preprocessedRestrictions, true);
            var validationRule = validator.getValidator();
            $scope.sharedData.schemaSteps = jsonSchemaHelper.splitSchemaIntoGroups(schema);


            ng.extend($scope, {
                cancelCreateNew: function () {
                    WidgetsActions.removeWidget(dashboardWidget);
                },
                prevStep: function () {
                    validationRule.clearErrors();
                    if ($scope.currentStep.isCompleted() && $scope.currentStep.isLastStep) {
                        let idx = $scope.steps.length - 1,
                            schemaProps = $scope.currentStep.schema.properties.services.properties,
                            instanceSteps = $scope.sharedData.schemaInstanceSteps[idx].instance.properties.services;

                        modifySchemaDefaults(schemaProps, instanceSteps);
                    }
                    back();
                },
                nextStep: function () {
                    validationRule.clearErrors();
                    if ($scope.currentStep.isCompleted()) {
                        dashboardAlertsManager.clearAlerts();
                        schemaErrors = [];
                        let idx = $scope.steps.indexOf($scope.currentStep),
                            schemaProps = $scope.currentStep.schema.properties,
                            instanceSteps = $scope.sharedData.schemaInstanceSteps[idx];
                        modifySchemaDefaults(schemaProps, instanceSteps);
                        let nodes = $scope.currentStep.schema.properties,
                            schemaErrors = !validationRule.validateErrors('provision', nodes);
                        if (!schemaErrors) {
                            var nextStep = $scope.currentStep.nextStep();
                            nextStep.showValidationErrors = false;
                            pushStep(nextStep);
                            if (nextStep) {
                                $scope.currentStep = nextStep;
                            }
                        } else {
                            $scope.showValidationErrors(validationRule.getErrors());
                            $scope.currentStep.showValidationErrors = true;
                        }

                    } else {
                        $scope.currentStep.showValidationErrors = true;
                    }
                },
                save: function () {
                    $scope.currentStep.showValidationErrors = true;
                    if (!$scope.currentStep.isCompleted() || !$scope.currentStep.readyToCreate()) {
                        return;
                    }
                    $scope.currentStep.finish(dashboardWidget).then(
                        function () {
                            // provisionRestService.provisionPlatform(provider.provider, provider.distribution, provider.version, $scope.sharedData);
                            // $ngRedux.dispatch(provisionRestService.getComponentsListing());
                        }
                    );
                },
                showValidationErrors: function (errors) {
                    if (errors) {
                        var alerts = [];
                        errors.forEach(function (error) {
                            var message = {
                                type: "error",
                                title: "Invalid field",
                                text: error.message
                            };
                            alerts.push(message);
                        });

                        dashboardAlertsManager.addAlerts(alerts);
                    }
                    return $scope.currentStep.showValidationErrors;
                },
                key: function (index) {
                    return $scope.sharedData.schemaSteps[index] ? $scope.sharedData.schemaSteps[index].name + ':' : '';
                }
            });

            $scope.$on('nextStep.addService', function () {
                $scope.nextStep();
            });

            $scope.$watch('currentStep', function (step) {
                $scope.currentStepNumber = $scope.steps.indexOf(step) + 1;
            });

            var baseWizardInstance = baseWizard.create($scope.sharedData, setSpinner);
            $scope.currentStep = baseWizardInstance.startStep();

            pushStep($scope.currentStep);

            function pushStep(step) {
                var currentStepIndex = $scope.steps.indexOf($scope.currentStep);
                if (currentStepIndex < $scope.steps.length - 1) {
                    $scope.steps.splice(currentStepIndex + 1);
                }
                $scope.steps.push(step);
            }

            function back() {
                var currentStepIndex = $scope.steps.indexOf($scope.currentStep);
                if (currentStepIndex > 0) {
                    $scope.currentStep = $scope.steps[currentStepIndex - 1];
                    $scope.currentStep.showValidationErrors = false;
                }
            }

            function setSpinner(val) {
                $scope.isLoading = !!val;
            }
        }

        function modifySchemaDefaults (schemaProps, instanceSteps) {
            Object.keys(schemaProps).forEach((item) => {
                schemaProps[item].default = instanceSteps.toJSON()[item];
            })
        }
    }
});
