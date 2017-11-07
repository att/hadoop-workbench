define(function (require) {
    require('../ngModule').constant('core.utils.string-format', function format() {
        var template = arguments[0],
            templateArgs = arguments;

        return template.replace(/\{\d+\}/g, function (match) {
            var index = +match.slice(1, -1), arg;

            if (index + 1 < templateArgs.length) {
                return templateArgs[index + 1];
            }
            return match;
        });
    })
});