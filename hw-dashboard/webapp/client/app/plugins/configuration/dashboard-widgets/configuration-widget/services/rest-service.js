/*jshint maxparams: 7*/
define(function (require) {
    "use strict";

    require("../ngModule").service("configuration.restService", RestService);

    RestService.$inject = [
        "core.API",
        "$q",
        "core.utils.string-format"
    ];

    function RestService(API, $q, stringFormat) {

        var baseUrl = "/hw/module/admin-web/api/v1.0/admin/conf";

        var urlTemplates = {
            getAllFiles: baseUrl + "?operation=list",
            getFile: baseUrl + "?file={0}",
            saveFile: baseUrl + "?file={0}&overwrite=true",
            uploadFileUrl: baseUrl + "?file={0}&overwrite=true",
            renameFile: baseUrl + "?file={0}&to={1}&overwrite=true",
            deleteFile: baseUrl + "?file={0}",
            renameFolder: baseUrl + "?file={0}&to={1}&overwrite=true",
            deleteFolder: baseUrl + "?file={0}"
        };

        this.getAllFiles = function () {
            return API.get(urlTemplates.getAllFiles);
        };

        this.getFile = function (path) {
            var url = stringFormat(urlTemplates.getFile, path);
            return API.get(url);
        };

        this.saveFile = function (path, content) {
            var url = stringFormat(urlTemplates.saveFile, path);
            return API.put(url, {
                text: content,
                global: {}
            });
        };

        this.getUploadFileUrl = function (path) {
            return stringFormat(urlTemplates.uploadFileUrl, path);
        };

        this.renameFile = function (fromPath, toPath) {
            var url = stringFormat(urlTemplates.renameFile, fromPath, toPath);
            return API.post(url);
        };

        this.deleteFile = function (path) {
            var url = stringFormat(urlTemplates.deleteFolder, path);
            return API.delete(url);
        };

        this.createFolder = function (path) {
            if (!/\/$/.test(path)) {
                path += '/';
            }
            var url = stringFormat(urlTemplates.saveFile, path);
            return API.post(url);
        };

        this.renameFolder = function (fromPath, toPath) {
            if (!/\/$/.test(fromPath)) {
                fromPath += '/';
            }

            if (!/\/$/.test(toPath)) {
                toPath += '/';
            }

            var url = stringFormat(urlTemplates.renameFolder, fromPath, toPath);
            return API.post(url);
        };

        this.deleteFolder = function (path) {
            if (!/\/$/.test(path)) {
                path += '/';
            }
            var url = stringFormat(urlTemplates.deleteFolder, path);
            return API.delete(url);
        };
    }

});