define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('addService.models.Wizard', factory);

    factory.$inject = ['addService.models.WizardStep'];
    function factory(WizardStep) {
        function Wizard(sharedData) {
            var steps = [];
            var currentStep = null;
            var _this = this;
            var isFinalized = false;
            var forkSteps = {};

            this.step = function (options) {
                if (isFinalized) {
                    throw new Error('Trying to add new step to finalized wizard');
                }
                if (options instanceof WizardStep) {
                    steps.push(options);
                } else {
                    options = ng.extend({
                        data: sharedData,
                        nextStep: function () {
                            return _this.nextStep(this);
                        }
                    }, options);
                    steps.push(WizardStep.factory(options));
                }
                return _this;
            };

            this.addForkStep = function (name, step) {
                console.assert(!forkSteps[name], 'Fork step with such name already exists! Args:', name, step);
                console.assert(step instanceof WizardStep, 'The step is not an instance of WizardStep');
                forkSteps[name] = step;
            };

            this.fork = function (resolve) {
                if (steps.length === 0) {
                    throw new Error('No steps found for a fork');
                }
                var lastAddedStep = steps[steps.length - 1];
                lastAddedStep.nextStep = function () {
                    return resolve.call(_this, sharedData, forkSteps);
                };
                return _this;
            };

            this.startStep = function () {
                if (steps.length === 0) {
                    throw new Error('There are no steps in this wizard');
                }
                currentStep = steps[0];
                return currentStep;
            };

            this.currentStep = function () {
                return currentStep;
            };

            this.isLastStep = function (step) {
                var stepIndex = steps.indexOf(step);
                return stepIndex > -1 ? stepIndex === steps.length - 1 : false;
            };

            this.nextStep = function (step) {
                var currentIndex = currentStep ? steps.indexOf(step || currentStep) : -1;
                var nextIndex = currentIndex + 1;
                var nextStep = steps[nextIndex];
                if (nextStep) {
                    currentStep = nextStep;
                }
                return currentStep;
            };

            this.prevStep = function (step) {
                var currentIndex = currentStep ? steps.indexOf(step || currentStep) : -1;
                var prevIndex = currentIndex - 1;
                var prevStep = steps[prevIndex];
                if (prevStep) {
                    currentStep = prevStep;
                }
                return currentStep;
            };

            this.finalize = function () {
                isFinalized = true;
                return _this;
            };
        }


        Wizard.factory = function (options) {
            options = ng.extend({
                data: {}
            }, options);

            return new Wizard(options.data);
        };

        return Wizard;
    }
});
