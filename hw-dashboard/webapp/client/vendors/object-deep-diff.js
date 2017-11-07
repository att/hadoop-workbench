var _ = require("lodash");

/**
 Return a diff of object from source
 i.e. result = source-defaults
 **/
var diff = function (defaults, source) {
    var result = _.cloneDeep(source);

    _.map(result, function (value, key) {
        if (typeof(value) === "object") {
            if (_.isArray(value)) {
                var tmp = _.difference(value, defaults[key]);
                if (!tmp.length) {
                    delete result[key]
                }

            } else {
                if (defaults[key] === undefined) {
                    result = value;
                } else {
                    var tmp = diff(defaults[key], value);
                    if (_.isEmpty(tmp)) {
                        delete result[key]
                    } else {
                        result[key] = tmp
                    }

                }
            }

        } else {
            if (defaults[key] === value) {
                delete result[key]
            }
        }
    });

    return result
};

module.exports = diff;