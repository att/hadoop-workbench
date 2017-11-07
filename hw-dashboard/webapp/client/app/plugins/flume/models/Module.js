define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory("flume.models.Module", getModule);

    getModule.$inject = ['dap.main.models.Module', 'dap.main.models.ServiceDataSource'];
    function getModule(BaseModule, ServiceDataSource) {
        function FlumeModule(id, title, agentName, isSaved) {
            BaseModule.call(this, id, title, isSaved);
            this.files = [];
            this.templateId = null;
            this.agentName = agentName;
        }

        FlumeModule.prototype = Object.create(BaseModule.prototype);

        FlumeModule.prototype.toJSON = function () {
            return {
                id: this.id,
                title: this.title,
                name: this.name,
                agentName: this.agentName,
                nodes: this.getNodes().map(function (n) {
                    return n.toJSON();
                }),
                connections: this.getConnections().map(function (c) {
                    return c.toJSON();
                }),
                visualProperties: {
                    positionType: this.visualProperties.positionType
                },
                templateId: this.templateId
            };
        };

        FlumeModule.factory = function factory(json, source) {
            json = ng.extend({
                id: null,
                agentName: '',
                name: '',
                title: '',
                type: 'flume',
                visualProperties: {
                    positionType: 'absolute'
                },
                templateId: null
            }, json);

            var module = new FlumeModule(json.id, json.name, json.agentName);
            module.name = json.name;
            module.visualProperties.positionType = json.visualProperties.positionType;
            module.source = ServiceDataSource.factory(source);
            module.templateId = json.templateId;
            module.files = json.files;

            return module;
        };

        return FlumeModule;
    }
});
