define(function (require) {
    "use strict";

    require("../ngModule").service("fileBrowser.configuration", Configuration);
    var ng = require("angular");

    Configuration.$inject = ["$rootScope"];
    function Configuration($rootScope) {
        this.getConfig = function (options) {
            var defaultColumns = ["type", "name", "size", "user", "group", "permissions", "date"];
            return {
                tplPath: options.tplPath,
                breadcrumb: options.breadcrumb !== undefined ? options.breadcrumb : true,
                actions: options.actions !== undefined ? options.actions : true,
                foldersOnly: options.foldersOnly !== undefined ? options.foldersOnly : false,
                quickCreateWidget: configureQuickCreateWidget(options.quickCreateWidget),
                enterFolderOnCreate: options.enterFolderOnCreate !== undefined ? options.enterFolderOnCreate : false,
                columns: options.columns !== undefined ? options.columns : defaultColumns,
                currentFolderOnly: options.currentFolderOnly !== undefined ? options.currentFolderOnly : false,
                embedded: options.embedded !== undefined ? options.embedded : false,
                events: options.events !== undefined ? options.events : $rootScope.$new(true),
                isFileSelector: options.isFileSelector !== undefined ? options.isFileSelector : false,
                isDirSelector: options.isDirSelector !== undefined ? options.isDirSelector : false
            };
        };

        function configureQuickCreateWidget(config) {
            var quickCreateWidget = {
                search: true,
                folder: true,
                file: true,
                openFileBrowser: false,
                upload: true
            };

            if (config !== undefined && typeof config === "boolean") {
                if (config === true) {
                    return quickCreateWidget;
                } else {
                    return false;
                }
            } else {
                return ng.extend(quickCreateWidget, config);
            }
        }
    }
});