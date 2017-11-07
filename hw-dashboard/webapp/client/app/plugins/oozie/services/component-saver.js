define(function (require) {
    "use strict";

    require('../ngModule').factory('oozie.ComponentSaver', getComponentSaver);

    getComponentSaver.$inject = ["$q", "oozie.restService"];

    function getComponentSaver($q, restService) {

        function ComponentSaver(source) {
            this.source = source;

            // stub interceptor
            this.beforeSaveInterceptor = function (fulfilled, data) {
            };

            // stub interceptor
            this.afterSaveInterceptor = function (fulfilled, data) {
            };
        }

        ComponentSaver.EVENTS = {};

        ComponentSaver.prototype = {
            registerBeforeSaveInterceptor: function (interceptor) {
                this.beforeSaveInterceptor = interceptor;
            },
            registerAfterSaveInterceptor: function (interceptor) {
                this.afterSaveInterceptor = interceptor;
            },
            save: function (workflow, workflowFilePath, propertyFiles) {
                let self = this;
                this.beforeSaveInterceptor();
                return $q(function (resolve, reject) {
                    let operations = [];
                    let workflowOperation = {
                        name: 'workflow',
                        hideSuccessNotification: false,
                        hideErrorNotification: false,
                        promise: restService.updateModule(workflow, workflowFilePath)
                    };
                    operations.push(workflowOperation);
                    propertyFiles.map((f) => {
                        let fileOperation = {
                            name: f.file.path,
                            hideSuccessNotification: true,
                            hideErrorNotification: false,
                            promise: restService.saveFileAsConfig('v1.0', self.source, f.file.path, f.config)
                        };
                        operations.push(fileOperation);
                    });

                    let promises = operations.map((o) => {
                        let p = o.promise;
                        delete o.promise;
                        return p;
                    });

                    $q.allSettled(promises).then(function (settled) {
                        let results = {resolved: [], rejected: []};
                        settled.forEach((result, index) => {
                            let operation = operations[index];
                            if (result.state === 'fulfilled') {
                                operation.value = result.value;
                                results.resolved.push(operation);
                            } else {
                                operation.reason = result.reason.message;
                                results.rejected.push(operation);
                            }
                        });

                        let fulfilled = results.rejected.length === 0;
                        $q.when(self.afterSaveInterceptor(fulfilled, results)).finally(()=>resolve(results));
                    })
                });
            }
        };

        return ComponentSaver;
    }

});