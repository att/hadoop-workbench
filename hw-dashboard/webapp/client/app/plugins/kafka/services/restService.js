define(function (require) {
    "use strict";

    require('../ngModule').provider('kafka.restService', RestProvider);

    // data shared between RestProvider and RestService
    var remoteUrl = '/hw/module/';

    var angular = require("angular");

    var urlTemplates = {
        getKafkaPlatforms: remoteUrl + 'kafka-web/api/{0}/platforms',
        getKafkaClusters: remoteUrl + 'kafka-web/api/{0}/platforms/{1}/clusters',
        getKafkaTopics: remoteUrl + 'kafka-web/api/{0}/platforms/{1}/clusters/{2}/topics',
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
        'core.utils.string-format',
/*        'platform.models.Platform',*/
/*        'platform.models.Cluster',*/
        'kafka.models.KafkaTopic',
    ];

    function RestService($q, API, dashboardAlertsManager, stringFormat, /*Platform, Cluster, */KafkaTopic) {
        return new KafkaService($q, API);

        function KafkaService($q, API) {

            this.doNotShowError = false;

            this.silent = function () {
                return angular.extend({}, this, {
                    doNotShowError: true
                });
            };

/*
            this.getKafkaPlatforms = function () {
                return API.get(stringFormat(urlTemplates.getKafkaPlatforms, 'v1.0'))
                    .then(function (data) {
                        return data.platforms;
                    })
                    .then(Platform.processApiResponse)
                    .catch(processErrors.bind(null, this.doNotShowError));
            };
*/


/*
            this.getKafkaClusters = function (platformId) {
                return API.get(stringFormat(urlTemplates.getKafkaPlatforms, 'v1.0', platformId))
                    .then(function (data) {
                        return data.clusters;
                    })
                    .then(Cluster.processApiResponse)
                    .catch(processErrors.bind(null, this.doNotShowError));
            };
*/

            this.getKafkaTopics = function (platformId, clusterId) {
                return API.get(stringFormat(urlTemplates.getKafkaTopics, 'v1.0', platformId, clusterId))
                    .then(function (data) {
                        return data.topics;
                    })
                    .then(KafkaTopic.processApiResponse)
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
