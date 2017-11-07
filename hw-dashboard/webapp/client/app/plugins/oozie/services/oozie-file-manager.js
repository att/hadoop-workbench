// import {getComponentCuidByIdObject} from '../../../reducers/oozieFlatTemplatesAndComponents';

define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('oozie.FileManager', getFileManager);

    getFileManager.$inject = ["oozie.restService", "file-browser.file-helper", "$q", '$ngRedux', 'oozie.redux-actions'];

    function getFileManager(restService, fileHelper, $q, $ngRedux, oozieReduxActions) {

        function FileManager(source) {
            var self = this;

            this._source = source;
            this._files = [];
            this._eventListeners = [];
            this._idObject = getIdObjectFromSource(this._source);
            var lastModule = {
                $meta: null,
                files: null
            };

            init();

            function init() {
                bindStateToScope();
            }

            function bindStateToScope() {
                var unsubscribe = $ngRedux.connect(onStateChange)({});
                // $scope.$on('$destroy', unsubscribe);
            }

            function onStateChange(state) {
                var result = {};
                var module = retrieveComponentByIdObject(state, self._idObject);
                // we need to compare only module.$meta and module.files properties
                if (module) {
                    if (
                        // lastModule != module || // ??? do we need this check ???
                        !ng.equals(module.$meta, lastModule.$meta)
                    ) {

                        // suppose all $meta changes are catch
                        if (!lastModule.busy && module.busy) {
                            self.trigger(FileManager.EVENTS.REQUESTING, true);
                        } else if (lastModule.busy && !module.busy) {
                            self.trigger(FileManager.EVENTS.REQUESTING, false);
                        }
                    }

                    // check file list
                    if (!module.busy && !ng.equals(module.files, lastModule.files) ) {

                        if (module.isFilesWrapped) {
                            self._files = [];
                        } else {
                            self._files = module.files;
                        }

                        self.trigger(FileManager.EVENTS.FILES_UPDATED, self._files);
                    }

                    lastModule = module;
                } else {
                    // nothing ?
                }
                return result;
            }
        }

        FileManager.EVENTS = {
            FILES_UPDATED: 'file-manager-files-updated',
            FILE_DELETED: 'file-manager-file-deleted',
            REQUESTING: 'file-manager-requesting'
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
                let self = this;
                self.trigger(FileManager.EVENTS.REQUESTING, true);

                $ngRedux.dispatch(oozieReduxActions.loadOozieModuleFiles(this._source))
                    .then(function () {
                        self.trigger(FileManager.EVENTS.REQUESTING, false);
                    });
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
                var self = this;
                this.trigger(FileManager.EVENTS.REQUESTING, true);
                return $q(function (resolve, reject) {
                    file.url = restService.getUploadFileUrl('v1.0', self._source, path);
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


        function retrieveComponentByIdObject(state, idObject) {
            let allComponents = state.data.oozie.components;
            let componentInArray = Object.keys(allComponents)
                .filter(cuid => (
                    allComponents[cuid].idObject.platformId === idObject.platformId &&
                    allComponents[cuid].idObject.clusterId === idObject.clusterId &&
                    allComponents[cuid].idObject.componentId === idObject.componentId
                ));

            return componentInArray.length > 0 ? allComponents[componentInArray[0]] : null;
        }

        function getIdObjectFromSource(source) {
            return {
                platformId: source.platform.id,
                clusterId: source.cluster.id,
                componentId: source.module.id
            };
        }

        return FileManager;
    }

});