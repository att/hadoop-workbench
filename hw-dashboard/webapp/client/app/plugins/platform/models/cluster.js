define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('platform.models.Cluster', getFactory);

    getFactory.$inject = [
        'platform.models.ClusterHdfsAccess',
        'platform.models.ClusterOozieAccess',
        'platform.models.ClusterJobTrackerAccess',
        'platform.models.ClusterZooKeeperAccess',
        'platform.models.ClusterJobHistoryAccess',
        'platform.models.ClusterResourceManagerAccess',
        'platform.models.ClusterConfigRequest',
        'platform.models.ClusterIndexation'
    ];
    function getFactory(ClusterHdfsAccess,
                        ClusterOozieAccess,
                        ClusterJobTrackerAccess,
                        ClusterZooKeeperAccess,
                        ClusterJobHistoryAccess,
                        ClusterResourceManagerAccess,
                        ClusterConfigRequest,
                        ClusterIndexation) {
        function Cluster(options) {
            this.id = options.id;
            this.title = options.title;
            this.kerberized = options.kerberized;
            this.realm = options.realm;
            this.indexation = options.indexation;
            this.configRequest = options.configRequest;
            this.hdfsAccessInfo = options.hdfsAccessInfo;
            this.oozieAccessInfo = options.oozieAccessInfo;
            if (options.jobTrackerAccessInfo) {
                this.jobTrackerAccessInfo = options.jobTrackerAccessInfo;
            }
            if (options.zooKeeperAccessInfo) {
                this.zooKeeperAccessInfo = options.zooKeeperAccessInfo;
            }
            if (options.jobHistoryAccessInfo) {
                this.jobHistoryAccessInfo = options.jobHistoryAccessInfo;
            }
            if (options.resourceManagerAccessInfo) {
                this.resourceManagerAccessInfo = options.resourceManagerAccessInfo;
            }
            this.customData = options.customData;
        }

        Cluster.prototype = {
            toJSON: function () {
                var json = {
                    id: this.id,
                    title: this.title,
                    kerberized: this.kerberized,
                    realm: this.realm,
                    indexation: this.indexation.toJSON(),
                    configRequest: this.configRequest.toJSON(),
                    hdfsAccess: this.hdfsAccessInfo.toJSON(),
                    oozieAccess: this.oozieAccessInfo.toJSON(),
                    customData: this.customData
                };
                if (this.jobTrackerAccessInfo) {
                    if (this.jobTrackerAccessInfo.toJSON == undefined) {
                        this.jobTrackerAccessInfo = ClusterJobTrackerAccess.factory(this.jobTrackerAccessInfo);
                    }
                    json.jobTrackerAccess = this.jobTrackerAccessInfo.toJSON();
                }
                if (this.zooKeeperAccessInfo) {
                    if (this.zooKeeperAccessInfo.toJSON == undefined) {
                        this.zooKeeperAccessInfo = ClusterZooKeeperAccess.factory(this.zooKeeperAccessInfo);
                    }
                    json.zooKeeperAccess = this.zooKeeperAccessInfo.toJSON();
                }
                if (this.jobHistoryAccessInfo) {
                    if (this.jobHistoryAccessInfo.toJSON == undefined) {
                        this.jobHistoryAccessInfo = ClusterJobHistoryAccess.factory(this.jobHistoryAccessInfo);
                    }
                    json.jobHistoryAccess = this.jobHistoryAccessInfo.toJSON();
                }
                if (this.resourceManagerAccessInfo) {
                    if (this.resourceManagerAccessInfo.toJSON == undefined) {
                        this.resourceManagerAccessInfo = ClusterResourceManagerAccess.factory(this.resourceManagerAccessInfo);
                    }
                    json.resourceManagerAccess = this.resourceManagerAccessInfo.toJSON();
                }
                return json;
            }
        };

        Cluster.factory = function (options) {
            options = ng.extend({
                id: "",
                title: "",
                kerberized: false,
                realm: "",
            }, options);

            options.indexation = ClusterIndexation.factory(options.indexation);
            options.configRequest = ClusterConfigRequest.factory(options.configRequest);
            options.hdfsAccessInfo = ClusterHdfsAccess.factory(options.hdfsAccess);
            options.oozieAccessInfo = ClusterOozieAccess.factory(options.oozieAccess);
            if (options.jobTrackerAccess) {
                options.jobTrackerAccessInfo = ClusterJobTrackerAccess.factory(options.jobTrackerAccess);
            }
            if (options.zooKeeperAccess) {
                options.zooKeeperAccessInfo = ClusterZooKeeperAccess.factory(options.zooKeeperAccess);
            }
            if (options.jobHistoryAccess) {
                options.jobHistoryAccessInfo = ClusterJobHistoryAccess.factory(options.jobHistoryAccess);
            }
            if (options.resourceManagerAccess) {
                options.resourceManagerAccessInfo = ClusterResourceManagerAccess.factory(options.resourceManagerAccess);
            }
            return new Cluster(options);
        };

        Cluster.processApiResponse = function (data) {
            if (ng.isArray(data)) {
                return data.map(Cluster.processApiResponse);
            }
            return Cluster.factory(data);
        };

        return Cluster;
    }
});
