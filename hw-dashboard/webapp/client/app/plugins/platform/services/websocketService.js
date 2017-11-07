/*jshint maxparams: 7*/
define(function (require) {
    "use strict";

    require('../ngModule').provider('platform.websocketService', RestProvider);

    // data shared between RestProvider and RestService
    var urlPrefix = '';
    var remoteUrl = '/hw/websocket';

    var ng = require("angular");

    var urlTemplates = {
        connectPlatformsStatusChannel: remoteUrl + '?path={0}&token={1}',
    };

    function RestProvider() {

        this.setRemoteUrl = function (url) {
            remoteUrl = url;
        };

        this.$get = RestService;
    }

    RestService.$inject = [
        '$q',
        'core.API',
        '$location',
        '$websocket',
        'auth.authService',
        'core.utils.string-format',
    ];

    function RestService($q, API, $location, $websocket, authService, stringFormat) {
        urlPrefix = 'ws://' + $location.host() + ':' + $location.port();

        return new PlatformService($q, API);

        function PlatformService($q, API) {

            var platformWS = {};
            this.doNotShowError = false;

            this.silent = function () {
                return ng.extend({}, this, {
                    doNotShowError: true
                });
            };

            /*Platforms*/
            this.connectPlatformsStatusChannel = function () {
                var platformsChannelPath = '/module/platform-web/ws/platforms';
                var url = stringFormat(urlPrefix + urlTemplates.connectPlatformsStatusChannel, platformsChannelPath, authService.getToken());
                platformWS = $websocket(url);
                return platformWS;
            };

        }
    }
});
