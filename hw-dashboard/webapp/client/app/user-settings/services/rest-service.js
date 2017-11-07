define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').service('userSettings.restService', RestProvider);

    RestProvider.$inject = ["core.utils.string-format", "core.API", "$rootScope", "$q"];
    function RestProvider(stringFormat, API, $rootScope, $q) {
        var urlGetSettings = "/hw/settings/user/{0}";
        var urlPutSettings = "/hw/settings/user/{0}";
        var urlServiceUsers = '/hw/module/platform-web/api/v1.0/privateServiceUsers';
        let urlDeleteServiceUsers = '/hw/module/platform-web/api/v1.0/privateServiceUsers/{0}';
        var urlAccessKeys = '/hw/module/platform-web/api/v1.0/privateKeyFiles?type=keytab';
        let urlDeleteAccessKeys = '/hw/module/platform-web/api/v1.0/privateKeyFiles/{0}';
        let urlUsersRolesAssignments = '/hw/module/admin-web/api/v1.0/users/roles/assignments';
        let urlRolesList = '/hw/module/admin-web/api/v1.0/users/roles';

        this.getUserSettings = function (username) {
            var url = stringFormat(urlGetSettings, username);
            return API.get(url).then(function (data) {
                var settings = {};
                var hdfsUserId = null;
                var oozieUserId = null;
                var localUserAsService = false;
                if (data) {
                    try {
                        settings = data.settings ? JSON.parse(data.settings) : {};
                        hdfsUserId = data.hdfsUserId;
                        oozieUserId = data.oozieUserId;
                        localUserAsService = data.localUserAsService;
                    } catch (e) {
                        //TODO(maximk): add handler here
                    }
                }
                return {
                    settings: settings,
                    hdfsUserId: hdfsUserId,
                    oozieUserId: oozieUserId,
                    localUserAsService: localUserAsService,
                };
            }, function (response) {
                return $q.reject(response.message);
            });
        };

        this.saveUserSettings = function (settings, rootLevelSettings) {
            
            var username = $rootScope.currentUser.login;
            var url = stringFormat(urlPutSettings, username);
            var data = {
                user: username,
                settings: JSON.stringify(settings),
                hdfsUserId: rootLevelSettings.hdfsUserId,
                oozieUserId: rootLevelSettings.oozieUserId,
                localUserAsService: rootLevelSettings.localUserAsService,
            };
            return API.put(url, data).catch(function (response) {
                return $q.reject(response.message);
            });
        };

        this.putUsersRolesAssignments = function (data) {
            return API.put(urlUsersRolesAssignments, data).catch(function (response) {
                return $q.reject(response.message);
            });
        };
        
        this.getUsersRolesAssignments = function () {
            return API.get(urlUsersRolesAssignments).catch(function (response) {
                return $q.reject(response.message);
            });
        };

        this.getRolesList = function () {
            return API.get(urlRolesList).catch(function (response) {
                return $q.reject(response.message);
            });
        };

        this.getServiceUsers = function () {
            return API.get(urlServiceUsers).then((data) => data.users);
        };

        this.createServiceUser = function (user) {
            return API.post(urlServiceUsers, user).then((data) => {
                user.id = data.id;
                return user;
            });
        };

        this.updateServiceUser = function (user) {
            return API.put(urlServiceUsers, user).then(() => {
                return user;
            });
        };

        this.removeServiceUser = function (id) {
            return API.delete(stringFormat(urlDeleteServiceUsers, id));
        };

        this.getAccessKeys = function () {
            return API.get(urlAccessKeys).then((data) => data.files);
        };

        this.createAccessKey = function (key) {
            return API.post(urlAccessKeys, key, {params: {operation: 'create'}}).then((data) => {
                return {
                    id: data.id,
                    name: data.name
                };
            });
        };

        this.uploadAccessKey = function (wrapper) {
            return $q((resolve, reject) => {
                let fileName = encodeURIComponent(wrapper.file.name);
                wrapper.url = urlAccessKeys + `&name=${fileName}&operation=upload`;
                wrapper.onSuccess = function (response) {
                    var newFile = response.data.files[0];
                    $rootScope.$apply(function () {
                        resolve(newFile);
                    });
                };
                wrapper.onError = function (response, status, headers) {
                    $rootScope.$apply(function () {
                        reject(response);
                    });
                };
                wrapper.upload();
            });
        };

        this.removeAccessKey = function (id) {
            return API.delete(stringFormat(urlDeleteAccessKeys, id));
        }
    }
});