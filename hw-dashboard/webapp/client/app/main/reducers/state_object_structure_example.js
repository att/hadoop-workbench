(function (){
    
    return;
    let stateExample_2 = {
        "ui": {
            "widgets": [],
            "menu": {
                "items": [{
                    "title": "Component",
                    "icon": "dap-navigation-list-item-component",
                    "dapWidget": "search-component",
                    "$$hashKey": "object:36"
                }, {
                    "title": "Tenant",
                    "icon": "dap-navigation-list-item-tenant",
                    "dapWidget": "search-tenant",
                    "$$hashKey": "object:37"
                }, {
                    "title": "Scaleout",
                    "icon": "dap-navigation-list-item-scaleout",
                    "dapWidget": "scaleout",
                    "$$hashKey": "object:38"
                }, {
                    "title": "HDFS",
                    "icon": "dap-navigation-list-item-hdfs",
                    "dapWidget": "search-hdfs-cluster",
                    "$$hashKey": "object:39"
                }, {
                    "title": "Provision",
                    "icon": "dap-navigation-list-item-provision",
                    "dapWidget": "search-provider",
                    "$$hashKey": "object:41"
                }, {
                    "title": "Clusters",
                    "icon": "dap-navigation-list-item-cluster",
                    "dapWidget": "search-cluster",
                    "$$hashKey": "object:40"
                }],
                "selectedItem": {
                    "title": "Component",
                    "icon": "dap-navigation-list-item-component",
                    "dapWidget": "search-component",
                    "$$hashKey": "object:36"
                },
                "searchQuery": "",
                "searchStatus": {
                    "requesting": {
                        "component": {"tenants": false, "platforms": false},
                        "tenant": false,
                        "hdf": false,
                        "cluster": false
                    }
                }
            }
        },
        "data": {
            "provision": {
              "providers": [{
                  "name": "AWS",
                  "title": "AWS",
                  "distributions": [{
                      "name": "HDP",
                      "title": "Hortonworks",
                      "versions": ["2.4.0"]
                  }, {
                      "name": "KAFKA",
                      "title": "Kafka",
                      "versions": ["0.9.0.1"]
                  }, {
                      "name": "CASSANDRA",
                      "title": "Casandra",
                      "versions": ["3.0.1"]
                  }]
              }, {
                  "name": "K8S",
                  "title": "Kubernetes",
                  "distributions": [{
                      "name": "HDP",
                      "title": "Hortonworks",
                      "versions": ["2.4.0"]
                  }]
              }]
            },
            "tenant": {
                "oozieTemplates": {
                    "ciobdv48h0001385ph4dtf3tu": {
                        "$cuid": "ciobdv48h0001385ph4dtf3tu",
                        "component": {
                            "name": "fs-test",
                            "description": "",
                            "displayType": "Workflow",
                            "version": "1.0",
                            "id": 36,
                            "tenantId": 10,
                            "type": "oozie"
                        },
                        "$meta": {
                            "isDeleting": false,
                            "isGetting": false,
                            "isPosting": false,
                            "isPutting": false,
                            "busy": false,
                            "error": null,
                            "errorType": null
                        },
                        "info": {"name": "fs-test", "version": "0.5", "renderedName": "fs-test", "componentVersion": "1.0"},
                        "files": [{"path": "/config-default.xml", "type": "file", "size": 73}, {
                            "path": "/meta",
                            "type": "dir"
                        }, {"path": "/meta/component.json", "type": "file", "size": 109}, {
                            "path": "/lib",
                            "type": "dir"
                        }, {"path": "/lib/index_copy_working.js", "type": "file", "size": 36824}, {
                            "path": "/workflow.xml",
                            "type": "file",
                            "size": 638
                        }, {"path": "/subworkflow", "type": "dir"}, {"path": "/subworkflow/workflow.xml", "type": "file"}],
                        "errors": []
                    }
                },
                "flumeTemplates": {},
                "templates": {
                    "ciobdv4np0003385pz4zasorz": {
                        "actionSubtype": "",
                        "version": "",
                        "info": {
                            "name": "Hive-Refresh",
                            "displayType": "Workflow",
                            "version": "2.0.15",
                            "id": 2115,
                            "tenantId": 131,
                            "type": "oozie"
                        },
                        "properties": {"type": "oozie", "name": "Hive-Refresh", "version": "2.0.15", "description": ""},
                        "icons": ["oozie"],
                        "tenant": {
                            "version": "1.0",
                            "info": {"version": "1.0", "id": 0, "name": "", "description": ""},
                            "properties": {"name": "", "version": "1.0", "description": ""}
                        },
                        "$meta": {
                            "isDeleting": false,
                            "isGetting": false,
                            "isPosting": false,
                            "isPutting": false,
                            "busy": false,
                            "error": null,
                            "errorType": null
                        },
                        "$cuid": "ciobdv4np0003385pz4zasorz",
                        "$$hashKey": "object:403"
                    },
                    "ciobdv4np0004385pwgtkpgf7": {
                        "actionSubtype": "",
                        "version": "",
                        "info": {
                            "name": "HDFS-MergeFiles",
                            "displayType": "Workflow",
                            "version": "2.0.0",
                            "id": 2116,
                            "tenantId": 131,
                            "type": "oozie"
                        },
                        "properties": {"type": "oozie", "name": "HDFS-MergeFiles", "version": "2.0.0", "description": ""},
                        "icons": ["oozie"],
                        "tenant": {
                            "version": "1.0",
                            "info": {"version": "1.0", "id": 0, "name": "", "description": ""},
                            "properties": {"name": "", "version": "1.0", "description": ""}
                        },
                        "$meta": {
                            "isDeleting": false,
                            "isGetting": false,
                            "isPosting": false,
                            "isPutting": false,
                            "busy": false,
                            "error": null,
                            "errorType": null
                        },
                        "$cuid": "ciobdv4np0004385pwgtkpgf7",
                        "$$hashKey": "object:404"
                    },
                    "ciobdv4np0005385pyqqh0l37": {
                        "actionSubtype": "",
                        "version": "",
                        "info": {
                            "name": "Tokenizer-SubscriberID",
                            "displayType": "Workflow",
                            "version": "2.0.7",
                            "id": 2117,
                            "tenantId": 131,
                            "type": "oozie"
                        },
                        "properties": {
                            "type": "oozie",
                            "name": "Tokenizer-SubscriberID",
                            "version": "2.0.7",
                            "description": ""
                        },
                        "icons": ["oozie"],
                        "tenant": {
                            "version": "1.0",
                            "info": {"version": "1.0", "id": 0, "name": "", "description": ""},
                            "properties": {"name": "", "version": "1.0", "description": ""}
                        },
                        "$meta": {
                            "isDeleting": false,
                            "isGetting": false,
                            "isPosting": false,
                            "isPutting": false,
                            "busy": false,
                            "error": null,
                            "errorType": null
                        },
                        "$cuid": "ciobdv4np0005385pyqqh0l37",
                        "$$hashKey": "object:405"
                    }
                },
                "tenants": {
                    "ciobdv48f0000385pxltuddeb": {
                        "$cuid": "ciobdv48f0000385pxltuddeb",
                        "id": 10,
                        "$meta": {
                            "isDeleting": false,
                            "isGetting": false,
                            "isPosting": false,
                            "isPutting": false,
                            "busy": false,
                            "error": null,
                            "errorType": null
                        },
                        "version": "1.0",
                        "info": {"version": "1.0", "id": 10, "name": "BetaTests", "description": ""},
                        "properties": {"name": "BetaTests", "version": "1.0", "description": ""}
                    },
                    "ciobdv49r0002385pihw3w0ig": {
                        "$cuid": "ciobdv49r0002385pihw3w0ig",
                        "id": 131,
                        "$meta": {
                            "isDeleting": false,
                            "isGetting": false,
                            "isPosting": false,
                            "isPutting": false,
                            "busy": false,
                            "error": null,
                            "errorType": null
                        },
                        "version": "1.0",
                        "info": {
                            "version": "1.0",
                            "id": 131,
                            "name": "DesignPatterns",
                            "description": "Design Patterns Paradigms"
                        },
                        "properties": {
                            "name": "DesignPatterns",
                            "version": "1.0",
                            "description": "Design Patterns Paradigms"
                        }
                    }
                }
            },
            "oozie": {
                "components": {},
                "templates": {},
                "busyCounter": 0,
                "lastFailedPostTemplate": null,
                "lastPostedTemplate": null
            },
            "platform": {"isUpdating": false, "modules": {}},
            "alerts": []
        }
    };
    let state = {
        data: {
            alerts: [],
            oozie: {
                busyCounter: 0,
                components: {},
                lastFailedPostTemplate: null,
                lastPostedTemplate: null,
                templates: {}
            },
            platform: {
                isUpdating: false,
                modules: {
                    2: ServiceDataSource,
                    3: ServiceDataSource,
                }
            },
            tenant: {
                flumeTemplates: {},
                oozieTemplates: {
                    ciob8vrmi0001385p9t5w4l86: {}
                },
                templates: {
                    ciob8vrmg0000385p2s70c06f: TenantTemplateContainer,
                    ciob8vrmi000a385psz2hhi7u: TenantTemplateContainer
                },
                tenants: {
                    ciob8vrmn004i385pt674ebpt: TenantContainer
                }
            }
        },
        ui: {
            menu: {
                items: [
                    {},
                    {},
                    {},
                    {},
                    {}],
                searchQuery: "",
                searchStatus: Map,
                selectedItem: {},
            },
            widgets: []

        }
    };
})();
