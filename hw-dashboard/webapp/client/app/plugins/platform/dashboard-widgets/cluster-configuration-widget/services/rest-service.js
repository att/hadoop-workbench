/*jshint maxparams: 7*/
define(function (require) {
    "use strict";

    require("../ngModule").service("cluster-configuration.restService", RestService);

    RestService.$inject = [
        "core.API",
        "$q",
        "core.utils.string-format"
    ];

    function RestService(API, $q, stringFormat) {

        var baseUrl = "/hw/module/admin-web/api/v1.0/platforms/{0}/clusters/{1}/conf";

        var urlTemplates = {
            getAllFiles: baseUrl + "?operation=list",
            getFile: baseUrl + "?file={2}",
            saveFile: baseUrl + "?file={2}&overwrite=true",
            uploadFileUrl: baseUrl + "?file={2}&overwrite=true",
            renameFile: baseUrl + "?file={2}&to={3}&overwrite=true",
            deleteFile: baseUrl + "?file={2}",
            renameFolder: baseUrl + "?file={2}&to={3}&overwrite=true",
            deleteFolder: baseUrl + "?file={2}"
        };

        var self = this;

        self.platformId = '';
        self.clusterId = '';

        this.setClusterCredentials = function (platformId, clusterId) {
            self.platformId = platformId;
            self.clusterId = clusterId;
        };

        this.getAllFiles = function () {
            var url = stringFormat(urlTemplates.getAllFiles, self.platformId, self.clusterId);
            return API.get(url);
        };

        this.getFile = function (path) {
            var url = stringFormat(urlTemplates.getFile, self.platformId, self.clusterId, path);
            return API.get(url);
        };

        this.saveFile = function (path, content) {
            var url = stringFormat(urlTemplates.saveFile, self.platformId, self.clusterId, path);
            return API.put(url, {
                text: content,
                global: {}
            });
        };

        this.getUploadFileUrl = function (path) {
            return stringFormat(urlTemplates.uploadFileUrl, self.platformId, self.clusterId, path);
        };

        this.renameFile = function (fromPath, toPath) {
            var url = stringFormat(urlTemplates.renameFile, self.platformId, self.clusterId, fromPath, toPath);
            return API.post(url);
        };

        this.deleteFile = function (path) {
            var url = stringFormat(urlTemplates.deleteFolder, self.platformId, self.clusterId, path);
            return API.delete(url);
        };

        this.createFolder = function (path) {
            if (!/\/$/.test(path)) {
                path += '/';
            }
            var url = stringFormat(urlTemplates.saveFile, self.platformId, self.clusterId, path);
            return API.post(url);
        };

        this.renameFolder = function (fromPath, toPath) {
            if (!/\/$/.test(fromPath)) {
                fromPath += '/';
            }

            if (!/\/$/.test(toPath)) {
                toPath += '/';
            }

            var url = stringFormat(urlTemplates.renameFolder, self.platformId, self.clusterId, fromPath, toPath);
            return API.post(url);
        };

        this.deleteFolder = function (path) {
            if (!/\/$/.test(path)) {
                path += '/';
            }
            var url = stringFormat(urlTemplates.deleteFolder, self.platformId, self.clusterId, path);
            return API.delete(url);
        };
    }

});