define(function (require) {
    "use strict";

    require("../ngModule").factory("hdfs.Item", getItem);
    var ng = require("angular");
    var xDate = require("xDate");

    getItem.$inject = ["hdfs.Chmod", "$q"];
    function getItem(Chmod, $q) {

        function Item(data) {
            this.name = data.name;
            this.label = data.label;
            this.path = data.path;
            this.type = data.type;
            this.bytes = data.bytes;
            this.owner = data.owner;
            this.group = data.group;
            this.date = data.date;
            this.permissions = data.permissions;
            this.source = null;
            this.isCurrentFolder = data.isCurrentFolder;
        }

        Item.factory = function (restService, json, source) {
            var data = ng.extend({
                name: json.name,
                label: json.label || json.name,
                path: "",
                type: json.type,
                size: 0,
                owner: "",
                group: "",
                permissions: "000",
                modificationTime: 0,
                isCurrentFolder: false
            }, json);


            try {
                data.permissions = new Chmod(data.permissions);
            } catch (e) {
                console.error("Permission " + data.permissions + " is invalid for the file " + data.name);
                data.permissions = {
                    toCode: function () {
                        return "";
                    }
                };
            }
            data.date = xDate(data.modificationTime, true);
            data.bytes = data.size;

            // path should be full path
            var isRoot = (data.path.match(/\//g) || []).length < 2;
            data.path = isRoot ? "" : data.path.substring(0, data.path.lastIndexOf("/"));

            var item = new Item(data);
            item.source = source;
            item.restService = restService;

            return item;
        };

        Item.prototype = {
            get isFolder() {
                return this.type === 'DIR';
            },
            get isEditable() {
                //return !this.isFolder && fileManagerConfig.isEditableFilePattern.test(this.model.name);
            },
            get size() {
                if (this.bytes === 0) {
                    return this.type === "DIR" ? "" : "0 Bytes";
                } else {
                    return formatBytes(this.bytes);
                }
            },
            get fullPath() {
                return this.path + "/" + this.name;
            },

            create: function (user) {
                if (this.type === "DIR") {
                    return this.restService.createFolder(this.source, this.fullPath, user);
                } else {
                    return this.restService.createFile(this.source, this.fullPath, user);
                }
            },
            delete: function (user) {
                return this.restService.deleteItem(this.source, this.fullPath, user);
            },
            rename: function (name, user) {
                var newPath = this.path + "/" + name;
                return this.restService.moveItem(this.source, this.fullPath, newPath, user);
            },
            update: function (content, user) {
                return this.restService.updateFileContent(this.source, this.fullPath, content, user);
            },
            move: function (path, user) {
                var newPath = path + "/" + this.name;
                return this.restService.moveItem(this.source, this.fullPath, newPath, user);
            },
            copy: function (path, user) {
                var newPath = path + "/" + this.name;
                return this.restService.copyItem(this.source, this.fullPath, newPath, user);
            },
            chown: function (item, recursive, user) {
                var data = {
                    owner: item.owner,
                    group: item.group,
                    recursive: recursive
                };
                return this.restService.updateItem(this.source, this.fullPath, recursive, data, user);
            },
            chmod: function (item, recursive, user) {
                var data = {
                    permissions: item.permissions.toOctal(),
                    recursive: recursive
                };
                return this.restService.updateItem(this.source, this.fullPath, recursive, data, user);
            },
            upload: function (uploader, user) {
                return $q(function (resolve, reject) {
                    uploader.url = this.restService.getUploadFileUrl(this.source, this.fullPath, user);
                    uploader.onSuccess = function (response) {
                        resolve();
                    };
                    uploader.onError = function (response, status, headers) {
                        reject(response);
                    };
                    uploader.upload();
                }.bind(this));
            },
            read: function (offset, size, user) {
                return this.restService.readFile(this.source, this.fullPath, offset, size, user);
            }
        };

        //http://stackoverflow.com/a/18650828/2545680
        function formatBytes(bytes, decimals) {
            var k = 1000;
            var dm = decimals + 1 || 3;
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            var value = (bytes / Math.pow(k, i));
            return (i === 0 ? value : value.toPrecision(dm)) + ' ' + sizes[i];
        }

        return Item;
    }
});