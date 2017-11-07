import {oozieComponentFilesWrapper} from "../../oozie/models/rest-helper";

require('../ngModule').provider('tenant.restService', TenantRestServiceProvider);

var remoteUrl = '/hw/module';
var urlTemplates = {
    getTemplates: remoteUrl + '/tenant-web/api/{0}/tenants/{1}/templates',
    getTenant: remoteUrl + '/tenant-web/api/{0}/tenants/{1}',
    updateTenant: remoteUrl + '/tenant-web/api/{0}/tenants/{1}',
    postTemplate: remoteUrl + '/tenant-web/api/{0}/templates',
    deleteTemplate: remoteUrl + '/tenant-web/api/{0}/tenants/{1}/templates/{2}',
    deleteTenant: remoteUrl + '/tenant-web/api/{0}/tenants/{1}',
    deleteTenantForce: remoteUrl + '/tenant-web/api/{0}/tenants/{1}?force=true',
    getOozieComponent: remoteUrl + '/oozie-web/api/{0}/templates/workflows/{1}',
    getFlumeComponent: remoteUrl + '/flume-web/api/{0}/templates/agents/{1}',
    getTemplatesListing: remoteUrl + '/tenant-web/api/v1.0/flatTemplates',
    promoteToProduction: remoteUrl + '/tenant-web/api/v1.0/components?operation=s3export'
};

