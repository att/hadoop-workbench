define(function (require) {
    "use strict";

    var ng = require('angular');
    var $ = require('jquery');
    require('../ngModule').controller('shared.pages.FileBrowserController', Controller);

    Controller.$inject = [
        '$scope',
        'fileManager',
        'isReadonly',
        'FileUploader',
        'main.alerts.alertsManagerService',
        '$timeout',
        'core.widgetUiControl',
        'shared.pages.fileBrowser.widgetUiActions'
    ];
    function Controller($scope, fileManager, isReadonly, FileUploader, alertsManager, $timeout, widgetUiControl, widgetUiActions) {
        //scope fields

        fileManager.on('file-manager-requesting', function (event, requesting) {
            $scope.showPreloader = requesting;
        });

        fileManager.on('file-manager-files-updated', function (event, files) {
            var newTree = organizeFilesToTree(files);
            /* Compare nodes by their paths and for all matched nodes use an old one to avoid collapsing the tree */
            $scope.tree = compareAndUseOld(newTree, $scope.tree || []);

            function compareAndUseOld(newTree, oldTree) {
                var oldPathNodes = {};
                oldTree.forEach(function (n) {
                    oldPathNodes[n.data.path] = n;
                });
                return newTree.map(function (n) {
                    var oldNode = oldPathNodes[n.data.path];
                    if (oldNode && ng.equals(n.data, oldNode.data)) {
                        if (oldNode.children) {
                            oldNode.children = compareAndUseOld(n.children, oldNode.children);
                        }
                        oldNode.data = n.data;
                        return oldNode;
                    } else {
                        return n;
                    }
                });
            }
        });


        var files = fileManager.getFiles();
        fileManager.updateFiles();
        ng.extend($scope, {
            files: files,
            tree: organizeFilesToTree(files),
            item: null,
            expandedNodes: [],
            isReadonly: isReadonly,
            treeOptions: {
                nodeChildren: "children",
                dirSelectable: false,
                injectClasses: {
                    ul: "b-file-browser__tree__children",
                    li: "b-file-browser__tree__children__node",
                    liSelected: "b-file-browser__tree__children__node_selected",
                    iExpanded: "b-file-browser__tree__children__node__icon b-file-browser__tree__children__node__icon_folder-open",
                    iCollapsed: "b-file-browser__tree__children__node__icon b-file-browser__tree__children__node__icon_folder-close",
                    iLeaf: "b-file-browser__tree__children__node__icon b-file-browser__tree__children__node__icon_file",
                    label: "b-file-browser__tree__children__node__label",
                    labelSelected: "b-file-browser__tree__children__node__label_selected"
                },
                equality: function (node1, node2) {
                    return node1 === node2;
                },
                isLeaf: function (node) {
                    return !node.isDir;
                }
            },
            contextMenuId: $.guid,
            contextMenuItem: null,
            rootMenuItem: folder('/', '/', {
                path: '/'
            }),
            fileUploader: new FileUploader({
                queueLimit: 1,
                autoUpload: false,
                removeAfterUpload: true,
                headers: {
                    Authorization: localStorage.token
                },
                onAfterAddingFile: function (fileItem) {
                    var menuItem = $scope.contextMenuItem || $scope.rootMenuItem;
                    var urlContainer = {
                        path: menuItem.data.path,
                        file: fileItem
                    };
                    var path = urlContainer.path.replace(/\/$/, "") + "/" + urlContainer.file.file.name;
                    uploadFile(path, urlContainer.file);
                }
            }),
            isRootMenuOpen: false,
            showPreloader: true
        });

        //scope methods
        ng.extend($scope, {
            openFile: function (file) {
                $scope.$emit('open-file.file-browser', file);
            },
            nodeSelected: function (node) {
                if (!node.isDir && node.data && !/\/$/.test(node.data.path)) {
                    $scope.openFile(node.data);
                }
            },
            openFileByPath: function (filePath) {
                var file = fileManager.getFile(filePath);
                var node = findNodeByFile(file);
                $scope.selectedNode = node;
                $scope.setNodeToContextMenuItem(node);
            },
            hideFileBrowser: function () {
                $scope.item = null;
                $scope.$emit('hide.left-tab-panel');
            },
            deleteFileNode: function (node) {
                var path = node.data.path;
                fileManager.deleteFile({path: path, text: ''}).then(function () {
                    alertsManager.addAlertSuccess({
                        title: 'Success',
                        text: 'File "' + path + '" has been successfully deleted.'
                    });
                });
            },
            deleteFolderNode: function (node) {
                var path = node.data.path;
                fileManager.deleteFolder({path: path, text: ''}).then(function () {
                    alertsManager.addAlertSuccess({
                        title: 'Success',
                        text: 'Folder "' + path + '" has been successfully deleted.'
                    });
                });
            },
            toggleRootMenu: function () {
                if ($scope.isRootMenuOpen) {
                    $scope.hideRootMenu();
                } else {
                    $scope.openRootMenu();
                }
            },
            openRootMenu: function () {
                $scope.isRootMenuOpen = true;
                $scope.contextMenuItem = null;
            },
            hideRootMenu: function () {
                $scope.isRootMenuOpen = false;
            },
            contextMenuCommands: {
                openFile: function () {
                    $scope.nodeSelected($scope.contextMenuItem);
                },
                createFile: function () {
                    $scope.showEditItemForm({data: {type: "file", path: ""}});
                },
                createFolder: function () {
                    $scope.showEditItemForm({data: {type: "dir", path: ""}});
                },
                deleteFile: function () {
                    var node = $scope.contextMenuItem;
                    alertsManager.addAlertInfo({
                        type: "confirm",
                        title: 'Confirmation',
                        text: 'Are you sure you want to delete file "' + $scope.contextMenuItem.data.path + '"?',
                        buttons: [
                            {
                                text: "Yes",
                                style: "action",
                                action: function (close) {
                                    close();
                                    $scope.deleteFileNode(node);
                                }
                            },
                            {
                                text: "No",
                                style: "cancel",
                                action: function (close) {
                                    close();
                                }
                            }]
                    });
                },
                deleteFolder: function () {
                    var node = $scope.contextMenuItem;
                    alertsManager.addAlertInfo({
                        type: "confirm",
                        title: 'Confirmation',
                        text: 'Are you sure you want to delete folder "' + $scope.contextMenuItem.data.path + '"?',
                        buttons: [
                            {
                                text: "Yes",
                                style: "action",
                                action: function (close) {
                                    close();
                                    $scope.deleteFolderNode(node);
                                }
                            },
                            {
                                text: "No",
                                style: "cancel",
                                action: function (close) {
                                    close();
                                }
                            }]
                    });
                },
                renameFile: function () {
                    $scope.showEditItemForm($scope.contextMenuItem);
                },
                renameFolder: function () {
                    $scope.showEditItemForm($scope.contextMenuItem);
                }
            },
            setNodeToContextMenuItem: function (node) {
                $scope.contextMenuItem = node;
            },
            cleanUpContextMenuItem: function (node) {
                $timeout(function () {
                    $scope.contextMenuItem = null;
                });
            },
            showEditItemForm: function (item) {
                $scope.item = {
                    isNew: item.data.path === "",
                    path: item.data.path,
                    type: item.data.type === "file" ? "file" : "dir"
                };
            },
            hideEditItemForm: function () {
                $scope.item = null;
            },
            saveItem: function () {
                if ($scope.item.isNew) {
                    createItem();
                } else {
                    updateItem();
                }
                $scope.item = null;
            }
        });

        widgetUiControl.on(widgetUiActions.HIGHLIGHT_FILE, callbackHighlightFileEvent);

        function organizeFilesToTree(files) {
            var root = folder('Root', '/');
            files.forEach(function (fileObj) {
                var splitPath = fileObj.path.split('/');
                var currentFolder = root;
                var fileName = '';
                if (fileObj.type.toLowerCase() === 'file') {
                    fileName = splitPath.pop();
                }
                var pathToFolder = '';
                if (splitPath.length > 0) {
                    for (var i = 0; i < splitPath.length; i += 1) {
                        var folderName = splitPath[i];
                        if (!folderName) {
                            continue;
                        }
                        pathToFolder += folderName + '/';
                        var existFolder = currentFolder.children.filter(function (f) {
                            return f.name === folderName;
                        })[0];
                        if (existFolder) {
                            currentFolder = existFolder;
                        } else {
                            var newFolder = folder(folderName, pathToFolder, fileObj);
                            currentFolder.children.push(newFolder);
                            currentFolder = newFolder;
                        }
                    }
                }
                if (fileName) {
                    currentFolder.children.push(file(fileName, fileObj));
                }
                currentFolder.children.sort(function (a, b) {
                    return a.data.type.toLowerCase() !== 'dir';
                });
            });
            root.children.sort(function (a, b) {
                return a.data.type.toLowerCase() !== 'dir';
            });
            return root.children;
        }


        function callbackHighlightFileEvent(event, filePath) {
            $scope.openFileByPath(filePath);
        }

        function findNodeByFile(file) {
            return traverse($scope.tree,  file.path.split('/'), true);

            function traverse(root, nameArray, isRoot) {
                if (!nameArray.length) {
                    return root;
                }
                var children = isRoot ? root : root.children;
                if (nameArray.length && children && children.length) {

                    $scope.expandedNodes.push(root);
                    var name = nameArray.shift();
                    var nextChildrenArray = children.filter(function(node) {
                        return node.name == name;
                    });
                    return traverse(nextChildrenArray[0], nameArray);
                } else {
                    return children[0];
                }
            }
        }

        function folder(name, pathToFolder, data) {
            return {
                data: data,
                name: name || '',
                children: [],
                pathToFolder: pathToFolder,
                isDir: true
            };
        }

        function file(name, fileObj) {
            return {
                data: fileObj,
                name: name || '',
                path: fileObj.path
            };
        }

        function uploadFile(path, file) {
            var existingFile = fileManager.fileExists(path);
            if (existingFile) {
                alertsManager.addAlertWarning({
                    title: 'Warning',
                    text: 'A file with such name is already uploaded. Do you want to replace it?',
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                fileManager.uploadFile(file, path).then(function () {
                                    alertsManager.addAlertSuccess({
                                        title: 'Success',
                                        text: 'File "' + path + '" has been successfully uploaded.'
                                    });
                                }).catch(function (response) {
                                    alertsManager.addAlertError({
                                        title: 'Error',
                                        text: 'File "' + path + '" has not been uploaded because of error: ' + response.message
                                    });
                                });
                            }
                        },
                        {
                            text: "No",
                            style: "cancel",
                            action: function (close) {
                                close();
                                file.remove();
                            }
                        }
                    ]
                });
            } else {
                fileManager.uploadFile(file, path).then(function () {
                    alertsManager.addAlertSuccess({
                        title: 'Success',
                        text: 'File "' + path + '" has been successfully uploaded.'
                    });
                }).catch(function (response) {
                    alertsManager.addAlertError({
                        title: 'Error',
                        text: 'File "' + path + '" has not been uploaded because of error: ' + response.message
                    });
                });
            }
        }

        function createItem() {
            var menuItem = $scope.contextMenuItem || $scope.rootMenuItem;
            var path = $scope.item.path.replace(/^(\/)+/g, '');
            if (path) {
                path = menuItem.pathToFolder + path;

                var promise, type;
                if ($scope.item.type === "file") {
                    promise = fileManager.createFile({path: path, text: ''});
                    type = "File";
                } else {
                    promise = fileManager.createFolder(path);
                    type = "Folder";
                }

                promise.then(function () {
                    alertsManager.addAlertSuccess({
                        title: 'Success',
                        text: type + ' "' + path + '" has been successfully created.'
                    });
                }).catch(function (error) {
                    alertsManager.addAlertError({
                        title: 'Error',
                        text: type + ' "' + path + '" has not been created because of the error: ' + error.message
                    });
                });
            }
        }

        function updateItem() {
            var file = $scope.contextMenuItem;
            var newPath = $scope.item.path.replace(/^(\/)+/g, '');
            if (newPath && newPath !== file.data.path) {

                var promise, type;
                if ($scope.item.type === "file") {
                    promise = fileManager.renameFile({from: file.data.path, to: newPath});
                    type = "File";
                } else {
                    promise = fileManager.renameFolder({from: file.data.path, to: newPath});
                    type = "Folder";
                }

                promise.then(function () {
                    alertsManager.addAlertSuccess({
                        title: 'Success',
                        text: type + ' "' + file.data.path + '" has been successfully renamed to "' + newPath + '"'
                    });
                }).catch(function (error) {
                    alertsManager.addAlertError({
                        title: 'Error',
                        text: type + ' "' + file.data.path + '" has not been renamed because of the error: ' + error.message
                    });
                });
            }
        }
    }

});
