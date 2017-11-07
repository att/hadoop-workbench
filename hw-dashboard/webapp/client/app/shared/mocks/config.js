define(function (require) {
    "use strict";

    require('./ngModule').run(['$httpBackend', 'ServerDataModel', function ($httpBackend, ServerDataModel) {
        /*jshint -W074*/

        var enableFlumeMockData = false;
        var enableOozieMockData = false;
        var enableAuthorizationMockData = false;
        var enableAddServiceMockData = false;
        var enableTenantMockData = false;
        var enableHdfsMockData = true;

        if (enableFlumeMockData) {
            $httpBackend.whenGET(/flume-web\/api\/v1.0\/platforms/).respond(function (method, requestString) {
                var data = ServerDataModel.flume.module.data;
                return [200, {data: data}];
            });
            $httpBackend.whenGET(/flume-web\/api\/v1.0\/metadata/).respond(function (method, requestString) {
                var typesRegexp = /\/types/;
                var subtypesRegexp = /subtypes/;
                var connectionsRegexp = /connections/;

                var serverData = null;
                switch (true) {
                    case typesRegexp.test(requestString):
                    {
                        serverData = ServerDataModel.flume.type.data;
                        break;
                    }
                    case subtypesRegexp.test(requestString):
                    {
                        serverData = ServerDataModel.flume.subtype.data;
                        break;
                    }
                    case connectionsRegexp.test(requestString):
                    {
                        serverData = ServerDataModel.flume.connection.data;
                        break;
                    }
                }

                return [200, {data: serverData}];
            });
            $httpBackend.whenGET(/hw\/module\/flume\/modules/).respond(function (method, requestString) {
                return [200, {data: {modules: []}}];
            });
        } else {
            $httpBackend.whenGET(/flume-web\/api\/v1.0\/platforms/).passThrough();
            $httpBackend.whenGET(/flume-web\/api\/v1.0\/metadata/).passThrough();
        }

        if (enableOozieMockData) {
            $httpBackend.whenGET(/oozie-web\/api\/v1.0\/platforms/).respond(function (method, requestString) {
                var data = ServerDataModel.oozie.module;
                return [200, data];
            });
            $httpBackend.whenGET(/oozie-web\/api\/v1.0\/metadata/).respond(function (method, requestString) {
                var typesRegexp = /\/types/; // we should add "\/" here because if not it will also match the query for subtypes
                var subtypesRegexp = /subtypes/;
                var connectionsRegexp = /connections/;

                var serverData = null;
                switch (true) {
                    case typesRegexp.test(requestString):
                    {
                        serverData = ServerDataModel.oozie.type.data;
                        break;
                    }
                    case subtypesRegexp.test(requestString):
                    {
                        serverData = ServerDataModel.oozie.subtype.data;
                        break;
                    }
                    case connectionsRegexp.test(requestString):
                    {
                        serverData = ServerDataModel.oozie.connection.data;
                        break;
                    }
                }

                return [200, {data: serverData}];
            });
            $httpBackend.whenPOST(/hw\/module\/oozie-web\/api\/[^\/]+\/platforms\/[^\/]+\/clusters\/[^\/]+\/services\/HDFS\/workflows\/.+/).respond(function (method, requestString) {
                var id = requestString.split('/services/HDFS/workflows/')[1];
                return [200, {data: {moduleId: id}}];
            });

            $httpBackend.whenPOST(/mode=filesContent/).respond(function () {
                return [200, {data: ServerDataModel.oozie.filesContent.data}];
            });

            $httpBackend.whenGET(/oozie-web\/api\/v1.0\/templates\/nodes/).respond(function () {
                return [200, {data: ServerDataModel.tenant.metadata.data}];
            });

            $httpBackend.whenGET(/oozie-web\/api\/v1.0\/templates\/nodes\/templates/).respond(function () {
                return [200, {data: ServerDataModel.tenant.template.data}];
            });

            // mock not implemented
            $httpBackend.whenPUT(/hw\/module\/oozie-web\/api\/v1.0\/platforms/).passThrough();
        } else {
            $httpBackend.whenGET(/oozie-web\/api\/v1.0\/platforms/).passThrough();
            $httpBackend.whenGET(/hw\/module\/oozie-web\/api\/v1.0/).passThrough();
            $httpBackend.whenPUT(/hw\/module\/oozie-web\/api\/v1.0\/platforms/).passThrough();
            $httpBackend.whenDELETE(/hw\/module\/oozie-web\/api\/v1.0\/platforms/).passThrough();
            $httpBackend.whenPOST(/hw\/module\/oozie-web\/api\/[^\/]+\/platforms\/[^\/]+\/clusters\/[^\/]+\/services\/HDFS\/workflows\/.+/).passThrough();
        }

        if (enableAuthorizationMockData) {
            $httpBackend.whenGET(/hw\/auth\/getUser/).respond(function () {
                return [200, {data: {username: 'admin'}}];
            });
            $httpBackend.whenPOST(/hw\/auth\/login/).respond(function (method, requestString) {
                return [200, {data: {token: 15124}}];
            });
            $httpBackend.whenPOST(/hw\/auth\/logout/).respond(function (method, requestString) {
                return [200, {data: {username: 'admin'}}];
            });
        } else {
            $httpBackend.whenPOST(/hw\/auth\/login/).passThrough();
            $httpBackend.whenPOST(/hw\/auth\/logout/).passThrough();
            $httpBackend.whenGET(/hw\/auth\/getUser/).passThrough();
        }

        if (enableAddServiceMockData) {
            $httpBackend.whenGET(/hw\/module\/platform-web\/api\/[^\/]+\/platforms$/).respond(function () {
                return [200, {
                    "data": {
                        "platforms": [{
                            "id": 1,
                            "title": "cloudera openstack2",
                            "host": "127.0.0.1"
                        }]
                    }
                }];
            });
            $httpBackend.whenGET(/hw\/module\/platform-web\/api\/[^\/]+\/platforms\/[^\/]+\/clusters$/).respond(function () {
                return [200, {
                    "data": {
                        "clusters": [{
                            "id": "AutoCluster1",
                            "title": "AutoCluster1"
                        }]
                    }
                }];
            });
            $httpBackend.whenGET(/hw\/module\/platform-web\/api\/[^\/]+\/platforms\/[^\/]+\/clusters\/AutoCluster1\/services\?serviceType=oozie/).respond(function () {
                return [200, {
                    "data": {
                        "services": [{
                            "id": "HDFS",
                            "title": "hdfs (node1)",
                            "plugin": {
                                "id": "oozie-web",
                                "apiVersion": "v1.0",
                                "title": "workflow configuration service",
                                "type": "oozie"
                            }
                        }]
                    }
                }];
            });
        } else {
            $httpBackend.whenGET(/hw\/module\/platform-web\/api\/[^\/]+\/platforms$/).passThrough();
            $httpBackend.whenGET(/hw\/module\/platform-web\/api\/[^\/]+\/platforms\/[^\/]+\/clusters$/).passThrough();
            $httpBackend.whenGET(/hw\/module\/platform-web\/api\/[^\/]+\/platforms\/[^\/]+\/clusters\/[^\/]+\/services?serviceType=oozie/).passThrough();
        }

        if (enableTenantMockData) {
            $httpBackend.whenPOST(/tenant-web\/api\/v1.0\/tenants/).respond(function () {
                return [200, {data: ServerDataModel.tenant.filesContent.data}];
            });
        } else {
            // implement real links here
        }

        if (enableHdfsMockData) {
            $httpBackend.whenGET(/hdfs-web\/api\/v1.0\/platforms/).respond(function (method, requestString) {
                var index = requestString.indexOf("/path");
                var path = requestString.substr(index + "/path".length);
                var data = ServerDataModel.hdfs.path[path].data;
                return [200, {data: data}];
            });
        } else {
            $httpBackend.whenGET(/hdfs-web\/api\/v1.0\/platforms/).passThrough();
        }

        // ------- views, styles and fonts
        // server data
        $httpBackend.whenGET(/\.html/).passThrough();
        $httpBackend.whenGET(/fonts/).passThrough();
        $httpBackend.whenGET(/flatModules/).passThrough();
        $httpBackend.whenGET(/flatClusters/).passThrough();
        $httpBackend.whenGET(/user/).passThrough();
        $httpBackend.whenPUT(/user/).passThrough();

    }]);
});
