/*jshint maxparams: 7*/
import {TYPE_HDP} from '../../../plugins/platform/constants/platform-types';

define(function (require) {
    "use strict";

    require('../ngModule').service('provision.jsonSchemaHelper', jsonSchemaHelper);

    var ng = require("angular");

    var servicePropertyName = "services";
    var preSubmitCallbackPropertyName = "servicesPreSubmitDataFilter";

    function jsonSchemaHelper() {

        this.doNotShowError = false;

        this.silent = function () {
            return ng.extend({}, this, {
                doNotShowError: true
            });
        };

        this.getServicePropertyName = function () {
            return servicePropertyName;
        };

        this.getHdpProviderName = function () {
            return TYPE_HDP;
        };

        this.getPreSubmitDataFilterCallbackPropertyName = function () {
            return preSubmitCallbackPropertyName;
        };

        /**
         * Changes properties of object schema
         * @param {jsonSchema} schema
         * @param [const Array] services
         * @param [const Array] groups
         */
        this.addHdpGroupsToSchema = function (schema, services, groups) {

            if (groups && groups.length) {
                schema.properties[servicePropertyName] = {
                    "title": "HDP Groups",
                    "type": "object",
                    "properties": {}
                };

                var serviceProperties = schema.properties[servicePropertyName].properties;

                groups.forEach(({name, title, services: hostServices}) => {
                    let hostServicesName = hostServices.map(({name}) => name);
                    serviceProperties[name] = {
                        "type": "object",
                        title,
                        "subheader": true,
                        properties: createGroupPropertiesSchemaObject(services.filter(({name}) => hostServicesName.indexOf(name) != -1))
                    };
                    hostServices.forEach(({name: serviceName, enabled, editable}) => {
                        if (serviceProperties[name].properties[serviceName]) {
                            serviceProperties[name].properties[serviceName].default = enabled;
                            serviceProperties[name].properties[serviceName].readonly = !editable;
                        } else {
                            console.error("Error: Host Groups is inconsistent. Unknown service '" + name + "' in group '" + hostGroup + "'");
                        }
                    });

                });

                if (!schema.fieldGroups) {
                    schema.fieldGroups = [];
                }

                var fieldGroupObj = {
                    "title": "HDP Groups",
                    "order": schema.fieldGroups ? schema.fieldGroups.length : 0,
                    "fields": [servicePropertyName],
                    "preSubmitDataFilter": function () {
                        return function (schemaInstanceJson) {
                            var service = schemaInstanceJson[servicePropertyName];
                            var resultObject = {
                                [servicePropertyName]: []
                            };
                            if (service) {
                                var groupNames = Object.keys(service);
                                if (groupNames && groupNames.length) {
                                    resultObject[servicePropertyName] = groupNames.map((groupName) => {

                                        return {
                                            "group": groupName,
                                            "services": Object.keys(service[groupName])
                                                .filter((serviceName) => service[groupName][serviceName])
                                                .map((serviceName) => serviceName)

                                        };
                                    });
                                }
                            }
                            return resultObject;
                        }
                    }()
                };
                schema.fieldGroups.push(fieldGroupObj);
            }

            function createGroupPropertiesSchemaObject(availableServices) {
                var properties = {};
                availableServices.forEach(({name, title, cardinality}) => {
                    properties[name] = {
                        "title": title,
                        "type": "boolean",
                        "cardinality": cardinality,
                        "icon": name.toLowerCase()
                    };
                });
                return properties;
            }
        };

        this.splitSchemaIntoGroups = function (schema) {
            var allFields = Object.keys(schema.properties);
            var schemas = [];


            if (allFields.length > 0 && schema.fieldGroups && schema.fieldGroups.length) {
                schema.fieldGroups.forEach(
                    (group) => {
                        schemas.push({
                            "name": group.title,
                            "title": false,
                            "order": group.order,
                            "type": "object",
                            "properties": group.fields
                                .reduce((host, field) => {
                                    host[field] = schema.properties[field];
                                    return host;
                                }, {}),
                            "required": group.fields
                                .filter(field => schema.required.indexOf(field) > -1),
                            [preSubmitCallbackPropertyName]: group.preSubmitDataFilter
                        });
                    }
                )
            } else {
                schemas.push(schema);
            }
            return schemas;
        };
    }
});
