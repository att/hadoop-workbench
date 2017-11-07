define(function (require) {
    "use strict";

    require("../ngModule").factory("hdfs.Chmod", getChmod);

    getChmod.$inject = [];
    function getChmod() {

        function Chmod(initValue) {
            this.owner = this.getRwxObj();
            this.group = this.getRwxObj();
            this.others = this.getRwxObj();
            this.sticky = "";

            if (initValue) {
                var codes = isNaN(initValue) ?
                    this.convertfromCode(initValue) :
                    this.convertfromOctal(initValue);

                if (!codes) {
                    throw new Error('Invalid input data');
                }

                this.owner = codes.owner;
                this.group = codes.group;
                this.others = codes.others;
                this.sticky = codes.sticky;
            }
        }

        Chmod.prototype.toOctal = function (prepend, append) {
            var props = ['owner', 'group', 'others'];
            var result = [];
            for (var i in props) {
                var key = props[i];
                result[i] = this[key].read && this.octalValues.read || 0;
                result[i] += this[key].write && this.octalValues.write || 0;
                result[i] += this[key].exec && this.octalValues.exec || 0;
            }
            return (prepend || '') + (this.sticky ? "1" : "") + result.join('') + (append || '');
        };

        Chmod.prototype.toCode = function (prepend, append) {
            var props = ['owner', 'group', 'others'];
            var result = [];
            for (var i in props) {
                var key = props[i];
                result[i] = this[key].read && this.codeValues.read || '-';
                result[i] += this[key].write && this.codeValues.write || '-';
                result[i] += this[key].exec && this.codeValues.exec || '-';
            }
            return (prepend || '') + result.join('') + (this.sticky ? "t" : "") + (append || '');
        };

        Chmod.prototype.getRwxObj = function () {
            return {
                read: false,
                write: false,
                exec: false
            };
        };

        Chmod.prototype.octalValues = {
            read: 4, write: 2, exec: 1
        };

        Chmod.prototype.codeValues = {
            read: 'r', write: 'w', exec: 'x'
        };

        Chmod.prototype.convertfromCode = function (str) {
            //TODO(maximk): implement sticky bit conversion
            str = ('' + str).replace(/\s/g, '');
            str = str.length === 10 ? str.substr(1) : str;
            if (!/^[-rwx]{9}$/.test(str)) {
                return;
            }

            var result = [], vals = str.match(/.{1,3}/g);
            for (var i in vals) {
                var rwxObj = this.getRwxObj();
                rwxObj.read = /r/.test(vals[i]);
                rwxObj.write = /w/.test(vals[i]);
                rwxObj.exec = /x/.test(vals[i]);
                result.push(rwxObj);
            }

            return {
                owner: result[0],
                group: result[1],
                others: result[2]
            };
        };

        Chmod.prototype.convertfromOctal = function (str) {
            str = ('' + str).replace(/\s/g, '');
            var sticky = 0;
            if (str.length === 4) {
                sticky = Number(str[0]) === 1;
                str = str.substr(1);
            }
            if (!/^[0-7]{3}$/.test(str)) {
                return;
            }

            var result = [], vals = str.match(/.{1}/g);
            for (var i in vals) {
                var rwxObj = this.getRwxObj();
                rwxObj.read = /[4567]/.test(vals[i]);
                rwxObj.write = /[2367]/.test(vals[i]);
                rwxObj.exec = /[1357]/.test(vals[i]);
                result.push(rwxObj);
            }

            return {
                owner: result[0],
                group: result[1],
                others: result[2],
                sticky: sticky
            };
        };

        return Chmod;
    }
});