define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory("oozie.models.Module", getModule);

    getModule.$inject = ['dap.main.models.Module', 'dap.main.models.ServiceDataSource'];
    function getModule(BaseModule, ServiceDataSource) {
        function OozieModule(id, title, isSaved) {
            BaseModule.call(this, id, title, isSaved);

            this.config = [];
            this.files = [];
            this.workflowTemplateId = null;
            this.dependencies = [];
            this.version = '';
        }

        OozieModule.prototype = Object.create(BaseModule.prototype);

        OozieModule.prototype.toJSON = function () {
            return {
                name: this.name,
                nodes: this.getNodes().map(function (n) {
                    return n.toJSON();
                }),
                connections: this.getConnections().map(function (c) {
                    return c.toJSON();
                }),
                visualProperties: {
                    positionType: this.visualProperties.positionType
                },
                version: this.version,
                propertyFiles: this.getPropertyFilesLoaders().map(function (l) {
                    return l.toJSON();
                })
            };
        };

        OozieModule.factory = function factory(json, source) {
            json = ng.extend({
                id: null,
                name: '',
                title: '',
                type: 'oozie',
                visualProperties: {
                    positionType: 'absolute'
                },
                config: [],
                files: [],
                workflowTemplateId: null
            }, json);

            var module = new OozieModule(json.id, json.name);
            module.name = json.name;
            module.type = json.type;
            module.visualProperties.positionType = json.visualProperties.positionType;
            module.source = ServiceDataSource.factory(source);
            module.version = json.version;
            module.usedTemplates = [];
            module.config = json.config;
            module.files = json.files;
            module.workflowTemplateId = json.workflowTemplateId;

            return module;
        };

        return OozieModule;
    }
});
