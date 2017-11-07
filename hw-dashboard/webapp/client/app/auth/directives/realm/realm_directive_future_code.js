/**
 * Realm code extructred from login controller.
 * could be used later, should be converted intro directive.
 *   NOT COMPLETED
 *   EXPORT REALM "realms"
*/
/*

return;

define(function (require) {
    "use strict";

    require('../ngModule').controller('auth.loginController', loginController);

    loginController.$inject = ['$scope',  'auth.authService', '$filter', '$timeout'];
    function loginController($scope, authService, $filter, $timeout) {

        var realms = null; // this should be EXPORTED IN DIRECTIVE
        authService.getRealms().then(function(result) {
            realms = result;
            init();
        });

        function init () {

            $scope.realms = [].concat(realms);
            $scope.realmsFiltered  = [].concat($scope.realms);

            $scope.credentials = {
                serviceLogin: false,
                realm: $scope.realms.length > 0 ? $scope.realms[0].realm : ''
            };

            $scope.isDatalistVisible = false;
            $scope.errorMessage = '';


            $scope.selectRealm = selectRealm;
            $scope.close = close;
            $scope.showDatalist = showDatalist;
            $scope.realmInputOnKeyDown = realmInputOnKeyDown;
            $scope.realmInputOnPaste = realmInputOnPaste;
            $scope.realmInputFocus = realmInputFocus;
            $scope.realmInputOnBlur = realmInputOnBlur;
            $scope.realmInputOnClick = realmInputOnClick;
            $scope.isRealmInputInteracted = false;
            $scope.showValidationErrors = false;

            $scope.$watch('credentials.realm', filterList);

        }

        function selectRealm(realm) {
            if (realm) {
                $scope.credentials.realm = realm.realm;
            }
            close();
        }

        function close() {
            $scope.isDatalistVisible = false;
        }

        function realmInputOnKeyDown (event) {
            $scope.isRealmInputInteracted = true;
            var escKeyCode = 27;
            if (event.keyCode === escKeyCode) {
                close();
            } else {
                showDatalist();
            }
        }

        function realmInputOnPaste() {
            $scope.isRealmInputInteracted = true;
        }

        function realmInputOnClick() {
            $scope.isRealmInputInteracted = true;
        }
        function showDatalist() {
            $scope.isDatalistVisible = true;
        }

        function realmInputFocus () {
            showDatalist();
        }

        function realmInputOnBlur () {
            /!**
             * Set delay to allow click on to a datalist elements
             *!/
            $timeout(function () {
                close();
            }, 200);
        }

        function filterList(newVal) {
            /!**
             * Show all options if no input was done buy user
             *!/
            if (!$scope.isRealmInputInteracted) {
                return;
            }
            var filteredResults = $filter('filter')($scope.realms, {realm: newVal});
            /!*
             * Save pointer to the existing array!
             *!/
            $scope.realmsFiltered.splice(0);
            $scope.realmsFiltered.push.apply($scope.realmsFiltered, filteredResults);
        }
    }
});
*/
/*
<div ng-if="credentials.serviceLogin" class="b-auth-sign-in_realm"
     navigable-list
     nl-on-choose="selectRealm">
    <input type="text"
           name="realm"
           ng-model="credentials.realm"
           class="input"
           ng-class="{invalid: !isDatalistVisible && authLoginForm.realm.$invalid && (authLoginForm.realm.$touched || showValidationErrors)}"
           ng-keydown="realmInputOnKeyDown($event)"
           ng-paste="realmInputOnPaste()"
           ng-focus="realmInputFocus()"
           ng-click="realmInputOnClick()"
           ng-blur="realmInputOnBlur()"
           placeholder="Kerberos realm"
           required
           navigable-list-input
    />

    <div class="form-input-validation-message"
         ng-if="!isDatalistVisible && authLoginForm.realm.$error.required && (authLoginForm.realm.$touched || showValidationErrors)">
        Required field
    </div>
    <div class="b-auth-sign-in_realm__list-container"
         ng-show="isDatalistVisible"
    >
        <ul navigable-list-items="realmsFiltered"
            nl-selector="li"
            nl-selected-class="selected"
            nl-highlighted-class="highlighted"
            class="b-auth-sign-in_realm__list-container__list"
        >
            <li class="b-auth-sign-in_realm__list-container__list__item"
                ng-repeat="item in realmsFiltered"
                ng-click="selectRealm(item)"
            >
                {{item.realm}}
            </li>
        </ul>

    </div>
</div>

*/
/*

.b-auth-sign-in_realm {
    margin-top: @grid-margin;

&__list-container {
        margin-top: 1px;
        min-height: 100px;
        max-height: 300px;
        position: absolute;
        background: #fff;
        width: 276px;
        box-shadow: 1px 1px 3px #C9D1DA;

    .invalid {
            margin-top: 15px;
        }
    &__list {
            max-height: 299px;
            min-height: 100px;
            list-style: none;
            margin: 0;
            padding: 0;
            overflow: auto;

        &__item {
                padding-left: 6px;

            :first-child {
                    padding-top: 4px;
                }
            }
        &__item.selected, &__item:hover {
                background-color: rgba(128, 128, 128, 0.38);;
            }
        }
    }
}
*/
