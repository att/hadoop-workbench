define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').controller('hdfs-manager-widget.IndexController', indexController);

    indexController.$inject = [
        "$scope",
        "$timeout",
        "fileNavigator",
        "hdfs.FileNavigator.EVENTS",
        "config",
        "dashboard-isolated-widget-accessor.WidgetStore",
        "Item",
        "source",
        "$q",
        "core.get-file-uploader",
        "main.alerts.alertsManagerService",
        "currentUser",
        "users",
        "dashboard.WidgetsActions",
        "dashboard-isolated-widget-accessor.WidgetActions",
        "restService",
        "core.utils"
    ];
    function indexController($scope, $timeout, fileNavigator, FileNavigatorEvents, config, WidgetStore, Item, source,
                             $q, getFileUploader, alertsManagerService, currentUser, users, WidgetsActions,
                             WidgetAccessorActions, restService, utils) {

        if (isStandaloneWidget()) {
            var dashboardWidget = WidgetStore.getWidget();
            dashboardWidget.title = (currentUser.available ? currentUser.name + "@" : "") + (source.cluster ? source.cluster.title : "");
            if (!dashboardWidget.title) {
                dashboardWidget.title = "File browser";
            }
            dashboardWidget.secondaryTitle = (source.platform ? source.platform.title : "")  ;
            WidgetAccessorActions.updateWidgetHotkeyBindings(getHotkeyBindings());
        }

        var homeDir, waitingDownload = false, events = config.events, selectedItemsLimit = 50;

        var defaultitemsListLimit = 100;
        var itemsListLimitIncrement = 50;
        var renderVisibilityKey = '_isVisible_' + Math.floor(Math.random() * 100);
        ng.extend($scope, {
            files: [],
            isItemSelector: config.isFileSelector || config.isDirSelector,
            filesFilteredReference: [],
            sortType: '',
            sortReverse: false,
            actionsPadding: config.actions ? '40px' : 0,
            selectedItems: [],
            isRequesting: false,
            downloadUrl: "",
            currentUser: currentUser,
            fileUploader: getFileUploader.create({
                onAfterAddingFile: uploadFile
            }),
            error: "",
            allItemsSelected: false,
            isRoot: fileNavigator.isRoot,
            currentPath: fileNavigator.currentPath,
            currentPathFolder: "",
            config: config,
            selectedFile: {
                item: null,
                text: "",
                options: null
            },
            deleteConfirmationMessage: "",
            isItemsListModeEnabled: true,
            isFileEditorModeEnabled: false,
            isBreadcrumbPathEditModeEnabled: false,
            breadcrumbEditPath: {value: ""},
            isMoveModeEnabled: false,
            isCopyModeEnabled: false,
            itemsBeingMoved: [],
            itemsBeingCopied: [],
            splitWidgets: false,
            selectedPermsOptionType: "owner",
            tempItem: {},
            saveFile: function () {
                var item = $scope.selectedFile.item;
                item.update($scope.selectedFile.text, $scope.currentUser).then(function () {
                    alertsManagerService.addAlertSuccess({
                        title: "HDFS file save",
                        text: "File " + item.fullPath + " has been successfully saved"
                    });
                });
            },
            itemsFilter: {
                searchString: ""
            },
            showCreateActionDropdown: false,
            showChmodChownActionDropdown: false,
            widgets: {
                createItem: {
                    isShown: false
                },
                uploadItem: {
                    isShown: false
                },
                renameItem: {
                    isShown: false
                },
                chown: {
                    isShown: false
                },
                chmod: {
                    isShown: false
                },
                confirmDelete: {
                    isShown: false
                }
            },
            focusedRowIndex: -1,
            focusedRowDirUpIndexConst: -2,        //      binded to HTML template position
            focusedRowHeaderIndexConst: -3,        //      binded to HTML template position
            itemsListLimit: defaultitemsListLimit,
            defaultitemsListLimit: defaultitemsListLimit,
            renderFinished: 0,
            inViewCheckPassed: 0,
            renderVisibilityKey: renderVisibilityKey

        });
        ng.extend($scope, {
            itemClicked: function (item, withoutStateSaving) {

                if (item.isFolder) {
                    if (config.isDirSelector) {
                        // only one dir can be selected if clicked on a file line,
                        // for multiple selections checkboxes should be clicked
                        let event = events.$broadcast('dir-selected', item);
                        if (!event.defaultPrevented) {
                            enableFileEditorMode(item);
                        } else {
                            if (config.actions === false) {
                                $scope.selectedItems.length = 0;
                                $scope.selectedItems.push(item);
                            }
                        }
                    }
                    if (!item.isCurrentFolder) {
                        refreshItems(item.fullPath);
                        if (!withoutStateSaving) {
                            $scope.saveUserState(item.fullPath);
                        }
                    } else {
                        refreshItems();
                    }
                } else {
                    let event = events.$broadcast('file-selected', item);
                    if (!event.defaultPrevented) {
                        enableFileEditorMode(item);
                    } else {
                        // only one file can be selected if clicked on a file line,
                        // for multiple selections checkboxes should be clicked
                        if (config.actions === false) {
                            $scope.selectedItems.length = 0;
                            $scope.selectedItems.push(item);
                        }
                    }
                }
            },
            toggleSelect: function ($event, item) {
                $event.stopPropagation();
                toggleSelectForItem(item);
            },
            toggleSelectEveryItem: function () {
                var allItemsSelected = $scope.files.every(function (file) {
                    return $scope.selectedItems.indexOf(file) !== -1 || file.isCurrentFolder;
                });

                if (allItemsSelected) {
                    $scope.selectedItems.length = 0;
                    $scope.allItemsSelected = false;
                } else {
                    $scope.allItemsSelected = true;
                    $scope.files.forEach(function (file) {
                        if ($scope.selectedItems.indexOf(file) === -1 && !file.isCurrentFolder) {
                            $scope.selectedItems.push(file);
                        }
                    });

                    if ($scope.selectedItems.length > selectedItemsLimit) {
                        alertsManagerService.addAlertWarning({
                            title: 'Selected items limit exceeded',
                            text: `Files operations are not allowed for more than ${selectedItemsLimit} items`
                        })
                    }
                }
            },
            upDir: function () {
                if (!fileNavigator.isRoot) {
                    var path = $scope.currentPath.slice(0, -1).join("/");
                    refreshItems(path);
                    $scope.saveUserState(path);
                }
            },
            goTo: function (index) {
                if ($scope.isFileEditorModeEnabled) {
                    var fileLinkIsClicked = $scope.currentPath.length > 0 && $scope.currentPath.length - 1 === index;
                    if (fileLinkIsClicked) {
                        return;
                    }
                }

                var path = $scope.currentPath.slice(0, index + 1).join("/");
                refreshItems(path);
                $scope.saveUserState(path);
            },
            goToHome: function () {
                refreshItems(homeDir);
                $scope.saveUserState(homeDir);
            },
            editPath: function () {
                $scope.isBreadcrumbPathEditModeEnabled = true;
                $scope.breadcrumbEditPath.value = getCurrentPathAsString();
            },
            exitBreadcrumbPathEditMode: function () {
                $scope.isBreadcrumbPathEditModeEnabled = false;
                $scope.navigateToPath($scope.breadcrumbEditPath.value);
            },
            navigateToPath: function(path) {
                var editPath = path;
                var normalizedEditPath = normalizeEditPath(editPath);
                var valueChanged = getCurrentPathAsString() !== normalizedEditPath;
                if (valueChanged) {
                    if ($scope.isFileEditorModeEnabled) {
                        disableFileEditorMode();
                    }
                    fileNavigator.checkPath(normalizedEditPath).then(function (path) {
                        if (path.exists && path.item.type === "FILE") {
                            enableFileEditorMode(path.item);
                        } else {
                            refreshItems(normalizedEditPath);
                        }
                    });
                }
            },
            toggleActionChmodChownDropdownClicked: function (close) {
                $scope.showChmodChownActionDropdown = ng.isUndefined(close) ? !$scope.showChmodChownActionDropdown : !close;
            },
            hideWidgets: function () {
                ng.forEach($scope.widgets, function (widget, key) {
                    widget.isShown = false;
                });
            },
            actionAllowsMultipleItems: function (action) {
                var actionsAllowMultiple = ["move", "copy", "chmod-chown", "delete"];
                return actionsAllowMultiple.indexOf(action) !== -1;
            },
            isDisabled: function (action) {
                var isDisabled = ($scope.selectedItems.length > 1 && !$scope.actionAllowsMultipleItems(action)) || $scope.selectedItems.length === 0 || $scope.selectedItems.length > selectedItemsLimit || $scope.isMoveModeEnabled || $scope.isCopyModeEnabled;
                if (action === "download") {
                    return isDisabled || ($scope.selectedItems.length === 1 && $scope.selectedItems[0].isFolder);
                } else {
                    return isDisabled;
                }
            },
            hideCreateItemWidget: function () {
                $scope.hideWidgets();
                $scope.tempItem = null;
            },
            showQuickCreateItemWidget: function (type) {
                $scope.displayQuickCreateItemWidget = true;
                $scope.tempItem = {path: "", type: type};
                events.$broadcast('create-item-mode-change', $scope.displayQuickCreateItemWidget);
            },
            hideQuickCreateItemWidget: function () {
                $scope.tempItem = null;
                hideQuickCreateItemWidget();
            },
            showRenameWidget: function () {
                $scope.tempItem = ng.copy($scope.selectedItems[0]);
                showWidget("renameItem");
            },
            showConfirmDeleteWidget: function () {
                showWidget("confirmDelete");
            },
            showChownWidget: function () {
                $scope.tempItem = ng.copy($scope.selectedItems[0]);
                showWidget("chown");
            },
            showChmodWidget: function () {
                $scope.tempItem = ng.copy($scope.selectedItems[0]);
                $scope.selectedPermsOptionType = "owner";
                showWidget("chmod");
            },
            exitMoveMode: function () {
                $scope.isMoveModeEnabled = false;
                $scope.itemsBeingMoved.length = 0;
            },
            exitCopyMode: function () {
                $scope.isCopyModeEnabled = false;
                $scope.itemsBeingCopied.length = 0;
            },
            exitFileEditor: function () {
                disableFileEditorMode();
                // disableFileEditorMode removes file from the scope path
                var path = $scope.currentPath.join("/");
                refreshItems(path);
                $scope.saveUserState(path);
            },
            createItem: function () {
                var type = $scope.tempItem.type;
                var relativePath = $scope.tempItem.path.trim().replace(/^\//, "");
                var name = relativePath.indexOf("/") !== -1 ? relativePath.substr(relativePath.lastIndexOf("/") + 1) : relativePath;
                var relativePathWithoutName = relativePath === name ? relativePath : relativePath.substr(0, relativePath.lastIndexOf("/"));
                var path = getCurrentPathAsString(true) + relativePathWithoutName;

                var item = Item.factory({
                    name: name,
                    path: path,
                    type: type
                }, source);

                if (name && !fileNavigator.itemExists(name, item.type)) {
                    $scope.isRequesting = true;
                    item.create($scope.currentUser).then(function () {
                        events.$broadcast('item-created', item);

                        $scope.hideWidgets();
                        hideQuickCreateItemWidget();

                        if (item.type === "DIR" && config.enterFolderOnCreate) {
                            var pathAsString = $scope.currentPath.length > 0 ? "/" + $scope.currentPath.join("/") + "/" + item.name : "/" + item.name;
                            refreshItems(pathAsString);
                            $scope.saveUserState(pathAsString);
                        } else {
                            refreshItems();
                        }
                    }).catch(function (error) {
                        alertsManagerService.addAlertError({title: "HDFS item create error", text: error.message});
                    }).finally(function () {
                        $scope.isRequesting = false;
                    });
                } else {
                    alertsManagerService.addAlertWarning({
                        title: "HDFS item create error",
                        text: "Item with the name " + name + " already exists!"
                    });
                }
            },
            deleteItems: function () {
                var currentFolder = null;
                $scope.selectedItems.some(function (item) {
                    if (item.isCurrentFolder) {
                        currentFolder = item;
                        return true;
                    }
                    return false;
                });

                $scope.isRequesting = true;
                if (currentFolder !== null) {
                    currentFolder.delete($scope.currentUser).catch(function (error) {
                        alertsManagerService.addAlertError({
                            title: "HDFS folder delete error",
                            text: error.message
                        });
                    }).finally(function () {
                        $scope.isRequesting = false;
                        $scope.upDir();
                        $scope.hideWidgets();
                    });
                } else {
                    var paths = $scope.selectedItems.map((f) => {
                        return f.fullPath;
                    });
                    restService.deleteItems(source, paths, $scope.currentUser).then(function (results) {
                        if (results.filesSuccess.length > 0) {
                            var successMsg = "The following files have been successfully deleted:<br>";
                            results.filesSuccess.forEach((f) => {
                                successMsg = successMsg + f + "<br>";
                            });

                            alertsManagerService.addAlertSuccess({
                                title: "HDFS file delete success",
                                text: successMsg
                            });
                        }

                        if (results.errors.length > 0) {
                            let errorsMsg = "The following errors occurred during the operation:<br>";
                            results.errors.forEach((e) => {
                                errorsMsg = errorsMsg + e + "<br>";
                            });

                            alertsManagerService.addAlertError({
                                title: "HDFS file delete error",
                                text: errorsMsg
                            });
                        }

                        $scope.isRequesting = false;
                        refreshItems();
                        $scope.hideWidgets();
                    });
                }
            },
            quickDeleteItem: function ($event, item) {
                $event.stopPropagation();
                $scope.isRequesting = true;
                item.delete($scope.currentUser).catch(function (error) {
                    alertsManagerService.addAlertError({
                        title: "HDFS file delete error",
                        text: error.message
                    });
                }).finally(function () {
                    $scope.isRequesting = false;
                    refreshItems();
                });
            },
            renameItem: function () {
                var data = $scope.tempItem;
                var item = $scope.selectedItems[0];

                $scope.isRequesting = true;
                item.rename(data.name, $scope.currentUser).then(function () {
                    $scope.hideWidgets();
                    refreshItems();
                }).catch(function (error) {
                    alertsManagerService.addAlertError({title: "HDFS file rename error", text: error.message});
                }).finally(function () {
                    $scope.isRequesting = false;
                });
            },
            updateItems: function () {
                var data = $scope.tempItem;
                var recursive = !!data.recursive;
                var paths = $scope.selectedItems.map((f) => {
                    return f.fullPath;
                });

                $scope.isRequesting = true;
                restService.updateItems(source, paths, recursive, data, $scope.currentUser).then(function (results) {
                    if (results.filesSuccess.length > 0) {
                        var successMsg = "The following files have been successfully updated:<br>";
                        results.filesSuccess.forEach((f) => {
                            successMsg = successMsg + f + "<br>";
                        });

                        alertsManagerService.addAlertSuccess({
                            title: "HDFS file update success",
                            text: successMsg
                        });
                    }

                    if (results.errors.length > 0) {
                        let errorsMsg = "The following errors occurred during the operation:<br>";
                        results.errors.forEach((e) => {
                            errorsMsg = errorsMsg + e + "<br>";
                        });

                        alertsManagerService.addAlertError({
                            title: "HDFS file update error",
                            text: errorsMsg
                        });
                    }

                    $scope.isRequesting = false;
                    refreshItems();
                    $scope.hideWidgets();
                });
            },
            copyItems: function () {
                $scope.isCopyModeEnabled = true;
                $scope.itemsBeingCopied = ng.extend([], $scope.selectedItems);
            },
            moveItems: function () {
                $scope.isMoveModeEnabled = true;
                $scope.itemsBeingMoved = ng.extend([], $scope.selectedItems);
            },
            pasteItems: function () {
                var promise;

                $scope.isRequesting = true;
                if ($scope.isMoveModeEnabled && $scope.itemsBeingMoved[0].path !== getCurrentPathAsString()) {
                    let paths = $scope.itemsBeingMoved.map((f) => {
                        return f.fullPath;
                    });
                    promise = restService.moveItems(source, paths, getCurrentPathAsString(), $scope.currentUser);
                } else if ($scope.isCopyModeEnabled && $scope.itemsBeingCopied[0].path !== getCurrentPathAsString()) {
                    let paths = $scope.itemsBeingCopied.map((f) => {
                        return f.fullPath;
                    });
                    promise = restService.copyItems(source, paths, getCurrentPathAsString(), $scope.currentUser);
                }

                if (promise) {
                    promise.then(function (results) {
                        var operationName = $scope.isMoveModeEnabled ? "move" : "copy";
                        var operationPast = $scope.isMoveModeEnabled ? "moved" : "copied";

                        if (results.filesSuccess.length > 0) {
                            var successMsg = `The following files have been successfully ${operationPast}:<br>`;
                            results.filesSuccess.forEach((f) => {
                                successMsg = successMsg + f + "<br>";
                            });

                            alertsManagerService.addAlertSuccess({
                                title: `HDFS file ${operationName} success`,
                                text: successMsg
                            });
                        }

                        if (results.errors.length > 0) {
                            let errorsMsg = "The following errors occurred during the operation:<br>";
                            results.errors.forEach((e) => {
                                errorsMsg = errorsMsg + e + "<br>";
                            });

                            alertsManagerService.addAlertError({
                                title: `HDFS file ${operationName} error`,
                                text: errorsMsg
                            });
                        }

                        $scope.isRequesting = false;
                        $scope.isMoveModeEnabled = false;
                        $scope.isCopyModeEnabled = false;
                        refreshItems();
                    });
                }
            },
            downloadItem: function () {
                if (waitingDownload) {
                    alertsManagerService.addAlertWarning({
                        title: 'Download in progress',
                        text: 'Cannot perform operation: waiting for previous download to complete'
                    });
                } else {
                    waitingDownload = true;
                    WidgetAccessorActions.updateWidgetProgressBarMessage("Downloading item...");
                    $scope.downloadUrl = fileNavigator.getDownloadFileUrl($scope.selectedItems[0], $scope.currentUser);
                    $scope.selectedItems.length = 0;
                }
            },
            openHdfsBrowserWidget: function () {
                var src = source;
                src.path = getCurrentPathAsString();
                WidgetsActions.addWidget({
                    widgetName: 'hdfs-manager',
                    params: {
                        src: src
                    }
                }, {top: true});
            },
            saveUserState: function (item) {
                // fill user's state (position in file browser)
                if (isStandaloneWidget()) {
                    if (typeof item == 'string') {
                        dashboardWidget.state = {
                            path: (item.charAt(0) == '/' ? '' : '/') + item
                        }
                    } else {
                        dashboardWidget.state = {
                            path: item.path,
                            file: {
                                index: utils.objectInArray($scope.files, item),
                                name: item.name
                            }
                        }
                    }

                    // update user's state in saved global state
                    $scope.$emit('widgetHasBeenChanged', dashboardWidget);
                }
            },
            onFileDownloadSuccess: function () {
                waitingDownload = false;
                WidgetAccessorActions.updateWidgetProgressBarMessage("");
                alertsManagerService.addAlertSuccess({
                    title: 'Success',
                    text: 'File has been successfully downloaded'
                });
            },
            onFileDownloadError: function (error) {
                waitingDownload = false;
                WidgetAccessorActions.updateWidgetProgressBarMessage("");
                alertsManagerService.addAlertError({
                    title: 'Error',
                    text: 'File has not been downloaded because of the error: ' + error.message
                });
            },
            isFileRowSelected: function (index) {
                return $scope.focusedRowIndex == index;
            },
            isDirUpRowSelected: function () {
                return $scope.focusedRowIndex == $scope.focusedRowDirUpIndexConst;
            },
            isHeaderRowSelected: function () {
                return $scope.focusedRowIndex == $scope.focusedRowHeaderIndexConst;
            },
            isDirUpRowVisible: function () {
                return !$scope.requesting && !$scope.isRoot;
            },
            isRenameItemWidgetShown: function () {
                return $scope.widgets.renameItem.isShown;
            },
            loadMoreFilteredItems: function () {
                if ($scope.files.length > $scope.itemsListLimit) {
                    $scope.itemsListLimit += itemsListLimitIncrement;
                    $scope.isItemLimitIncremented = true;
                }
            },
            containerLineInView: function (index, inview, inviewpart, item, isLastCheckedItem) {
                item[renderVisibilityKey] = inview;
                if (isLastCheckedItem) {
                    $scope.inViewCheckPassed++;
                }
            },
            pauseConditionCallback: function (scopeCond) {
                return scopeCond.item && (scopeCond.item[renderVisibilityKey] === false);
            },
            fileTrackByItemExpression: function ($index, item) {
                return $index + ' ' + item.name + ' ' + item.type;
            }

        });

        if (dashboardWidget) {
            dashboardWidget.titleDropdownEnable = true;
            dashboardWidget.isTitleDropdownOpen = false;

            dashboardWidget.onTitleClick = function () {
                dashboardWidget.isTitleDropdownOpen = !dashboardWidget.isTitleDropdownOpen;
            };

            dashboardWidget.titleDropdownList = users.map(user => {
                return {
                    title: user.name
                };
            });

            dashboardWidget.selectTitle = function (element) {
                let newUser = users.find(user => user.name == element.title);
                if (newUser) {
                    $scope.currentUser = newUser;
                    dashboardWidget.title = (newUser.available ? newUser.name + "@" : "") + (source.cluster ? source.cluster.title : "");
                    dashboardWidget.isTitleDropdownOpen = false;
                }
            };
        }

        setupStatusBarTabs();

        $scope.$watch('widgets', function (widgets) {
            $scope.splitWidgets = false;
            ng.forEach($scope.widgets, function (widgetProps, widget) {
                if (widgetProps.isShown) {
                    $scope.splitWidgets = true;
                }
            });
        }, true);

        $scope.$watchGroup(["isFileEditorModeEnabled", "isBreadcrumbPathEditModeEnabled", "isMoveModeEnabled", "isCopyModeEnabled"], function (modesStatus) {
            $scope.isItemsListModeEnabled = !modesStatus.some(function (enabled) {
                return enabled;
            });
        });

        fileNavigator.on(FileNavigatorEvents.REQUESTING, function (event, requesting) {
            $scope.isRequesting = requesting;
        });

        fileNavigator.on(FileNavigatorEvents.PATH_UPDATED, function (event, path) {
            $scope.currentPath = path;
            $scope.currentPathFolder = path.length === 0 ? "/" : path[path.length - 1];
            $scope.isRoot = fileNavigator.isRoot;
            events.$broadcast('path-updated', getCurrentPathAsString());
            resetFileListRelatedScopeVars();
        });

        fileNavigator.on(FileNavigatorEvents.FILES_UPDATED, function (event, data) {
            var folders = [];
            var files = [];

            fileItemsRenderOptimizations(data.items);
            data.items.forEach(function (item) {
                if (item.isFolder) {
                    folders.push(item);
                } else {
                    files.push(item);
                }
            });
            folders.unshift(data.currentFolder);
            $scope.files = folders.concat(files);
            $scope.selectedItems.length = 0;
            $scope.inViewCheckPassed = 0;
            $scope.hideWidgets();
        });

        if (currentUser.available) {
            homeDir = currentUser.homePath;
            /// restore file browser position and opened file if it need
            if (isStandaloneWidget() && dashboardWidget.state && dashboardWidget.state.path) {
                refreshItems(dashboardWidget.state.path);
            } else {
                refreshItems(homeDir);
            }
        } else {
            $scope.error = currentUser.errorDescription;
        }

        $scope.$on('fireUpOnFinishRenderFileList', function (ngRepeatFinishedEvent) {
            $scope.renderFinished++;
            if (!config.embedded && !config.isFileSelector && !config.isDirSelector && !$scope.isItemLimitIncremented) {
                actionFocusFirstLine();
            }
        });

        function refreshItems(path) {
            ensureCleanState();
            if (typeof path === "string") {
                fileNavigator.currentPath = path;
            }
            fileNavigator.refresh($scope.currentUser).then(function(){
                if (isStandaloneWidget() && dashboardWidget.state.file) {
                    $scope.itemClicked($scope.files[dashboardWidget.state.file.index]);
                }
            }).catch(function (error) {
                $scope.error = error.message;

                if ($scope.isMoveModeEnabled) {
                    $scope.exitMoveMode();
                } else if ($scope.isCopyModeEnabled) {
                    $scope.exitCopyMode();
                }
            });
        }

        function getCurrentPathAsString(includeTrailingSlash) {
            // using currentPath from scope because it contains path to file that fileNavigator doesn't hold
            return $scope.currentPath.length > 0 ? "/" + $scope.currentPath.join("/") + (includeTrailingSlash ? "/" : "") : "/";
        }

        function showWidget(widgetName) {
            ng.forEach($scope.widgets, function (props, name) {
                props.isShown = name === widgetName;
            });
        }

        function uploadFile(uploaderFileItem) {
            var file = uploaderFileItem.file;
            var fileExists = fileNavigator.itemExists(file.name, 'FILE');
            if (fileExists) {
                alertsManagerService.addAlertWarning({
                    title: 'Warning',
                    text: 'A file with such name is already uploaded. Do you want to replace it?',
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                upload();
                            }
                        },
                        {
                            text: "No",
                            style: "cancel",
                            action: function (close) {
                                close();
                                uploaderFileItem.remove();
                            }
                        }
                    ]
                });
            } else {
                upload();
            }
            function upload() {
                var item = Item.factory({
                    name: file.name,
                    path: getCurrentPathAsString(true) + file.name,
                    type: "FILE"
                }, source);

                $scope.isRequesting = true;
                item.upload(uploaderFileItem, $scope.currentUser).then(function () {
                    $scope.hideWidgets();
                    refreshItems();
                }).catch(function (error) {
                    alertsManagerService.addAlertError({title: "HDFS file upload error", text: error.message});
                }).finally(function () {
                    $scope.isRequesting = false;
                });
            }
        }

        function ensureCleanState() {
            $scope.error = "";
            $scope.allItemsSelected = false;
            $scope.itemsListLimit = defaultitemsListLimit;
            if (!config.embedded && !config.isFileSelector && !config.isDirSelector) {
                actionFocusFirstLine();
            }
            $scope.hideWidgets();
            if ($scope.isFileEditorModeEnabled) {
                disableFileEditorMode();
            }
        }

        function enableFileEditorMode(file) {
            ensureCleanState();
            let pageSize = 10000000; //10 mb
            let contentPromise;
            $scope.isRequesting = true;
            if (file.bytes > pageSize) {
                contentPromise = file.read(0, pageSize, $scope.currentUser);
                $scope.selectedFile.options = {
                    readOnly: "cursor",
                    pagination: {
                        getPageContent: (page) => {
                            return file.read((page - 1) * pageSize, pageSize, $scope.currentUser)
                                .then(file => file.content)
                                .catch((error) => {
                                    alertsManagerService.addAlertError({
                                        title: "HDFS file content access error",
                                        text: error.message
                                    });
                                    return $q.reject();
                                });
                        },
                        itemsPerPage: pageSize,
                        totalItems: file.bytes
                    }
                };
            } else {
                contentPromise = file.read(null, null, $scope.currentUser);
                $scope.selectedFile.options = {
                    readOnly: false,
                    pagination: false
                };
            }

            contentPromise.then((item)=> {
                $scope.isFileEditorModeEnabled = true;
                $scope.selectedFile.item = file;
                $scope.selectedFile.text = item.content;
                $scope.currentPath = file.fullPath.split("/").splice(1);

                $scope.saveUserState(file);
            }).catch((error) => {
                alertsManagerService.addAlertError({
                    title: "HDFS file content access error",
                    text: error.message
                });
            }).finally(() => {
                $scope.isRequesting = false;
            })
        }

        function disableFileEditorMode() {
            $scope.isFileEditorModeEnabled = false;
            $scope.currentPath.pop();
            $scope.selectedFile.text = "";
            $scope.selectedFile.item = null;
        }

        function normalizeEditPath(path) {
            var normalized;
            if (path.length > 0 && path !== "/") {
                normalized = (path.indexOf("/") !== 0 ? "/" + path : path).replace(/\/$/, "");
            } else {
                normalized = "/";
            }
            return normalized;
        }

        function toggleSelectForItem(item) {
            var index = $scope.selectedItems.indexOf(item);
            if (index !== -1) {
                $scope.selectedItems.splice(index, 1);
                if (!item.isCurrentFolder) {
                    $scope.allItemsSelected = false;
                }
            } else {
                $scope.selectedItems.push(item);
                if ($scope.selectedItems.length > selectedItemsLimit) {
                    alertsManagerService.addAlertWarning({
                        title: 'Selected items limit exceeded',
                        text: `Files operations are not allowed for more than ${selectedItemsLimit} items`
                    })
                }
            }
        }

        function getHotkeyBindings() {
            return [
                {
                    key: "/",
                    cb: keyActionEditPath
                },
                {
                    key: "right",
                    cb: keyActionOpenFile
                },
                {
                    key: "return",
                    cb: keyActionOpenFile
                },
                {
                    key: "del",
                    cb: keyActionDelete
                },
                {
                    key: "delete",
                    cb: keyActionDelete
                },
                {
                    key: "ctrl+c",
                    cb: keyActionCopy
                },
                {
                    key: "ctrl+v",
                    cb: keyActionPaste
                },
                {
                    key: "left",
                    cb: keyActionGoBack
                },
                {
                    key: "up",
                    preventDefault: true,
                    cb: keyActionGoUp
                },
                {
                    key: "down",
                    preventDefault: true,
                    cb: keyActionGoDown
                },
                {
                    key: "space",
                    preventDefault: true,
                    cb: keyActionMarkCheckbox
                }

            ];
        }

        function keyActionEditPath() {
            $timeout(function () {
                $scope.editPath();
            });
        }

        function keyActionOpenFile() {
            var item = getFocusedItem();
            if (item) {
                $scope.itemClicked(item);
            } else if ($scope.isDirUpRowSelected()) {
                keyActionGoBack();
            }
        }

        function keyActionMarkCheckbox() {
            var item = getFocusedItem();
            if (item) {
                toggleSelectForItem(item);
            } else if ($scope.isHeaderRowSelected()) {
                $scope.toggleSelectEveryItem();
            }
        }

        function keyActionDelete() {
            if (!$scope.isDisabled('delete')) {
                $scope.showConfirmDeleteWidget();
            } else {
                keyActionMarkCheckbox();
                if (!$scope.isDisabled('delete')) {
                    $scope.showConfirmDeleteWidget();
                }
            }
        }

        function keyActionGoBack() {
            if ($scope.currentPath.length) {
                $scope.goTo($scope.currentPath.length - 2);
            }
        }

        function keyActionGoUp() {
            if (ng.isArray($scope.filesFilteredReference)) {
                //var lastIndex = $scope.filesFilteredReference.length - 1;
                if ($scope.focusedRowIndex > 0) {
                    $scope.focusedRowIndex--;
                } else if ($scope.focusedRowIndex == 0 && $scope.isDirUpRowVisible()) {
                    $scope.focusedRowIndex = $scope.focusedRowDirUpIndexConst;
                } else if (
                    ($scope.focusedRowIndex == 0 && !$scope.isDirUpRowVisible()) ||
                    $scope.focusedRowIndex == $scope.focusedRowDirUpIndexConst
                ) {
                    $scope.focusedRowIndex = $scope.focusedRowHeaderIndexConst;
                    //} else {
                    //$scope.focusedRowIndex = lastIndex;
                }

                setupStatusBarTabs();
            }
        }

        function keyActionGoDown() {
            if (ng.isArray($scope.filesFilteredReference)) {
                var lastIndex = $scope.filesFilteredReference.length - 1;
                if (($scope.focusedRowIndex == $scope.focusedRowHeaderIndexConst) && $scope.isDirUpRowVisible()) {
                    $scope.focusedRowIndex = $scope.focusedRowDirUpIndexConst;
                } else if (
                    ($scope.focusedRowIndex == $scope.focusedRowDirUpIndexConst) ||
                    (($scope.focusedRowIndex == $scope.focusedRowHeaderIndexConst) && !$scope.isDirUpRowVisible())
                ) {
                    $scope.focusedRowIndex = 0;
                } else if ($scope.focusedRowIndex < lastIndex) {
                    $scope.focusedRowIndex++;
                    //} else {
                    //$scope.focusedRowIndex = 0;
                }

                setupStatusBarTabs();
            }
        }

        function keyActionCopy() {
            if (!$scope.isDisabled('copy')) {
                $scope.copyItems();
            }
        }

        function keyActionPaste() {
            if ($scope.isMoveModeEnabled || $scope.isCopyModeEnabled) {
                $scope.pasteItems();
            }
        }

        function actionFocusFirstLine() {
            $scope.focusedRowIndex = 0;
        }

        function getFocusedItem() {
            if (ng.isArray($scope.filesFilteredReference) && $scope.filesFilteredReference[$scope.focusedRowIndex]) {
                return $scope.filesFilteredReference[$scope.focusedRowIndex];
            }
            return null;
        }

        function hideQuickCreateItemWidget() {
            $scope.displayQuickCreateItemWidget = false;
            events.$broadcast('create-item-mode-change', $scope.displayQuickCreateItemWidget);
        }

        function fileItemsRenderOptimizations(fileItems) {
            if (fileItems.length >= defaultitemsListLimit && ng.isArray(fileItems)) {
                fileItems.forEach(function (item) {
                    item[renderVisibilityKey] = false;
                });
            }
        }

        function resetFileListRelatedScopeVars() {
            $scope.renderFinished = 0;
            $scope.inViewCheckPassed = 0;
            $scope.isItemLimitIncremented = false;
            $scope.focusedRow = -1;
        }

        function isStandaloneWidget() {
            return !config.embedded && !config.isFileSelector && !config.isDirSelector;
        }

        function setupStatusBarTabs() {
            var statusBarTabs = [], item = getFocusedItem();

            if (item && item.bytes) {
                statusBarTabs.push({
                    label: 'File size',
                    value: item.bytes + ' Bytes'
                });
            }
            WidgetAccessorActions.updateWidgetStatusBarTabs(statusBarTabs);
        }
    }
});
