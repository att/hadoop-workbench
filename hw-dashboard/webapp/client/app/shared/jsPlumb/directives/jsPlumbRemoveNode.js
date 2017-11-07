define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require("angular");

    require('../ngModule').directive('dapCoreJsPlumbRemoveNode', function () {
        return {
            restrict: 'A',
            replace: true,
            scope: {
                dapCoreJsPlumbRemoveNode: "=",
                confirmNodeDeletion: "&confirmNodeDeletionCb",
                afterNodeRemoveCb: "&"
            },
            require: '^dapCoreJsPlumbContainer',
            link: function (scope, element, attrs, jsPlumbContainer) {
                element.on('click', function (event) {
                    event.stopPropagation();
                    jsPlumbContainer.getInstance().then(function (instance) {
                        if ($.isFunction(scope.confirmNodeDeletion)) {
                            scope.confirmNodeDeletion({
                                node: scope.dapCoreJsPlumbRemoveNode
                            }).then(function () {
                                var endpoints = scope.dapCoreJsPlumbRemoveNode.endpoints;
                                if (!ng.isUndefined(endpoints)) {
                                    endpoints.forEach(function (endpoint) {
                                        // Since deleting an endpoint deletes its attached connections,
                                        // we need to notify parents about upcoming
                                        // connections deletions attached to the endpoint being deleted
                                        // so that they can deselect any connection which will be deleted.
                                        // This workaround is required because JsPlumb doesn't trigger onBeforeDetach
                                        // event for connections removed as part of endpoint deletion process
                                        scope.$emit("endpoint-delete.jsPlumbRemoveNode", endpoint);
                                        instance.deleteEndpoint(endpoint.ep);
                                    });
                                }

                                // notify parent
                                scope.afterNodeRemoveCb({
                                    node: scope.dapCoreJsPlumbRemoveNode
                                });
                            });
                        }
                    });
                });
            }
        };
    });
});
