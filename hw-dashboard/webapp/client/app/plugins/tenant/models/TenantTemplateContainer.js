define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory('tenant.models.TenantTemplateContainer', getTenantTemplateContainer);

    getTenantTemplateContainer.$inject = ['shared.jsonSchemaBuilder', 'tenant.models.TenantContainer'];
    function getTenantTemplateContainer(jsonSchemaBuilder, TenantContainer) {
        var jsonSchema = {
            type: 'object',
            title: 'Component properties',
            properties: {
                type: {
                    type: 'string',
                    readonly: true
                },
                id: {
                    type: 'string',
                    readonly: true
                },
                name: {
                    type: 'string'
                },
                version: {
                    type: 'string'
                },
                description: {
                    type: 'string'
                }
            }
        };

        function TenantTemplateContainer(options) {
            this.actionSubtype = options.actionSubtype;
            this.version = options.version;
            this.info = options.info;

            this.properties = jsonSchemaBuilder.createSchema(jsonSchema).populate(options.info);
            this.icons = [];
            this.tenant = TenantContainer.processApiResponse(options.tenant);
        }

        TenantTemplateContainer.factory = factory;
        TenantTemplateContainer.processApiResponse = processApiResponse;

        return TenantTemplateContainer;

        /*/////////////////////////*/
        function factory(options) {
            options = ng.extend({
                actionSubtype: '',
                version: '',
                info: {
                    id: 0,
                    type: '',
                    name: '',
                    title: '',
                    description: '',
                    displayType: '',
                    version: '',
                    tenantId: null
                },
                icons: [],
                template: null
            }, options);

            //remove after displayType is added on the server
            if (!options.info.displayType) {
                options.info.displayType = options.info.type;
            }
            //remove after version is added on the server
            if (!options.info.version) {
                options.info.version = '1.0';
            }

            var instance = new TenantTemplateContainer(options);
            instance.icons = getIcons(instance);
            return instance;
        }

        function processApiResponse(data) {
            if (ng.isArray(data)) {
                return data.map(processApiResponse);
            }
            return TenantTemplateContainer.factory(data);
        }

        function getIcons(TenantTemplateContainer) {
            var result = [];
            if (TenantTemplateContainer.info.type) {
                switch (TenantTemplateContainer.info.type) {
                    case 'oozieNode':
                        result.push('oozie');
                        break;
                    default:
                        result.push(TenantTemplateContainer.info.type);
                }
            }
            if (TenantTemplateContainer.actionSubtype) {
                result.push(TenantTemplateContainer.actionSubtype);
            }
            return result;
        }
    }
});
