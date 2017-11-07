import {TYPE_CDH, TYPE_HDP} from '../../../../../../../plugins/platform/constants/platform-types';
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').service('tenant.deploy-component.wizards.services.base', BaseService);

    BaseService.$inject = [
        'addService.models.Wizard',
        'addService.models.WizardStep'
    ];
    function BaseService(Wizard, WizardStep) {
        this.create = function (sharedData) {
            return create(sharedData);
        };

        function create(data) {
            return Wizard.factory({data: data})
                .step({
                    widgetName: 'tenant.deploy-component.wizards.base.platform',
                    isCompleted: function () {
                        return !!this.data['platform'];
                    },
                    readyToSave: function () {
                        return false;
                    },
                    status: function () {
                        if (this.data['platform']) {
                            return this.data['platform'].title;
                        }
                        return 'Select platform...';
                    }
                })
                .step({
                    widgetName: 'tenant.deploy-component.wizards.base.cluster',
                    isCompleted: function () {
                        return !!this.data['cluster'];
                    },
                    readyToSave: function () {
                        return false;
                    },
                    status: function () {
                        if (this.data['cluster']) {
                            return this.data['cluster'].title;
                        }
                        return 'Select cluster...';
                    }
                })
                .fork(function (sharedData, forkSteps) {
                    var step;
                    var componentType = sharedData.componentDescriptor.info.type.toLowerCase();
                    if (componentType === "flume" || componentType === "flume-agent") {
                        var platformType = sharedData && sharedData.platform && sharedData.platform.type;
                        if (platformType === TYPE_HDP) {
                            step = forkSteps["flume-hdp"];
                        } else if (platformType === TYPE_CDH) {
                            step = forkSteps["flume"];
                        } else {
                            step = forkSteps["flume"];
                        }
                    } else if (componentType === "oozie" || componentType === "oozie-workflow") {
                        let {deploymentDescriptor: {useSpaces = false} = {}} = sharedData;
                        if (useSpaces) {
                            step = forkSteps["oozie-space"];
                        } else {
                            step = forkSteps["oozie"];
                        }
                    }

                    if (!step) {
                        throw new Error('Can not find forkStep for componentType: ', componentType);
                    }

                    return step;
                })
                .finalize();
        }
    }
});
