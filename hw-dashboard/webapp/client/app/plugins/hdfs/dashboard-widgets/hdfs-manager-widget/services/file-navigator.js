define(function (require) {
    "use strict";

    require("../ngModule").factory("hdfs.FileNavigator", getFileNavigator);
    var ng = require("angular");

    getFileNavigator.$inject = ["hdfs.Item", "$rootScope"];
    function getFileNavigator(Item, $rootScope) {

        function FileNavigator(restService, source) {
            this.restService = restService;
            this.source = source;
            this.fileList = [];
            this.currentFolder = null;
            this._currentPath = [];
            this.events = $rootScope.$new(true);
            this.requesting = false;
        }

        FileNavigator.EVENTS = {
            FILES_UPDATED: 0,
            PATH_UPDATED: 1,
            REQUESTING: 2
        };

        FileNavigator.prototype = {
            get isRoot() {
                return this._currentPath.length === 0;
            },
            get currentPath() {
                return this._currentPath;
            },
            get currentPathAsString() {
                return "/" + this._currentPath.join("/");
            },
            set currentPath(path) {
                if (typeof path === "string" && path.length > 0 && path !== "/") {
                    var normalized = path.replace(/^\//, "");
                    this._currentPath = normalized.split('/');
                } else {
                    this._currentPath = [];
                }
            },

            on: function (event, callback) {
                this.events.$on(event, callback);
            },
            trigger: function (event, data) {
                this.events.$broadcast(event, data);
            },

            refresh: function (user) {
                var path = "/" + this._currentPath.join("/");
                this.trigger(FileNavigator.EVENTS.PATH_UPDATED, ng.extend([], this._currentPath));

                this.fileList.length = 0;
                this.requesting = true;
                this.trigger(FileNavigator.EVENTS.REQUESTING, this.requesting);

                var self = this;
                return this.restService.getFolderListing(this.source, path, user)
                    .then(function (currentFolder) {
                        currentFolder.label = ".";
                        currentFolder.isCurrentFolder = true;
                        self.currentFolder = Item.factory(self.restService, currentFolder, self.source);

                        currentFolder.children.forEach(function (item) {
                            self.fileList.push(Item.factory(self.restService, item, self.source));
                        });
                        self.trigger(FileNavigator.EVENTS.FILES_UPDATED, {
                            items: ng.extend([], self.fileList),
                            currentFolder: Object.setPrototypeOf(ng.extend({}, self.currentFolder), Object.getPrototypeOf(self.currentFolder))
                        });
                    })
                    .finally(function () {
                        self.requesting = false;
                        self.trigger(FileNavigator.EVENTS.REQUESTING, self.requesting);
                    });
            },
            itemExists: function (name, type) {
                return this.fileList.some(function (item) {
                    return item.name === name && item.type === type;
                });
            },
            checkPath: function (path) {
                var self = this;
                return this.restService.getFolderListing(this.source, path).then(function (data) {
                    var item = Item.factory(self.restService, data, self.source);
                    return {
                        exists: true,
                        item: item
                    };
                }).catch(function () {
                    return {
                        exists: false,
                        item: null
                    };
                });
            },
            getDownloadFileUrl: function (item, user) {
                return this.restService.getDownloadFileUrl(this.source, item.fullPath, user);
            }
        };

        return FileNavigator;
    }
});
