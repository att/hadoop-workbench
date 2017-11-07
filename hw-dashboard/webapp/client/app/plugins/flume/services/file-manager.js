define(function (require) {
    "use strict";

    require('../ngModule').factory('flume.FileManager', getFileManager);

    getFileManager.$inject = ["flume.restService", "file-browser.file-helper", "$q", "$rootScope"];

    function getFileManager(restService, fileHelper, $q, $rootScope) {

        function FileManager(source) {
            this._source = source;
            this._files = [];
            //TODO(maximk): this line causes infinite digest loop - figure out why
            //this._events = $rootScope.$new(true);
            this._eventListeners = [];
        }

        FileManager.EVENTS = {
            FILES_UPDATED: 'file-manager-files-updated',
            REQUESTING: 'file-manager-requesting',
            FILE_DELETED: 'file-manager-file-deleted',
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
                return restService.getAgent('v1.0', this._source).then(function (agent) {
                    this._files = agent.files;
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            getFiles: function () {
                return this._files;
            },
            fileExists: function (path) {
                var normalizedPath = path.replace(/^\//, "");
                return this._files.some(function (file) {
                    return file.typeKey !== "dir" && file.path === normalizedPath;
                });
            },
            //TODO(maximk): investigate whether we really need this method, because each file has its method `create`
            createFile: function (fileObject) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return restService.saveFile('v1.0', this._source, fileObject).then(function () {
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
                return restService.removeFile('v1.0', this._source, fileObject.path).then(function () {
                    fileHelper.removeFile(fileObject.path, this._files);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                    this.trigger(FileManager.EVENTS.FILE_DELETED, fileObject);
                }.bind(this));
            },
            renameFile: function (info) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return restService.renameOrMoveFile('v1.0', this._source, info.from, info.to).then(function (newFile) {
                    fileHelper.renameFile(fileHelper.findFile(info.from, this._files, false), newFile, this._files);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            renameFolder: function (info) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return restService.renameOrMoveFolder('v1.0', this._source, info.from, info.to).then(function (newFolder) {
                    fileHelper.renameFolder(fileHelper.findFile(info.from, this._files, true), newFolder, this._files);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            createFolder: function (path) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return restService.createFolder('v1.0', this._source, path).then(function (folder) {
                    this._files.push(folder);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            deleteFolder: function (fileObject) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return restService.removeFolder('v1.0', this._source, fileObject.path).then(function () {
                    fileHelper.removeFolder(fileObject.path, this._files);
                    this.trigger(FileManager.EVENTS.REQUESTING, false);
                    this.trigger(FileManager.EVENTS.FILES_UPDATED, this._files);
                }.bind(this));
            },
            uploadFile: function (file, path) {
                return this._uploadFile(file, path);
            },
            _uploadFile: function (file, path) {
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                var self = this;
                return $q(function (resolve, reject) {
                    file.url = restService.getUploadFileUrl('v1.0', self._source, path);
                    file.onSuccess = function (response) {
                        // updating files to get file size for the uploaded file
                        // Does flume Backend not returns uploaded file size ???
                        // It returns. 
                        self.updateFiles().then(function () {
                            resolve(response);
                        });
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