define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory('tenant.models.TenantContainer', getTenantContainer);

    getTenantContainer.$inject = ['shared.jsonSchemaBuilder'];
    function getTenantContainer(jsonSchemaBuilder) {
        var jsonSchema = {
            type: 'object',
            title: 'Tenant properties',
            properties: {
                id: {
                    type: 'string',
                    readonly: true
                },
                name: {
                    type: 'string',
                    restrictions: [
                        {type: 'max-length', value: 500}
                    ]
                },
                version: {
                    type: 'string',
                    restrictions: [
                        {type: 'max-length', value: 500}
                    ]
                },
                description: {
                    type: 'string',
                    restrictions: [
                        {type: 'max-length', value: 2000}
                    ]
                }
            },
            required: ['name', 'version']

        };

        function TenantContainer(options) {
            this.version = options.version;
            this.info = options;
            this.properties = jsonSchemaBuilder.createSchema(jsonSchema).populate(options);
        }

        TenantContainer.factory = factory;
        TenantContainer.processApiResponse = processApiResponse;

        return TenantContainer;

        /*/////////////////////////*/
        function factory(options) {
            options = ng.extend({
                version: '',
                id: 0,
                name: '',
                description: ''
            }, options);

            //remove after version is added on the server
            if (!options.version) {
                options.version = '1.0';
            }

            return new TenantContainer(options);
        }

        function processApiResponse(data) {
            if (ng.isArray(data)) {
                return data.map(processApiResponse);
            }
            return TenantContainer.factory(data);
        }
    }
});
