define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('editor.IndexController', function ($scope, container, options) {
        let defaults = {
            mode: 'text/xml',
            autofocus: true,
            pagination: false,
            extraKeys: {
                'Ctrl-F': 'findPersistent',
                'Cmd-F': 'findPersistent'
            }
        };

        $scope.codeMirrorOpts = ng.extend(defaults, options);
        $scope.container = container;
        $scope.requesting = false;

        if ($scope.codeMirrorOpts.pagination) {
            let previousPage = 1;
            $scope.codeMirrorOpts.theme = 'paginated';
            $scope.pagination = {
                currentPage: 1,
                totalItems: options.pagination.totalItems,
                itemsPerPage: options.pagination.itemsPerPage,
                pageChanged: () => {
                    $scope.requesting = true;
                    let requestedPage = $scope.pagination.currentPage;
                    $scope.pagination.currentPage = previousPage;
                    options.pagination.getPageContent(requestedPage).then(function (content) {
                        $scope.container = {text: content};
                        $scope.pagination.currentPage = previousPage = requestedPage;
                    }).finally(() => {
                        $scope.requesting = false;
                    });
                }
            };
        }

        this.onParamChanged = function (key, options) {
            $scope.codeMirrorOpts = ng.extend(defaults, options);
        };
    });
});
