define(function (require) {
    "use strict";

    require('../ngModule').factory('configuration.FileManager', getFileManager);

    getFileManager.$inject = ["configuration.restService", "file-browser.file-helper", "$q"];

    function getFileManager(restService, fileHelper, $q) {

        function FileManager(files) {
            this._files = files;
            this._eventListeners = [];
        }

        FileManager.EVENTS = {
            FILES_UPDATED: 'file-manager-files-updated',
            REQUESTING: 'file-manager-requesting'
        };

        FileManager.factory = function (files) {
            return new FileManager(files);
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
                return restService.getAllFiles().then(function (filesContainer) {
                    this._files = filesContainer.files;
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            getFiles: function () {
                return this._files;
            },
            fileExists: function (path) {
                if (path === undefined || path === null) {
                    return false;
                }
                var normalizedPath = path.replace(/^\//, "");
                return this._files.some(function (file) {
                    return file.typeKey !== "dir" && file.path === normalizedPath;
                });
            },
            createFile: function (fileObject) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return restService.saveFile(fileObject.path, fileObject.text).then(function () {
                    this._files.push({
                        path: fileObject.path,
                        type: "file"
                    });
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                    return fileObject;
                }.bind(this));
            },
            deleteFile: function (fileObject) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return restService.deleteFile(fileObject.path).then(function () {
                    fileHelper.removeFile(fileObject.path, this._files);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            renameFile: function (info) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                restService.renameFile(info.from, info.to).then(function (newFile) {
                    fileHelper.renameFile(fileHelper.findFile(info.from, this._files, false), newFile, this._files);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            renameFolder: function (info) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                restService.renameFolder(info.from, info.to).then(function (newFolder) {
                    fileHelper.renameFolder(fileHelper.findFile(info.from, this._files, true), newFolder, this._files);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            createFolder: function (path) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return restService.createFolder(path).then(function (folder) {
                    this._files.push(folder);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            deleteFolder: function (fileObject) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return restService.deleteFolder(fileObject.path).then(function () {
                    fileHelper.removeFolder(fileObject.path, this._files);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            getFile: function (path, isFolder) {
                return fileHelper.findFile(path, this._files, isFolder);
            },
            uploadFile: function (file, path) {
                return this._uploadFile(file, path);
            },
            _uploadFile: function (file, path) {
                var self = this;
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return $q(function (resolve, reject) {
                    file.url = restService.getUploadFileUrl(path);
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
                        self.trigger(FileManager.EVENTS.REQUESTING, false);
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