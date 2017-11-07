/*jshint maxparams: 6*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    var urlGetModules = '/hw/module/platform-web/api/v1.0/flatModules';
    var urlGetTenantsListing = "/hw/module/tenant-web/api/v1.0/tenants";
    var urlGetTenantComponentsListing = "/hw/module/tenant-web/api/v1.0/flatTemplates";
    // data shared between searchProvider and SearchService
    var remoteUrl = '/hw/module/platform-web/api/v1.0/';

    require('../ngModule').provider('dashboard.searchService', SearchProvider);

    function SearchProvider() {

        this.setRemoteUrl = function (url) {
            remoteUrl = url;
        };

        this.$get = getSearchService;
    }

    getSearchService.$inject = [
        '$q',
        'dap.main.models.ServiceDataSource',
        'main.alerts.alertsManagerService',
        'core.API'
    ];
    function getSearchService($q, ServiceDataSource, dashboardAlertsManager, API) {
        return new SearchService();

        function SearchService() {
            this.getPlatforms = getPlatforms;
            this.getClusters = getClusters;
            this.getClustersInfo = getClustersInfo;
            this.getClustersListing = getClustersListing;
            this.getServiceTypes = getServiceTypes;
            this.getPluginServices = getPluginServices;
            this.getServices = getServices;
            this.getModules = getModules;
            this.getTenantsListing = getTenantsListing;
            this.getTenantComponentsListing = getTenantComponentsListing;
            this.getPluginDirs = getPluginDirs;

            function getPlatforms() {
                return API.get(remoteUrl + 'platforms').then(success, processError);

                function success(data) {
                    var platformsObj = data.platforms;
                    return extractPlatforms(platformsObj);
                }
            }

            function getClusters(platformId) {
                return API.get(remoteUrl + 'platforms/' + platformId + '/clusters').then(success, processError);

                function success(data) {
                    var clustersObj = data.clusters;
                    return extractClusters(clustersObj);
                }
            }

            function getClustersInfo(platformId) {
                return API.get(remoteUrl + 'platforms/' + platformId + '/clusters').then(success, processError);
                function success({clusters=[]}) {
                    return clusters.map(({info = {}}) => info);
                }
            }

            function getClustersListing(apiVersion, _groupByPlatform) {
                var groupByPlatform = ng.isUndefined(_groupByPlatform) ? true : false;
                var p;

                p = API.get('/hw/module/platform-web/api/' + apiVersion + '/allClusters?cacheOnly=true').then(function (data) {
                    return data.platforms.map(function (container) {
                        return {
                            id: container.platform.id,
                            host: container.platform.host,
                            title: container.platform.title,
                            isOnline: container.isOnline,
                            isOffline: container.isOffline,
                            isError: container.isError,
                            isProvisioning: container.isProvisioning,
                            type: container.platform.type,
                            clusters: container.clusters.map(function (c) {
                                c.isOnline = container.isOnline;
                                // @TODO: remove Temporary fix for old code, should be changed to c.info.id only
                                c.id = c.info.id;
                                c.title = c.info.title;
                                // EOF temporary fix
                                return c;
                            })
                        };
                    });
                });

                if (!groupByPlatform) {
                    p = p.then(function (platforms) {
                        var clusters = [];
                        platforms.forEach(function (platform) {
                            platform.clusters.forEach(function (cluster) {
                                cluster.platform = {
                                    id: platform.id,
                                    host: platform.host,
                                    title: platform.title,
                                    type: platform.type
                                };
                                clusters.push(cluster);
                            });
                        });
                        return clusters;
                    });
                }

                return p;
            }

            function getPluginDirs(platformId) {
                return API.get(`${remoteUrl}platforms/${platformId}/access?view=short`).then((data)=>data.pluginDirs);
            }

            function getServiceTypes() {
                return API.get(remoteUrl + 'serviceTypes').then(success);

                function success(data) {
                    return extractServices(data);
                }
            }

            function getServices(platformId, clusterId, serviceType) {
                return API.get(remoteUrl + 'platforms/' + platformId + '/clusters/' + clusterId + '/services?serviceType=' + serviceType).then(success);

                function success(data) {
                    return extractServices(data.services);
                }
            }

            function getPluginServices(platformId, clusterId) {
                var defer = $q.defer();

                var flumeServiceType = 'flume';
                var oozieServiceType = 'oozie';

                var flumePromise = API.get(remoteUrl + 'platforms/' + platformId + '/clusters/' + clusterId + '/services?serviceType=' + flumeServiceType, {cache: false});
                var ooziePromise = API.get(remoteUrl + 'platforms/' + platformId + '/clusters/' + clusterId + '/services?serviceType=' + oozieServiceType, {cache: false});

                return $q.all([flumePromise, ooziePromise]).then(success);

                function success(response) {
                    var flumeObj = response[0];
                    var oozieObj = response[1];
                    var flumeServices = extractServices(flumeObj.services);
                    var oozieServices = extractServices(oozieObj.services);
                    return flumeServices.concat(oozieServices);
                }
            }

            function getModules() {
                return API.get(urlGetModules).then(success);

                function success(data) {
                    var modules = data.modules || [];
                    return modules.map(convertModule);

                    /**
                     *
                     * @param {object} module
                     * @param {string} module.id
                     * @param {string} module.title
                     * @param {string} module.renderedName
                     * @param {string} module.agentName
                     * @param {string} module.type
                     *
                     * @param {object} module.cluster
                     * @param {string} module.cluster.id
                     * @param {string} module.cluster.title
                     *
                     * @param {object} module.service
                     * @param {string} module.service.id
                     * @param {string} module.service.title
                     *
                     * @param {object} module.platform
                     * @param {string} module.platform.id
                     * @param {string} module.platform.title
                     * @param {string} module.platform.host
                     * @returns {Main.Models.ServiceDataSource}
                     */
                    function convertModule(module) {
                        return ServiceDataSource.factory({
                            id: module.id,
                            module: {
                                id: module.id || module.path,
                                title: module.title,
                                version: module.version
                            },
                            platform: module.platform,
                            cluster: module.cluster,
                            service: module.service,
                            version: module.version,
                            path: module.path,
                            title: module.title,
                            renderedName: module.renderedName,
                            agentName: module.agentName,
                            isSaved: true,
                            type: module.type
                        });
                    }
                }
            }

            function getTenantsListing() {
                return API.get(urlGetTenantsListing).then(success);

                function success(data) {
                    return data.tenants || [];
                }
            }

            function getTenantComponentsListing() {
                return API.get(urlGetTenantComponentsListing).then(success);

                function success(data) {
                    return data.templates || [];
                }
            }

            function extractPlatforms(platformsObj) {
                return platformsObj;
            }

            function extractClusters(clustersObj) {
                return clustersObj;
            }

            function extractServices(servicesObj) {
                return servicesObj;
            }

            function processError(error) {
                var errorMessage = {
                    type: "error",
                    text: error.message,
                    title: "Server error"
                };

                dashboardAlertsManager.addAlerts([errorMessage]);

                return $q.reject(error);
            }
        }
    }

});
