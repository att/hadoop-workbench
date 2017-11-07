define(function (require) {
    "use strict";

    require('../ngModule').factory('platform-manager-widget.ServiceUsersActions', getFactory);

    getFactory.$inject = [
        'flux',
        'platform.restService',
        'platform.pages.service-users.models.ServiceUser'
    ];
    function getFactory(flux, restService, User) {
        return {
            fetchUsers: function () {
                return restService.getServiceUsers().then(function (data) {
                    var users = [];
                    data.users.forEach(function (user) {
                        users.push(User.factory(user));
                    });
                    flux.dispatch('platform-manager-UPDATE_USERS', users);
                });
            },
            createUser: function (user) {
                return restService.createServiceUser(user).then(function (data) {
                    user.id = data.id;
                    flux.dispatch('platform-manager-ADD_USER', User.factory(user));
                });
            },
            updateUser: function (user) {
                return restService.updateServiceUser(user).then(function () {
                    flux.dispatch('platform-manager-UPDATE_USER', User.factory(user));
                });
            },
            removeUser: function (id) {
                return restService.deleteServiceUser(id).then(function () {
                    flux.dispatch('platform-manager-REMOVE_USER', id);
                });
            }
        };
    }
});
