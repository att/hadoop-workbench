define(function (require) {
    "use strict";

    require('../ngModule').service('platform-manager-widget.ServiceUsersStore', getStore);

    getStore.$inject = ['flux'];
    function getStore(flux) {
        return flux.createStore(function (exports) {
            this.users = [];
            var self = this;

            this.setUsers = function (users) {
                self.users = users;
                self.emitChange();
            };

            this.addUser = function (user) {
                self.users.push(user);
                self.emitChange();
            };

            this.updateUser = function (updatedUser) {
                var index = -1;
                self.users.some(function (user, i) {
                    if (user.id === updatedUser.id) {
                        index = i;
                        return true;
                    } else {
                        return false;
                    }
                });
                self.users.splice(index, 1, updatedUser);
                self.emitChange();
            };

            this.removeUser = function (id) {
                var index = -1;
                self.users.some(function (user, i) {
                    if (user.id === id) {
                        index = i;
                        return true;
                    } else {
                        return false;
                    }
                });

                if (index !== -1) {
                    self.users.splice(index, 1);
                    self.emitChange();
                }
            };

            this.on('platform-manager-UPDATE_USERS', this.setUsers);
            this.on('platform-manager-ADD_USER', this.addUser);
            this.on('platform-manager-UPDATE_USER', this.updateUser);
            this.on('platform-manager-REMOVE_USER', this.removeUser);

            exports.getUsers = function () {
                return self.users;
            };
        });
    }
});
