/*jshint maxparams: 7*/
define(function (require) {
    "use strict";

    require('../ngModule').provider('provision.restService', RestProvider);

    // data shared between RestProvider and RestService
    var remoteUrl = '/hw/module/';

    var ng = require("angular");

    var urlTemplates = {
        getPlatformProviders: remoteUrl + 'provision-web/api/v1.0/providers',
        getPlatformProvisionWebs: remoteUrl + 'provision-web/api/v1.0/urls',
        getPlatformProviderMetadata: remoteUrl + 'provision-web/api/v1.0/providers/{0}/distributions/{1}/versions/{2}/metadata',
        postProvisionPlatform: remoteUrl + 'provision-web/api/v1.0/installations?provider={0}&distribution={1}&version={2}',
        destroyPlatform: remoteUrl + 'provision-web/api/v1.0/installations/{0}',

        getPlatformProviderServiceMetadata: remoteUrl + 'provision-web/api/v1.0/providers/{0}/distributions/{1}/versions/{2}/metadata/services',
        getPlatformProviderHostGroupsMetadata: remoteUrl + 'provision-web/api/v1.0/providers/{0}/distributions/{1}/versions/{2}/metadata/hostGroups',
    };

    function RestProvider() {

        this.setRemoteUrl = function (url) {
            remoteUrl = url;
        };

        this.$get = RestService;
    }

    RestService.$inject = [
        '$q',
        'core.API',
        "main.alerts.alertsManagerService",
        'core.utils.string-format'
    ];

    function RestService($q, API, dashboardAlertsManager, stringFormat) {
        return new PlatformService($q, API);

        function PlatformService($q, API) {

            this.doNotShowError = false;

            this.silent = function () {
                return ng.extend({}, this, {
                    doNotShowError: true
                });
            };

            // var exampleProviders = {"providers":[{"name":"AWS","title":"AWS","distributions":[{"name":"HDP","title":"Hortonworks","versions":["2.2.8"]}]}]}
            this.getPlatformProviders = function () {
                return API.get(urlTemplates.getPlatformProviders);
            };

            this.getPlatformProvisionWebs = function () {
                return API.get(urlTemplates.getPlatformProvisionWebs)
                    .then(({urls = []}) => urls);
            };

            // var example = {"jsonSchema":{"name":"AWS Cluster Meta","properties":{"ambari-password":{"title":"Ambari password","type":"string"},"ambari-url":{"title":"Ambari URL","type":"string"},"cluster-name":{"title":"Cluster Name","type":"string"},"aws-region":{"title":"AWS Region","type":"string","enum":[{"value":"us-east-1","title":"US East (N. Virginia)"},{"value":"us-west-2","title":"US West (Oregon)"},{"value":"us-west-1","title":"US West (N. California)"},{"value":"eu-west-1","title":"EU (Ireland)"},{"value":"eu-central-1","title":"EU (Frankfurt)"},{"value":"ap-southeast-1","title":"Asia Pacific (Singapore)"},{"value":"ap-northeast-1","title":"Asia Pacific (Tokyo)"},{"value":"ap-southeast-2","title":"Asia Pacific (Sydney)"},{"value":"ap-northeast-2","title":"Asia Pacific (Seoul)"},{"value":"ap-south-1","title":"Asia Pacific (Mumbai)"},{"value":"sa-east-1","title":"South America (São Paulo)"}]},"ambari-user":{"title":"Ambari user","type":"string"},"nodes-count":{"title":"Nodes Count","type":"integer"},"hdfs-size":{"title":"HDFS Size (GB)","type":"integer"}},"type":"object","required":["cluster-name","nodes-count","hdfs-size","aws-region"],"$schema":"http://json-schema.org/draft-04/schema#"}}
            this.getPlatformProviderMetadata = function (providerId, distributionId, version) {
                var url = stringFormat(urlTemplates.getPlatformProviderMetadata, providerId, distributionId, version);
                return API.get(url);
            };

            this.getPlatformProviderServiceMetadata = function (providerId, distributionId, version) {
                var url = stringFormat(urlTemplates.getPlatformProviderServiceMetadata, providerId, distributionId, version);
                return API.get(url);
            };

            this.getPlatformProviderHostGroupsMetadata = function (providerId, distributionId, version) {
                var url = stringFormat(urlTemplates.getPlatformProviderHostGroupsMetadata, providerId, distributionId, version);
                return API.get(url);
            };

            this.provisionPlatform = function (providerId, distributionId, version, params) {
                var url = stringFormat(urlTemplates.postProvisionPlatform, providerId, distributionId, version);
                return API.post(url, params)
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.destroyPlatform = function (platformInstallId) {
                var url = stringFormat(urlTemplates.destroyPlatform, platformInstallId);
                return API.delete(url)
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            function processErrors(doNotShowError, error) {
                if (!doNotShowError) {
                    var errorMessage = {
                        title: "Server error",
                        text: error.message
                    };
                    dashboardAlertsManager.addAlertError(errorMessage);
                }
                return $q.reject(error);
            }
        }
    }
});
