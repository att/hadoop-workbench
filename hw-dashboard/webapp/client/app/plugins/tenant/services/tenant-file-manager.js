define(function (require) {
    "use strict";

    require('../../oozie/ngModule').factory('tenant.FileManager', getFileManager);

    getFileManager.$inject = ["file-browser.file-helper", "$q"];

    function getFileManager(fileHelper, $q) {

        function FileManager(containerId, restService) {
            this._containerId = containerId;
            this._restService = restService;
            this._files = [];
            this._eventListeners = [];
        }

        FileManager.EVENTS = {
            FILES_UPDATED: 'file-manager-files-updated',
            REQUESTING: 'file-manager-requesting',
            FILE_DELETED: 'file-manager-file-deleted'
        };

        FileManager.prototype = {
            on: function (eventName, callback) {
                this._eventListeners.push({event: eventName, callback: callback});
                return this._getDeregistrationFn(callback);
            },
            _getDeregistrationFn: function (fn) {
                return function () {
                    var listenerIndex = -1;

                    this._eventListeners.forEach(function (listener, index) {
                        if (fn === listener.callback) {
                            listenerIndex = index;
                        }
                    });

                    if (listenerIndex !== -1) {
                        this._eventListeners.splice(listenerIndex, 1);
                    }
                }.bind(this);
            },
            trigger: function (eventName, data) {
                this._eventListeners.forEach(function (listener) {
                    if (listener.event === eventName) {
                        listener.callback(listener.event, data);
                    }
                });
            },
            init: function (files) {
                this._files = files;
                this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
            },
            updateFiles: function () {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return this._restService.getTenantComponentFiles('v1.0', this._containerId).then(function (files) {
                    this._files = files;
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            getFiles: function () {
                return this._files;
            },
            fileExists: function (path) {
                return this._files.some(function (file) {
                    return file.typeKey !== "dir" && file.path === path;
                });
            },
            //TODO(maximk): investigate whether we really need this method, because each file has its method `create`
            createFile: function (fileObject) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return this._restService.saveTenantFile('v1.0', this._containerId, fileObject).then(function () {
                    this._files.push({
                        path: fileObject.path,
                        typeKey: fileObject.typeKey,
                        type: "file"
                    });
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                    return fileObject;
                }.bind(this));
            },
            deleteFile: function (fileObject) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return this._restService.removeTenantFile('v1.0', this._containerId, fileObject.path).then(function () {
                    fileHelper.removeFile(fileObject.path, this._files);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                    this.trigger(FileManager.EVENTS.FILE_DELETED, fileObject);
                }.bind(this));
            },
            renameFile: function (info) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return this._restService.renameOrMoveTenantFile('v1.0', this._containerId, info.from, info.to).then(function (newFile) {
                    fileHelper.renameFile(fileHelper.findFile(info.from, this._files, false), newFile, this._files);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            uploadFile: function (file, path) {
                return this._uploadFile(file, path);
            },
            _uploadFile: function (file, path) {
                var self = this;
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return $q(function (resolve, reject) {
                    file.url = this._restService.getTenantUploadFileUrl('v1.0', self._containerId, path);
                    file.onSuccess = function (response) {
                        var newFile = response.data;

                        fileHelper.removeFile(newFile.path, self._files);
                        self._files.push({
                            path: newFile.path,
                            type: "file",
                            size: newFile.size
                        });
                        self.trigger(FileManager.EVENTS.REQUESTING, false);
                        self.trigger(FileManager.EVENTS.FILES_UPDATED, self._files);
                        resolve();
                    };
                    file.onError = function (response, status, headers) {
                        reject(response);
                    };
                    file.upload();
                }.bind(this));
            },
            getLibraryFiles: function () {
                return fileHelper.findFilesInFolder('lib/', this._files, true);
            },
            libraryFileExists: function (path) {
                return this.fileExists('/lib/' + path);
            },
            uploadLibraryFile: function (container) {
                var path = "/lib/" + container.file.name;
                return this._uploadFile(container, path);
            },
            renameFolder: function (info) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return this._restService.renameOrMoveTenantFolder('v1.0', this._containerId, info.from, info.to).then(function (newFolder) {
                    fileHelper.renameFolder(fileHelper.findFile(info.from, this._files, true), newFolder, this._files);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            createFolder: function (path) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return this._restService.createTenantFolder('v1.0', this._containerId, path).then(function (folder) {
                    this._files.push(folder);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            deleteFolder: function (fileObject) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return this._restService.removeTenantFolder('v1.0', this._containerId, fileObject.path).then(function () {
                    fileHelper.removeFolder(fileObject.path, this._files);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            getFile: function (path, isFolder) {
                return fileHelper.findFile(path, this._files, isFolder);
            },
            addFile: function (path, typeKey, createFoldersToFile) {
                if (createFoldersToFile) {
                    this._createFoldersToFile(path);
                    this._files.push({path: path, typeKey: typeKey});
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }
            },
            _normalizePath: function (path, isFolder) {
                var leadingSlash = /^\//;
                if (leadingSlash.test(path)) {
                    path = path.replace(leadingSlash, "");
                }
                if (isFolder) {
                    if (!/\/$/.test(path)) {
                        path += '/';
                    }
                }
                return path;
            },
            _createFoldersToFile: function (filePath) {
                var folders = filePath.split("/");
                folders.pop(); // remove file from the list
                var path = "";
                folders.forEach(function (folder) {
                    path += folder;
                    path = this._normalizePath(path, true);
                    if (!this.getFile(path, true)) {
                        this._files.push({path: path, typeKey: "dir"});
                    }
                }.bind(this));
            }
        };

        return FileManager;
    }

});