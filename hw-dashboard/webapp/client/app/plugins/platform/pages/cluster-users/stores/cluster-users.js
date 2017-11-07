define(function (require) {
    "use strict";

    require('../ngModule').service('platform-manager-widget.cluster-info.ClusterUsersStore', getStore);

    getStore.$inject = ['flux'];
    function getStore(flux) {
        return flux.createStore(function (exports) {
            this.users = [];
            this.clusterCredentials = {
                platformId: '',
                clusterId: ''
            };

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

            this.setClusterCredentials = function (clusterCredentials) {
                self.clusterCredentials = clusterCredentials;
                self.emitChange();
            };

            this.on('cluster-manager-UPDATE_USERS', this.setUsers);
            this.on('cluster-manager-ADD_USER', this.addUser);
            this.on('cluster-manager-UPDATE_USER', this.updateUser);
            this.on('cluster-manager-REMOVE_USER', this.removeUser);
            this.on('cluster-manager-SET_CLUSTER', this.setClusterCredentials);

            exports.getUsers = function () {
                return self.users;
            };

            exports.getClusterCredentials = function () {
                return self.clusterCredentials;
            }
        });
    }
});
