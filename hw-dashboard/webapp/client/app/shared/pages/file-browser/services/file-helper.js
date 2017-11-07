define(function (require) {
    "use strict";

    //TODO(maximk): this helper is redundant and should be merged into file manager

    require('../ngModule').service('file-browser.file-helper', function FileHelper() {
        this.renameFolder = function (fromFolder, toFolder, files) {
            if (fromFolder && toFolder) {
                var oldPath = this.normalizePath(fromFolder.path, true);
                var newPath = this.normalizePath(toFolder.path, true);

                var index = files.indexOf(fromFolder);
                if (index > -1) {
                    files.splice(index, 1);
                    files.push(toFolder);
                }
                files.forEach(function (file) {
                    var regExp = new RegExp('^' + oldPath);
                    var path = this.normalizePath(file.path);
                    file.path = path.replace(regExp, newPath);
                }.bind(this));
            }
        }.bind(this);

        this.removeFile = function (path, files) {
            var file = this.findFile(path, files, false);
            if (file) {
                var index = files.indexOf(file);
                if (index > -1) {
                    files.splice(index, 1);
                }
            }
        }.bind(this);

        this.removeFolder = function (path, files) {
            var folder = this.findFile(path, files, true);
            if (folder) {
                var index = files.indexOf(folder);
                if (index > -1) {
                    files.splice(index, 1);
                }
                var normalizedPath = this.normalizePath(path);
                for (var i = files.length - 1; i >= 0; i -= 1) {
                    var file = files[i];
                    // replaced regexp `new RegExp('^' + normalizedPath)` because it requires parenthesis escaping
                    if (this.normalizePath(file.path).indexOf(normalizedPath) === 0) {
                        files.splice(i, 1);
                    }
                }
            }
        }.bind(this);

        this.renameFile = function (fromFile, toFile, files) {
            if (fromFile) {
                var index = files.indexOf(fromFile);
                if (index > -1) {
                    files.splice(index, 1);
                    files.push(toFile);
                }
            }
        }.bind(this);

        this.normalizePath = function (path, isFolder) {
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
        }.bind(this);

        this.findFile = function (path, files, isFolder) {
            var normalizedPath = this.normalizePath(path, isFolder);
            return files.filter(function (f) {
                var filePath = this.normalizePath(f.path, isFolder);
                return filePath === normalizedPath;
            }.bind(this))[0];
        }.bind(this);

        this.findFilesInFolder = function (path, files, flatten) {
            path = this.normalizePath(path, true);
            return files.filter(function (file) {
                if (flatten) {
                    return new RegExp('^' + path + '.{0,}[^/]$').test(this.normalizePath(file.path));
                } else {
                    return new RegExp('^' + path + '[^/]+$').test(this.normalizePath(file.path));
                }
            }.bind(this));
        }.bind(this);
    });
});
