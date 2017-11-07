define(function (require) {
    "use strict";

    require('../ngModule').factory('platform-manager-widget.cluster-info.ClusterUsersActions', getFactory);

    getFactory.$inject = [
        'flux',
        'platform.restService',
        'platform.pages.cluster-info.cluster-users.models.ClusterUser'
    ];
    function getFactory(flux, restService, User) {
        return {
            fetchUsers: function (platformId, clusterId) {
                return restService.getServiceUsers(platformId, clusterId).then(function (data) {
                    var users = [];
                    data.users.forEach(function (user) {
                        users.push(User.factory(user));
                    });
                    flux.dispatch('cluster-manager-UPDATE_USERS', users);
                });
            },
            createUser: function (user, platformId, clusterId) {
                return restService.createServiceUser(user, platformId, clusterId).then(function (data) {
                    user.id = data.id;
                    flux.dispatch('cluster-manager-ADD_USER', User.factory(user));
                });
            },
            updateUser: function (user, platformId, clusterId) {
                return restService.updateServiceUser(user, platformId, clusterId).then(function () {
                    flux.dispatch('cluster-manager-UPDATE_USER', User.factory(user));
                });
            },
            removeUser: function (platformId, clusterId, id) {
                return restService.deleteServiceUser(platformId, clusterId, id).then(function () {
                    flux.dispatch('cluster-manager-REMOVE_USER', id);
                });
            },
            setClusterCredentials: function(platformId, clusterId) {
                flux.dispatch('cluster-manager-SET_CLUSTER', {
                    platformId: platformId,
                    clusterId: clusterId
                });
            }
        };
    }
});
