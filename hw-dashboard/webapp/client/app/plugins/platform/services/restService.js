/*jshint maxparams: 7*/
define(function (require) {
    "use strict";

    require('../ngModule').provider('platform.restService', RestProvider);

    // data shared between RestProvider and RestService
    var remoteUrl = '/hw/module/';

    var ng = require("angular");

    var urlTemplates = {
        getAllPlatforms: remoteUrl + 'platform-web/api/{0}/platforms?view={1}',
        getPlatform: remoteUrl + 'platform-web/api/{0}/platforms/{1}?view={2}',
        postPlatform: remoteUrl + 'platform-web/api/{0}/platforms',
        putPlatform: remoteUrl + 'platform-web/api/{0}/platforms/{1}',
        deletePlatform: remoteUrl + 'platform-web/api/{0}/platforms/{1}',
        getAllPlatformClusters: remoteUrl + 'platform-web/api/{0}/platforms/{1}/clusters?includeOffline=true&view=admin',
        getClustersMetadata: remoteUrl + 'platform-web/api/{0}/platforms/{1}/clusters/metadata',
        getPlatformTypes: remoteUrl + 'platform-web/api/{0}/platforms/types',
        getPlatformTypeMetadata: remoteUrl + 'platform-web/api/{0}/platforms/types/{1}/metadata',

        getClusterDeploymentEnvironments: remoteUrl + 'platform-web/api/{0}/platforms/{1}/clusters/{2}/environments',
        updateCluster: remoteUrl + 'platform-web/api/{0}/platforms/{1}/clusters/{2}',
        getClusterTestHdfs: remoteUrl + 'platform-web/api/{0}/platforms/{1}/clusters/{2}/test-hdfs',
        postClusterIndexHdfs: remoteUrl + 'platform-web/api/{0}/platforms/{1}/clusters/{2}/hdfs/index/{3}',
        deleteClusterIndexHdfs: remoteUrl + 'platform-web/api/{0}/platforms/{1}/clusters/{2}/hdfs/index',
        putClusterHdfsAccessInfo: remoteUrl + 'platform-web/api/{0}/platforms/{1}/clusters/{2}/hdfs',
        getAccessKeys: remoteUrl + 'platform-web/api/{0}/platforms/{1}/clusters/{2}/keys?type={3}',
        uploadAccessKey: remoteUrl + 'platform-web/api/{0}/platforms/{1}/clusters/{2}/keys?operation=upload&type={3}&name={4}',
        createAccessKey: remoteUrl + 'platform-web/api/v1.0/platforms/{0}/clusters/{1}/keys?operation=create&type={2}&name={3}',
        deleteAccessKeyFile: remoteUrl + 'platform-web/api/{0}/platforms/{1}/clusters/{2}/keys/{3}',
        getPlatformAccess: remoteUrl + 'platform-web/api/{0}/platforms/{1}/access',
        putPlatformAccess: remoteUrl + 'platform-web/api/{0}/platforms/{1}/access',
        getPlatformTestApi: remoteUrl + 'platform-web/api/{0}/platforms/{1}/test-api',
        serviceUsers: remoteUrl + 'platform-web/api/v1.0/platforms/{0}/clusters/{1}/users',
        updateServiceUsers: remoteUrl + 'platform-web/api/v1.0/platforms/{0}/clusters/{1}/users/{2}',
        deleteServiceUser: remoteUrl + 'platform-web/api/v1.0/users/{0}',
        getHdfsServiceInfo: "/hw/module/platform-web/api/v1.0/hdfs?host={0}&port={1}",
        postOozieJobIndexationStart: remoteUrl + 'platform-web/api/v1.0/platforms/{0}/clusters/{1}/oozieJob/index/',
        platformMeta: remoteUrl + 'platform-web/api/v1.0/platforms/{0}',
        pullConfig: remoteUrl + 'platform-web/api/v1.0/platforms/{0}/clusters/{1}/configs',
        pushConfig: remoteUrl + 'oozie-web/api/v1.0/platforms/{0}/clusters/{1}/workflows'
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
        'platform.models.Platform',
        'platform.models.PlatformAccessInfo',
        'platform.models.ClusterMetaFactory',
    ];

    function RestService($q, API, dashboardAlertsManager, stringFormat, Platform, PlatformAccessInfo, ClusterMetaFactory) {
        return new PlatformService($q, API);

        function PlatformService($q, API) {

            this.doNotShowError = false;

            this.silent = function () {
                return ng.extend({}, this, {
                    doNotShowError: true
                });
            };

            /*Platforms*/
            this.getPlatformTypeMetadata = function (typeId) {
                return API.get(stringFormat(urlTemplates.getPlatformTypeMetadata, 'v1.0', typeId)).then(function (data) {
                    return data.jsonSchema.properties;
                });
            };

            this.getPlatformTypes = function () {
                return API.get(stringFormat(urlTemplates.getPlatformTypes, 'v1.0')).then(function (data) {
                    return data.platformTypes;
                });
            };

            this.getAllPlatforms = function (apiVersion, isShort) {
                return API.get(stringFormat(urlTemplates.getAllPlatforms, apiVersion, isShort ? 'short' : 'full'))
                    .then(function (data) {
                        return data.platforms;
                    })
                    .then(Platform.processApiResponse)
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getPlatform = function (apiVersion, platformId, isShort) {
                return API.get(stringFormat(urlTemplates.getPlatform, apiVersion, platformId, isShort ? 'short' : 'full'))
                    .then(platform => Platform.processApiResponse(platform))
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.createPlatform = function (apiVersion, platform) {
                var data = platform.toJSON();
                return API.post(stringFormat(urlTemplates.postPlatform, apiVersion), data)
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.updatePlatform = function (apiVersion, platform) {
                var data = platform.toJSON();
                return API.put(stringFormat(urlTemplates.putPlatform, apiVersion, platform.id), data);
            };

            this.deletePlatform = function (apiVersion, platformId) {
                return API.delete(stringFormat(urlTemplates.deletePlatform, apiVersion, platformId))
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getClusterDeploymentEnvironments = function (apiVersion, platformId, clusterId) {
                return API.get(stringFormat(urlTemplates.getClusterDeploymentEnvironments, apiVersion, platformId, clusterId))
                    .then(({environments = []} = {}) => environments);
            };

            this.getClusterByHostAndPort = function (host, port) {
                return API.get(stringFormat(urlTemplates.getHdfsServiceInfo, host, port));
            };

            this.getPlatformAccessInfo = function (apiVersion, platformId) {
                return API.get(stringFormat(urlTemplates.getPlatformAccess, apiVersion, platformId))
                    .then(function (data) {
                        data = data || {};
                        if (!data.id) {
                            data.id = platformId;
                        }
                        return data;
                    })
                    .then(PlatformAccessInfo.processApiResponse)
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.updatePlatformAccessInfo = function (apiVersion, platformId, accessInfo) {
                return API.put(stringFormat(urlTemplates.putPlatformAccess, apiVersion, platformId), accessInfo.toJSON())
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            /*Clusters*/
            this.getClustersMetadata = function (apiVersion, platformId) {
                return API.get(stringFormat(urlTemplates.getClustersMetadata, apiVersion, platformId)).then(function (data) {
                    return data.jsonSchema.properties;
                });
            };

            this.getAllPlatformClusters = function (apiVersion, platform) {

                return (this.getClustersMetadata(apiVersion, platform.id).then((metadata) => {
                    return API.get(stringFormat(urlTemplates.getAllPlatformClusters, apiVersion, platform.id))
                        .then(function (data) {
                            return data.clusters;
                        })
                        .then(ClusterMetaFactory(metadata).processApiResponse)
                        .then(function (clusterInstances) {
                            clusterInstances.forEach(function (c) {
                                c.platformId = platform.id;
                                c.platformType = platform.type;
                            });
                            return clusterInstances;
                        })
                        .catch(processErrors.bind(null, this.doNotShowError));
                })
                .catch(processErrors.bind(null, this.doNotShowError)));
            };

            this.getClusterTestHdfs = function (apiVersion, platformId, clusterId, title) {
                return API.get(stringFormat(urlTemplates.getClusterTestHdfs, apiVersion, platformId, clusterId))
                    .then(function () {
                        dashboardAlertsManager.addAlertSuccess({
                            title: 'Success',
                            text: 'HDFS connection test for cluster "' + title + '" passed successfully.'
                        });
                    })
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.updateCluster = function (apiVersion, platformId, clusterId, cluster) {
                return API.put(stringFormat(urlTemplates.updateCluster, apiVersion, platformId, clusterId), cluster.toJSON());
            };

            this.indexOozieStart = function (apiVersion, platformId, clusterId, path) {
                path = path || '';
                path = path.replace(/^(\/){1,}/, '');
                return API.post(stringFormat(urlTemplates.postClusterIndexHdfs, apiVersion, platformId, clusterId, path))
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.indexOozieStop = function (apiVersion, platformId, clusterId) {
                return API.delete(stringFormat(urlTemplates.deleteClusterIndexHdfs, apiVersion, platformId, clusterId))
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getPlatformTestApi = function (apiVersion, platformId) {
                return API.get(stringFormat(urlTemplates.getPlatformTestApi, apiVersion, platformId))
                    .then(function () {
                        dashboardAlertsManager.addAlertSuccess({
                            title: 'Success',
                            text: 'Platform connection test successfully.'
                        })
                    })
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            /*Key files*/
            /**
             * @param apiVersion
             * @param {boolean}isSSH - false means KERBEROS
             * @returns {*}
             */
            this.getAccessKeys = function (apiVersion, isSSH, platformId, clusterId) {
                let keyType = isSSH ? 'pem' : "keytab";
                return API.get(stringFormat(urlTemplates.getAccessKeys, apiVersion, platformId, clusterId, keyType))
                    .then(function (data) {
                        return data.keys.map((key) => {
                            key.type = keyType;
                            return key;
                        });
                    })
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getUploadAccessKeyUrl = function (apiVersion, isSSH, name, platformId, clusterId) {
                return stringFormat(urlTemplates.uploadAccessKey, apiVersion, platformId, clusterId, isSSH ? 'pem' : "keytab", encodeURIComponent(name));
            };

            this.deleteAccessKeyFile = function (apiVersion, platformId, clusterId, fileId) {
                return API.delete(stringFormat(urlTemplates.deleteAccessKeyFile, apiVersion, platformId, clusterId, fileId))
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.getServiceUsers = function (platformId, clusterId) {
                let url = stringFormat(urlTemplates.serviceUsers, platformId, clusterId);
                return API.get(url);
            };

            this.createServiceUser = function (user, platformId, clusterId) {
                user.platformId = platformId;
                user.clusterId = clusterId;

                let url = stringFormat(urlTemplates.serviceUsers, platformId, clusterId);
                return API.post(url, user);
            };

            this.createAccessKeyFile = function (key, platformId, clusterId,) {
                let url = stringFormat(urlTemplates.createAccessKey, platformId, clusterId, 'keytab', key.principal);
                return API.post(url, key);
            };

            this.updateServiceUser = function (user, platformId, clusterId) {
                user.platformId = platformId;
                user.clusterId = clusterId;

                let url = stringFormat(urlTemplates.updateServiceUsers, platformId, clusterId, user.id);
                return API.put(url, user);
            };

            this.deleteServiceUser = function (platformId, clusterId, id) {
                let url = stringFormat(urlTemplates.updateServiceUsers, platformId, clusterId, id);
                return API.delete(url);
            };

            this.indexFlumeStart = function (platformId, clusterId) {
                // Use stub because appropriate rest is not ready yet
                var deferred = $q.defer();
                setTimeout(deferred.resolve, 3000);
                return deferred.promise;
            };

            this.platformMeta = function (platformId) {
                var url = stringFormat(urlTemplates.platformMeta, platformId);
                return API.get(url);
            };

            this.pullConfig = function (cluster) {
                var url = stringFormat(urlTemplates.pullConfig, cluster.platformId, cluster.info.id);
                return API
                    .put(url, null, {})
                    .then(function () {
                        dashboardAlertsManager.addAlertSuccess({
                            title: 'Success',
                            text: 'Pulling configs for cluster "' + cluster.title + '" succeed.'
                        });
                    })
                    .catch(processErrors.bind(null, this.doNotShowError));
            };

            this.pushConfig = function (cluster) {
                var url = stringFormat(urlTemplates.pushConfig, cluster.platformId, cluster.info.id);
                return API
                    .put(url, null, {})
                    .then(function () {
                        dashboardAlertsManager.addAlertSuccess({
                            title: 'Success',
                            text: 'Pushing configs for cluster "' + cluster.title + '" succeed.'
                        });
                    })
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
