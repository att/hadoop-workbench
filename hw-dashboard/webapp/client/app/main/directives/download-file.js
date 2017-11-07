define(function (require) {
    "use strict";

    var $ = require("jquery");
    require('../ngModule').directive('downloadFile', ['$parse', 'auth.authService', function ($parse, authService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var iframe;
                var getter = $parse(attrs.downloadFile);
                var onSuccess = function (locals) {
                    $parse(attrs.onSuccess)(scope, locals);
                };
                var onError = function (locals) {
                    $parse(attrs.onError)(scope, locals);
                };

                var setter = getter.assign;

                scope.$watch(getter, function (path) {
                    if (path) {
                        element.empty();

                        var operationId = guid();
                        iframe = document.createElement("iframe");
                        iframe.src = path + "&Authorization=" + authService.getToken() + "&operationId=" + operationId;
                        element.append(iframe);

                        setter(scope, "");

                        watchForResponse(operationId);
                    }
                });

                function watchForResponse(operationId) {
                    var downloadTimer;
                    var attempts = 60;
                    var interval = 1000;
                    var cookie = "download" + operationId;

                    downloadTimer = window.setInterval(function () {
                        var result = getCookie(cookie);

                        if ((result !== null) || (attempts === 0)) {
                            window.clearInterval(downloadTimer);
                            expireCookie(cookie);

                            if (result === "ok") {
                                scope.$applyAsync(function () {
                                    onSuccess();
                                });
                            } else {
                                var body = $(iframe.contentDocument || iframe.contentWindow.document).find('body');
                                var text;
                                if (body.find('pre').length === 0) {
                                    text = body.find('pre').text();
                                } else {
                                    text = body.text();

                                }

                                var error;
                                try {
                                    error = JSON.parse(text);
                                } catch (e) {
                                    error = {message: "unknown error"};
                                }

                                scope.$applyAsync(function () {
                                    onError({error: error});
                                });
                            }

                            element.empty();
                        }

                        attempts -= 1;
                    }, interval);

                    function getCookie(name) {
                        var parts = document.cookie.split(name + "=");
                        if (parts.length === 2) {
                            return parts.pop().split(";").shift();
                        } else {
                            return null;
                        }
                    }

                    function expireCookie(cName) {
                        // The following cookie format is expected from server
                        // Set-Cookie:[token-name]=ok/error; Domain=[domain name]; Path=/
                        document.cookie = encodeURIComponent(cName) + "=deleted; expires=" + new Date(0).toUTCString() + "; Domain=" + window.location.hostname + "; Path=/";
                    }
                }

                function guid() {
                    function s4() {
                        return Math.floor((1 + Math.random()) * 0x10000)
                            .toString(16)
                            .substring(1);
                    }

                    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                        s4() + '-' + s4() + s4() + s4();
                }
            }
        };
    }]);
});