TenantRestServiceProvider.$inject = [
    'core.utils.string-format'
];
function TenantRestServiceProvider(stringFormat) {
    this.$get = $get;
    $get.$inject = [
        '$http',
        '$q',
        'tenant.models.TenantContainer',
        'tenant.models.TenantTemplateContainer',
        'main.alerts.alertsManagerService',
        'core.API'
    ];
    function $get($http, $q, TenantContainer, TenantTemplateContainer, dashboardAlertsManager, API) {
        return new TenantRestService();

        function TenantRestService() {

            this.doNotShowError = false;

            this.silent = function () {
                return ng.extend({}, this, {
                    doNotShowError: true
                });
            };

            this.createTenant = function (name, description, version) {
                return $http.post("/hw/module/tenant-web/api/v1.0/tenants", {
                        name: name,
                        description: description,
                        version: version
                    })
                    .then(processResponse, processResponse)
                    .then(function ({id}) {
                        return {id, name, description, version};
                    });
            };

            this.getTenant = function (apiVersion, tenantId) {
                var url = stringFormat(urlTemplates.getTenant, apiVersion, tenantId);
                return $http.get(url).then(processResponse, processErrors.bind(null, this.doNotShowError))
                    .then(TenantContainer.processApiResponse);
            };

            this.updateTenant = function (tenantId, name, description, version) {
                var url = stringFormat(urlTemplates.updateTenant, 'v1.0', tenantId);
                var data = {
                    id: (+tenantId), // backend states, that id must be integer!!!
                    name: name,
                    description: description,
                    version: version
                };

                return $http.put(url, data)
                    .then(processResponse, processResponse)
                    .then(function () {return data;})
                    .then(TenantContainer.processApiResponse);
            };

            this.getTemplates = function (apiVersion, tenantId) {
                var url = stringFormat(urlTemplates.getTemplates, apiVersion, tenantId);
                return $http.get(url).then(processResponse, processResponse).then(function (data) {
                    data.templates.forEach(function (item) {
                        item.info.tenantId = tenantId;
                    });
                    return data.templates;
                }).then(TenantTemplateContainer.processApiResponse);
            };

            this.deleteTemplate = function (apiVersion, tenantId, templateId) {
                var url = stringFormat(urlTemplates.deleteTemplate, apiVersion, tenantId, templateId);
                return $http.delete(url).then(processResponse, processResponse).then(function (data) {
                    return data;
                });
            };

            this.deleteTenantContainer = function (apiVersion, tenantId) {
                var url = stringFormat(urlTemplates.deleteTenant, apiVersion, tenantId);
                return $http.delete(url).then(processResponse, processResponse).then(function (data) {
                    return data;
                });
            };

            this.deleteTenantContainerForce = function (apiVersion, tenantId) {
                var url = stringFormat(urlTemplates.deleteTenantForce, apiVersion, tenantId);
                return $http.delete(url).then(processResponse, processResponse).then(function (data) {
                    return data;
                });
            };

            // Note: tenantComponentId is componentDescriptor.info.id
            this.getOozieComponent = function (apiVersion, tenantComponentId) {
                var url = stringFormat(urlTemplates.getOozieComponent, apiVersion, tenantComponentId);
                return $http.get(url).then(function (response) {
                    return oozieComponentFilesWrapper(response.data.data);
                }, processErrors.bind(null, this.doNotShowError));
            };

            this.getFlumeComponent = function (apiVersion, tenantComponentId) {
                var url = stringFormat(urlTemplates.getFlumeComponent, apiVersion, tenantComponentId);
                return $http.get(url).then(function (response) {
                    return response.data.data;
                }, processErrors.bind(null, this.doNotShowError));
            };

            this.getFile = function (apiVersion, tenantId, path) {
                var url = stringFormat(urlTemplates.getTemplateFile, apiVersion, tenantId, path);
                return $http.get(url).then(function (response) {
                    return response.data.data;
                }, processErrors.bind(null, this.doNotShowError));
            };

            this.saveFile = function (apiVersion, tenantId, file) {
                var url = stringFormat(urlTemplates.saveTemplateFile, apiVersion, tenantId, file.path);
                return $http.put(url, {
                    text: file.text
                }).then(function (response) {
                    return response.data.data;
                }, processErrors.bind(null, this.doNotShowError));
            };

            this.removeFile = function (apiVersion, tenantId, file) {
                var url = stringFormat(urlTemplates.removeTemplateFile, apiVersion, tenantId, file.path);
                return $http.delete(url).then(function (response) {
                    return response.data.data;
                }, processErrors.bind(null, this.doNotShowError));
            };

            this.getTemplatesListing = function () {
                return API.get(urlTemplates.getTemplatesListing)
                    .then(data => data.templates || [])
                    .then(list => list.map(item =>
                        TenantTemplateContainer.processApiResponse(Object.assign({}, item.template, {tenant: item.tenant}))));
            };
            
            this.promoteToProduction = function (componentId) {
                return API.put(urlTemplates.promoteToProduction, {componentId: componentId});
            };

        }

        function processResponse(response) {
            var data;
            var isWrongFormat = false;
            try {
                data = JSON.parse(response.data);
            }
            catch (e) {
                if (angular.isObject(response.data)) {
                    data = response.data.data;
                } else {
                    isWrongFormat = true;
                    data = null;
                }
            }
            switch (response.status) {
                case 400:
                    var errorMessage = response.data.message;

                    if (!errorMessage.startsWith('Cannot delete') &&
                        /** fix for not found error returned as http 400 */
                        errorMessage.indexOf('not found') === -1) {
                        var errorMsg = {
                            title: 'Already exists',
                            text: errorMessage
                        };
                        dashboardAlertsManager.addAlertError(errorMsg);
                    }
                    return $q.reject(response.data);
                case 419:
                    return $q.reject({message: 'Session expired'});
                case 401:
                    if (isWrongFormat) {
                        return $q.reject({message: 'Wrong credentials'});
                    } else {
                        return $q.reject(response.data);
                    }
                    break;
                case 403:
                    if (isWrongFormat) {
                        return $q.reject({message: 'Not authorized'});
                    } else {
                        return $q.reject(response.data);
                    }
                    break;
                case 404:
                case 500:
                    if (isWrongFormat) {
                        return $q.reject({message: 'Something went wrong on the server'});
                    } else {
                        return $q.reject(response.data);
                    }
                    break;
                case 200:
                case 201:
                    return data;
                default:
                    return $q.reject(data);
            }
        }

        function processErrors(doNotShowError, response) {
            if (response.status === 400 || response.status === 500) {
                if (!doNotShowError) {
                    var message = response.data.message || "Something went wrong on server";
                    var errorMessage = {
                        type: "error",
                        title: "Server error",
                        text: message
                    };
                    dashboardAlertsManager.addAlerts([errorMessage]);
                }

                return $q.reject({message:message});
            }
        }
    }
}
