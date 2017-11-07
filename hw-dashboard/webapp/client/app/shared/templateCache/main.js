let templates = require.context('../../', true, /\.html$/);

export default angular.module('dap.shared.templateCache', []).run(['$templateCache', ($templateCache)=> {
    templates.keys().forEach(function (key) {
        $templateCache.put(key.replace(/(^\.\/)/, '/app/'), templates(key));
    });
}]);
