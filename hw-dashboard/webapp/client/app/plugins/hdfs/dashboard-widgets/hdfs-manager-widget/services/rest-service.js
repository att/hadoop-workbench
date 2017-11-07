/*jshint maxparams:15*/
define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').service('hdfs.RestService', getRestService);

    getRestService.$inject = ['$q', 'core.API', 'core.utils.string-format'];
    function getRestService($q, API, stringFormat) {

        RestService.factory = function (loader) {
            switch (loader) {
                case "hdfs":
                {
                    return new HdfsLoader();
                }
                case "oozie":
                {
                    return new OozieLoader();
                }
                case "oozie-tenant":
                {
                    return new OozieTenantLoader();
                }
            }
        };

        function RestService() {
        }

        function HdfsLoader() {
            var remoteUrl = '/hw/module/';
            var apiVersion = "v1.0";
            var baseUrl = "hdfs-web/api/" + apiVersion + "/";
            var urlTemplates = {
                getFolderListing: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/path{2}",
                createFolder: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/path/{2}?operation=mkdir&overwrite=false",
                deleteItem: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/path/{2}",
                deleteItems: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/batch?operation=delete",
                moveItem: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/path/{2}?operation=move&to={3}&overwrite=true",
                moveItems: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/batch?operation=move&to={2}&overwrite=true",
                copyItem: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/path/{2}?operation=copy&to={3}&overwrite=true",
                copyItems: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/batch?operation=copy&to={2}&overwrite=true",
                updateItem: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/path/{2}?operation=update&recursive={3}",
                updateItems: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/batch?operation=update&recursive={2}",
                saveItem: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/path/{2}?operation=write&overwrite=true",
                uploadFile: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/path/{2}?operation=upload&overwrite=true",
                readFile: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/path/{2}?operation=read",
                downloadFile: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/path/{2}?operation=download",
                updateFileContent: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/path/{2}?operation=write&overwrite=true",
                currentUser: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/HDFS/currentUser",
                users: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/users"
            };

            this.getFolderListing = function (source, path, user) {
                var url = stringFormat(urlTemplates.getFolderListing, source.platform.id, source.cluster.id, path);
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id, false);
                }

                return API.get(url);
            };

            this.createFile = function (source, path, user) {
                var url = stringFormat(urlTemplates.saveItem, source.platform.id, source.cluster.id, path);
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return API.put(url, {
                    content: ""
                });
            };

            this.getCurrentUser = function (source) {
                return API.put(stringFormat(urlTemplates.currentUser, source.platform.id, source.cluster.id));
            };

            this.getUsers = function (source) {
                return API.get(stringFormat(urlTemplates.users, source.platform.id, source.cluster.id));
            };

            this.createFolder = function (source, path, user) {
                var url = stringFormat(urlTemplates.createFolder, source.platform.id, source.cluster.id, path);
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return API.post(url);
            };

            this.readFile = function (source, path, offset, length, user) {
                var url = stringFormat(urlTemplates.readFile, source.platform.id, source.cluster.id, path);
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return API.get(url, {params: {offset, length}});
            };

            this.updateFileContent = function (source, path, content, user) {
                var url = stringFormat(urlTemplates.updateFileContent, source.platform.id, source.cluster.id, path);
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return API.put(url, {
                    content: content
                });
            };

            this.getUploadFileUrl = function (source, path, user) {
                var url = stringFormat(urlTemplates.uploadFile, source.platform.id, source.cluster.id, path);
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return url;
            };

            this.getDownloadFileUrl = function (source, path, user) {
                var url = stringFormat(urlTemplates.downloadFile, source.platform.id, source.cluster.id, path);
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return url;
            };

            this.deleteItems = function (source, paths, user) {
                var url = stringFormat(urlTemplates.deleteItems, source.platform.id, source.cluster.id);
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return API.post(url, {files: paths});
            };

            this.deleteItem = function (source, path, user) {
                var url = stringFormat(urlTemplates.deleteItem, source.platform.id, source.cluster.id, path);
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id, false);
                }

                return API.delete(url);
            };

            this.moveItem = function (source, pathFrom, pathTo, user) {
                var url = stringFormat(urlTemplates.moveItem, source.platform.id, source.cluster.id, pathFrom, fixedEncodeURIComponent(pathTo));
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return API.post(url);
            };

            this.moveItems = function (source, paths, pathTo, user) {
                var url = stringFormat(urlTemplates.moveItems, source.platform.id, source.cluster.id, fixedEncodeURIComponent(pathTo));
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return API.post(url, {files: paths});
            };

            this.copyItem = function (source, pathFrom, pathTo, user) {
                var url = stringFormat(urlTemplates.copyItem, source.platform.id, source.cluster.id, pathFrom, fixedEncodeURIComponent(pathTo));
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return API.post(url);
            };

            this.copyItems = function (source, paths, pathTo, user) {
                var url = stringFormat(urlTemplates.copyItems, source.platform.id, source.cluster.id, fixedEncodeURIComponent(pathTo));
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return API.post(url, {files: paths});
            };

            this.updateItem = function (source, path, recursive, data, user) {
                var url = stringFormat(urlTemplates.updateItem, source.platform.id, source.cluster.id, path, recursive);
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return API.put(url, data);
            };

            this.updateItems = function (source, paths, recursive, info, user) {
                var data = {
                    files: paths,
                    permissions: info.permissions.toOctal(),
                    owner: info.owner,
                    group: info.group
                };
                var url = stringFormat(urlTemplates.updateItems, source.platform.id, source.cluster.id, recursive);
                if (user && user.id) {
                    url = addUserIdToUrl(url, user.id);
                }

                return API.post(url, data);
            };

            function addUserIdToUrl(url, userId, hasQueryParams = true) {
                if (hasQueryParams) {
                    return url + "&userId=" + userId;
                } else {
                    return url + "?userId=" + userId;
                }
            }
        }

        function OozieLoader() {
            var remoteUrl = '/hw/module/';
            var apiVersion = "v1.0";
            var baseUrl = "oozie-web/api/" + apiVersion + "/";
            var urlTemplates = {
                getFolderListing: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/{2}/workflows{3}?operation=listFiles&path={4}",
                createFolder: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/{2}/workflows{3}?file={4}/&overwrite=false",
                deleteItem: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/{2}/workflows{3}?file={4}",
                saveItem: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/{2}/workflows{3}?file={4}&overwrite=true",
                uploadFile: remoteUrl + baseUrl + "platforms/{0}/clusters/{1}/services/{2}/workflows{3}?file={4}&overwrite=true"
            };


            this.getUploadFileUrl = function (source, path) {
                return stringFormat(urlTemplates.uploadFile, source.platform.id, source.cluster.id, source.service.id, source.path, fixedEncodeURIComponent(path));
            };

            this.getFolderListing = function (source, path) {
                var url = stringFormat(urlTemplates.getFolderListing, source.platform.id, source.cluster.id, source.service.id, source.module.id, fixedEncodeURIComponent(path));
                return API.get(url);
            };

            this.createFile = function (source, path) {
                var url = stringFormat(urlTemplates.saveItem, source.platform.id, source.cluster.id, source.service.id, source.path, fixedEncodeURIComponent(path));
                return API.put(url, {
                    text: ""
                });
            };

            this.createFolder = function (source, path) {
                var url = stringFormat(urlTemplates.createFolder, source.platform.id, source.cluster.id, source.service.id, source.path, fixedEncodeURIComponent(path));
                return API.post(url);
            };

            this.deleteItem = function (source, path) {
                var url = stringFormat(urlTemplates.deleteItem, source.platform.id, source.cluster.id, source.service.id, source.path, fixedEncodeURIComponent(path));
                return API.delete(url);
            };
        }

        function OozieTenantLoader() {
            var baseUrl = "/hw/module/oozie-web/api/v1.0/";
            var urlTemplates = {
                getFolderListing: baseUrl + "templates/workflows/{0}?operation=listFiles&path={1}",
                createFolder: baseUrl + "templates/workflows/{0}?file={1}/&overwrite=false",
                deleteItem: baseUrl + "templates/workflows/{0}?file={1}",
                saveItem: baseUrl + "templates/workflows/{0}?file={1}&overwrite=true",
                uploadFile: baseUrl + "templates/workflows/{0}?file={1}&overwrite=true"
            };

            this.getFolderListing = function (source, path) {
                var url = stringFormat(urlTemplates.getFolderListing, source.componentId, fixedEncodeURIComponent(path));
                return API.get(url);
            };

            this.getUploadFileUrl = function (source, path) {
                return stringFormat(urlTemplates.uploadFile, source.componentId, fixedEncodeURIComponent(path));
            };

            this.createFile = function (source, path) {
                var url = stringFormat(urlTemplates.saveItem, source.componentId, fixedEncodeURIComponent(path));
                return API.put(url, {
                    text: ""
                });
            };

            this.createFolder = function (source, path) {
                var url = stringFormat(urlTemplates.createFolder, source.componentId, fixedEncodeURIComponent(path));
                return API.post(url);
            };

            this.deleteItem = function (source, path) {
                var url = stringFormat(urlTemplates.deleteItem, source.componentId, fixedEncodeURIComponent(path));
                return API.delete(url);
            };
        }

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
        function fixedEncodeURIComponent(str) {
            return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
                return '%' + c.charCodeAt(0).toString(16);
            });
        }

        return RestService;
    }


});
