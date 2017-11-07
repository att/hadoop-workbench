define(["ngMockE2E"], function () {
    "use strict";

    describe('validation.MinConnectionOccurs', function () {
        beforeEach(module('dap.shared.validation'));

        describe('constructor', function () {
            var MinConnectionOccursService;

            beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (_MinConnectionOccursService_) {
                MinConnectionOccursService = _MinConnectionOccursService_;
            }]));

            describe('from and to params', function () {
                it("should throw an exception if 'from' and 'to' params are both undefined", function () {
                    /*jshint -W080*/
                    var from = undefined;
                    var to = undefined;
                    var type = "out";
                    var minOccurs = 0;
                    expect(MinConnectionOccursService.bind({}, from, to, type, minOccurs)).toThrow(new Error("At least 'from' or 'too' param should be specified and should not be empty string"));
                });

                it("should throw an exception if 'from' and 'to' params are both null", function () {
                    var from = null;
                    var to = null;
                    var type = "out";
                    var minOccurs = 0;
                    expect(MinConnectionOccursService.bind({}, from, to, type, minOccurs)).toThrow(new Error("At least 'from' or 'too' param should be specified and should not be empty string"));
                });

                it("should throw an exception if 'from' and 'to' params are both empty string", function () {
                    var from = "";
                    var to = "";
                    var type = "out";
                    var minOccurs = 0;
                    expect(MinConnectionOccursService.bind({}, from, to, type, minOccurs)).toThrow(new Error("At least 'from' or 'too' param should be specified and should not be empty string"));
                });
            });

            describe('minOccurs param', function () {
                it('should throw an exception if minOccurs is undefined', function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = "out";
                    /*jshint -W080*/
                    var minOccurs = undefined;
                    expect(MinConnectionOccursService.bind({}, from, to, minOccurs)).toThrow(new Error('minOccurs should be specified and be number greater than or equal to zero'));
                });

                it('should throw an exception if minOccurs is null', function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = "out";
                    var minOccurs = null;
                    expect(MinConnectionOccursService.bind({}, from, to, type, minOccurs)).toThrow(new Error('minOccurs should be specified and be number greater than or equal to zero'));
                });

                it('should throw an exception if minOccurs is less than zero', function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = "out";
                    var minOccurs = -1;
                    expect(MinConnectionOccursService.bind({}, from, to, type, minOccurs)).toThrow(new Error('minOccurs should be specified and be number greater than or equal to zero'));
                });

                it('should throw an exception if minOccurs is a string', function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = "out";
                    var minOccurs = "0";
                    expect(MinConnectionOccursService.bind({}, from, to, type, minOccurs)).toThrow(new Error('minOccurs should be specified and be number greater than or equal to zero'));
                });
            });

            describe('type param', function () {
                it('should throw an exception if type is undefined', function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = undefined; // jshint ignore:line
                    var minOccurs = 3;
                    expect(MinConnectionOccursService.bind({}, from, to, type, minOccurs)).toThrow(new Error("type should be specified and should be either 'out' or 'in'"));
                });

                it('should throw an exception if type is null', function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = null; // jshint ignore:line
                    var minOccurs = 3;
                    expect(MinConnectionOccursService.bind({}, from, to, type, minOccurs)).toThrow(new Error("type should be specified and should be either 'out' or 'in'"));
                });

                it("should throw an exception if type is empty string", function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = "";
                    var minOccurs = 3;
                    expect(MinConnectionOccursService.bind({}, from, to, type, minOccurs)).toThrow(new Error("type should be specified and should be either 'out' or 'in'"));
                });

                it("should throw an exception if type is a string other than 'in' or 'out'", function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = "someotherstring";
                    var minOccurs = 3;
                    expect(MinConnectionOccursService.bind({}, from, to, type, minOccurs)).toThrow(new Error("type should be specified and should be either 'out' or 'in'"));
                });
            });

        });

        describe('validate', function () {

            describe("nodes and connections params", function () {

                describe('existing connections are not an array', function () {
                    it("should throw an exception if connections are not of Array type", function () {

                        var minConnectionOccursService = null;
                        inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                            minConnectionOccursService = new MinConnectionOccursService("typeA", "typeB", "out", 3);
                        }]);

                        var valuesToValidate = {
                            nodes: [],
                            connections: {}
                        };

                        expect(minConnectionOccursService.validate.bind({}, valuesToValidate)).toThrow(new Error("Both nodes and connections should be of Array type"));
                    });
                });

                describe('existing nodes are not an array', function () {
                    it("should throw an exception if nodes are not of Array type", function () {

                        var minConnectionOccursService = null;
                        inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                            minConnectionOccursService = new MinConnectionOccursService("typeA", "typeB", "out", 3);
                        }]);

                        var valuesToValidate = {
                            nodes: {},
                            connections: []
                        };

                        expect(minConnectionOccursService.validate.bind({}, valuesToValidate)).toThrow(new Error("Both nodes and connections should be of Array type"));
                    });
                });

            });

            describe("only 'from' param is set", function () {

                var type = "out";

                describe('two connections are required', function () {
                    var minConnectionOccursService;
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var toConstructorParam = undefined; // jshint ignore:line
                    var minOccurs = 2;

                    beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                        minConnectionOccursService = new MinConnectionOccursService(from, toConstructorParam, type, minOccurs);
                    }]));

                    describe('more existing connections than required', function () {
                        it("should return valid:true, empty message and empty array of invalid nodes", function () {

                            var idToValidate = "someid";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";
                            var nodeId3 = "someid33";

                            var nodes = [
                                {id: idToValidate, type: from},
                                {id: nodeId1, type: to},
                                {id: nodeId2, type: to},
                                {id: nodeId3, type: to}
                            ];
                            var connections = [
                                {
                                    from: {id: idToValidate, type: from},
                                    to: {id: nodeId1, type: to}
                                },
                                {
                                    from: {id: idToValidate, type: from},
                                    to: {id: nodeId2, type: to}
                                },
                                {
                                    from: {id: idToValidate, type: from},
                                    to: {id: nodeId3, type: to}
                                }
                            ];
                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: true,
                                message: "",
                                invalidNodeIds: []
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('less existing connections than required', function () {
                        it("should return valid:false and generic message", function () {

                            var idToValidate = "someid";
                            var nodeId1 = "someid11";

                            var nodes = [
                                {id: idToValidate, type: from},
                                {id: nodeId1, type: to}
                            ];

                            var connections = [
                                {
                                    from: {id: idToValidate, type: from},
                                    to: {id: nodeId1, type: to}
                                }
                            ];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: false,
                                message: "At least " + minOccurs + " connections are expected from type '" + from + "'",
                                invalidNodeIds: [idToValidate]
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('equal number of existing and required connections', function () {
                        it("should return valid:true and empty message", function () {

                            var idToValidate = "someid";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";

                            var nodes = [
                                {id: idToValidate, type: from},
                                {id: nodeId1, type: to},
                                {id: nodeId2, type: to}
                            ];

                            var connections = [
                                {
                                    from: {id: idToValidate, type: from},
                                    to: {id: nodeId1, type: to}
                                },
                                {
                                    from: {id: idToValidate, type: from},
                                    to: {id: nodeId2, type: to}
                                }
                            ];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: true,
                                message: "",
                                invalidNodeIds: []
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('zero existing connections', function () {
                        it("should return valid:false and generic message", function () {

                            var idToValidate = "someid";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";

                            var nodes = [
                                {id: idToValidate, type: from},
                                {id: nodeId1, type: to},
                                {id: nodeId2, type: to}
                            ];

                            var connections = [];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: false,
                                message: "At least " + minOccurs + " connections are expected from type '" + from + "'",
                                invalidNodeIds: [idToValidate]
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });
                });

                describe('no connections are required', function () {
                    var minConnectionOccursService;
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var toConstructorParam = undefined; // jshint ignore:line
                    var minOccurs = 0;

                    beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                        minConnectionOccursService = new MinConnectionOccursService(from, toConstructorParam, type, minOccurs);
                    }]));

                    describe('more existing connections than required', function () {
                        it("should return valid:true and empty message", function () {

                            var idToValidate = "someid";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";
                            var nodeId3 = "someid33";

                            var nodes = [
                                {id: idToValidate, type: from},
                                {id: nodeId1, type: to},
                                {id: nodeId2, type: to},
                                {id: nodeId3, type: to}
                            ];

                            var connections = [
                                {
                                    from: {id: idToValidate, type: from},
                                    to: {id: nodeId1, type: to}
                                }
                            ];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: true,
                                message: "",
                                invalidNodeIds: []
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('no existing connections', function () {
                        it("should return valid:true and empty message", function () {

                            var idToValidate = "someid";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";
                            var nodeId3 = "someid33";

                            var nodes = [
                                {id: idToValidate, type: from},
                                {id: nodeId1, type: to},
                                {id: nodeId2, type: to},
                                {id: nodeId3, type: to}
                            ];

                            var connections = [];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: true,
                                message: "",
                                invalidNodeIds: []
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });
                });

                describe('custom message', function () {
                    var minConnectionOccursService;
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var toConstructorParam = undefined; // jshint ignore:line
                    var minOccurs = 2;
                    var customMessage = "Minimum number of connections is " + minOccurs;

                    beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                        minConnectionOccursService = new MinConnectionOccursService(from, toConstructorParam, type, minOccurs, customMessage);
                    }]));

                    it("should return valid:false and a custom message", function () {

                        var idToValidate = "someid";
                        var nodeId1 = "someid11";
                        var nodeId2 = "someid22";
                        var nodeId3 = "someid33";

                        var nodes = [
                            {id: idToValidate, type: from},
                            {id: nodeId1, type: to},
                            {id: nodeId2, type: to},
                            {id: nodeId3, type: to}
                        ];

                        var connections = [
                            {
                                from: {id: idToValidate, type: from},
                                to: {id: nodeId1, type: to}
                            }
                        ];

                        var valuesToValidate = {
                            nodes: nodes,
                            connections: connections
                        };

                        var validationResult = {
                            valid: false,
                            message: customMessage,
                            invalidNodeIds: [idToValidate]
                        };

                        expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                    });
                });
            });

            describe("only 'to' param is set", function () {

                var type = "in";

                describe('two connections are required', function () {
                    var minConnectionOccursService;
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var fromConstructorParam = undefined; // jshint ignore:line
                    var minOccurs = 2;

                    beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                        minConnectionOccursService = new MinConnectionOccursService(fromConstructorParam, to, type, minOccurs);
                    }]));

                    describe('more existing connections than required', function () {
                        it("should return valid:true and empty message", function () {

                            var idToValidate = "someid";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";
                            var nodeId3 = "someid33";

                            var nodes = [
                                {id: idToValidate, type: to},
                                {id: nodeId1, type: from},
                                {id: nodeId2, type: from},
                                {id: nodeId3, type: from}
                            ];

                            var connections = [
                                {
                                    to: {id: idToValidate, type: to},
                                    from: {id: nodeId1, type: from}
                                },
                                {
                                    to: {id: idToValidate, type: to},
                                    from: {id: nodeId2, type: from}
                                },
                                {
                                    to: {id: idToValidate, type: to},
                                    from: {id: nodeId3, type: from}
                                }
                            ];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: true,
                                message: "",
                                invalidNodeIds: []
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('less existing connections than required', function () {
                        it("should return valid:false and generic message", function () {

                            var idToValidate = "someid";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";
                            var nodeId3 = "someid33";

                            var nodes = [
                                {id: idToValidate, type: to},
                                {id: nodeId1, type: from},
                                {id: nodeId2, type: from},
                                {id: nodeId3, type: from}
                            ];

                            var connections = [
                                {
                                    to: {id: idToValidate, type: to},
                                    from: {id: nodeId1, type: from}
                                }
                            ];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: false,
                                message: "At least " + minOccurs + " connections are expected to type '" + to + "'",
                                invalidNodeIds: [idToValidate]
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('equal number of existing and required connections', function () {
                        it("should return valid:true and empty message", function () {

                            var idToValidate = "someid";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";
                            var nodeId3 = "someid33";

                            var nodes = [
                                {id: idToValidate, type: to},
                                {id: nodeId1, type: from},
                                {id: nodeId2, type: from},
                                {id: nodeId3, type: from}
                            ];

                            var connections = [
                                {
                                    to: {id: idToValidate, type: to},
                                    from: {id: nodeId1, type: from}
                                },
                                {
                                    to: {id: idToValidate, type: to},
                                    from: {id: nodeId2, type: from}
                                }
                            ];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: true,
                                message: "",
                                invalidNodeIds: []
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('zero existing connections', function () {
                        it("should return valid:false and generic message", function () {

                            var idToValidate = "someid";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";
                            var nodeId3 = "someid33";

                            var nodes = [
                                {id: idToValidate, type: to},
                                {id: nodeId1, type: from},
                                {id: nodeId2, type: from},
                                {id: nodeId3, type: from}
                            ];

                            var connections = [];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: false,
                                message: "At least " + minOccurs + " connections are expected to type '" + to + "'",
                                invalidNodeIds: [idToValidate]
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });
                });

                describe('no connections are required', function () {
                    var minConnectionOccursService;
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var fromConstructorParam = undefined; // jshint ignore:line
                    var minOccurs = 0;

                    beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                        minConnectionOccursService = new MinConnectionOccursService(fromConstructorParam, to, type, minOccurs);
                    }]));

                    describe('more existing connections than required', function () {
                        it("should return valid:true and empty message", function () {

                            var idToValidate = "someid";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";
                            var nodeId3 = "someid33";

                            var nodes = [
                                {id: idToValidate, type: to},
                                {id: nodeId1, type: from},
                                {id: nodeId2, type: from},
                                {id: nodeId3, type: from}
                            ];

                            var connections = [
                                {
                                    to: {id: idToValidate, type: to},
                                    from: {id: nodeId1, type: from}
                                },
                                {
                                    to: {id: idToValidate, type: to},
                                    from: {id: nodeId2, type: from}
                                },
                                {
                                    to: {id: idToValidate, type: to},
                                    from: {id: nodeId3, type: from}
                                }
                            ];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: true,
                                message: "",
                                invalidNodeIds: []
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('no existing connections', function () {
                        it("should return valid:true and empty message", function () {

                            var idToValidate = "someid";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";
                            var nodeId3 = "someid33";

                            var nodes = [
                                {id: idToValidate, type: to},
                                {id: nodeId1, type: from},
                                {id: nodeId2, type: from},
                                {id: nodeId3, type: from}
                            ];

                            var connections = [];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: true,
                                message: "",
                                invalidNodeIds: []
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });
                });

                describe('custom message', function () {
                    var minConnectionOccursService;
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var fromConstructorParam = undefined; // jshint ignore:line
                    var minOccurs = 2;
                    var customMessage = "Minimum number of connections is " + minOccurs;

                    beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                        minConnectionOccursService = new MinConnectionOccursService(fromConstructorParam, to, type, minOccurs, customMessage);
                    }]));

                    it("should return valid:false and a custom message", function () {

                        var idToValidate = "someid";
                        var nodeId1 = "someid11";
                        var nodeId2 = "someid22";
                        var nodeId3 = "someid33";

                        var nodes = [
                            {id: idToValidate, type: to},
                            {id: nodeId1, type: from},
                            {id: nodeId2, type: from},
                            {id: nodeId3, type: from}
                        ];

                        var connections = [
                            {
                                to: {id: idToValidate, type: to},
                                from: {id: nodeId1, type: from}
                            }
                        ];

                        var valuesToValidate = {
                            nodes: nodes,
                            connections: connections
                        };

                        var validationResult = {
                            valid: false,
                            message: customMessage,
                            invalidNodeIds: [idToValidate]
                        };

                        expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                    });
                });
            });

            describe("both 'from' and 'to' params are set", function () {

                describe("outgoing connections", function () {

                    var type = "out";

                    describe('two connections are required', function () {
                        var minConnectionOccursService;
                        var from = "nodeTypeA";
                        var to = "nodeTypeB";
                        var minOccurs = 2;

                        beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                            minConnectionOccursService = new MinConnectionOccursService(from, to, type, minOccurs);
                        }]));

                        describe('more existing connections than required', function () {
                            it("should return valid:true and empty message", function () {

                                var idToValidate1 = "someid1";
                                var nodeId1 = "someid11";
                                var nodeId2 = "someid22";
                                var nodeId3 = "someid33";

                                var nodes = [
                                    {id: idToValidate1, type: from},
                                    {id: nodeId1, type: to},
                                    {id: nodeId2, type: to},
                                    {id: nodeId3, type: to}
                                ];

                                var connections = [
                                    {
                                        from: nodes[0],
                                        to: nodes[1]
                                    },
                                    {
                                        from: nodes[0],
                                        to: nodes[2]
                                    },
                                    {
                                        from: nodes[0],
                                        to: nodes[3]
                                    }
                                ];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: true,
                                    message: "",
                                    invalidNodeIds: []
                                };

                                expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('less existing connections than required', function () {
                            it("should return valid:false, generic message and an array of invalid ids", function () {

                                var idToValidate1 = "someid1";
                                var idToValidate2 = "someid2";
                                var nodeId1 = "someid11";
                                var nodeId2 = "someid22";
                                var nodeId3 = "someid33";
                                var nodeId4 = "someid44";
                                var otherType1 = "otherType1";
                                var otherType2 = "otherType1";
                                var otherType3 = "otherType1";

                                var nodes = [
                                    {id: idToValidate1, type: from},
                                    {id: idToValidate2, type: to},
                                    {id: nodeId1, type: to},
                                    {id: nodeId2, type: otherType1},
                                    {id: nodeId3, type: otherType2},
                                    {id: nodeId4, type: otherType3}
                                ];

                                var connections = [
                                    {
                                        from: nodes[0],
                                        to: nodes[2]
                                    },
                                    {
                                        from: nodes[3],
                                        to: nodes[1]
                                    },
                                    {
                                        from: nodes[4],
                                        to: nodes[1]
                                    },
                                    {
                                        from: nodes[5],
                                        to: nodes[1]
                                    }
                                ];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: false,
                                    message: "At least " + minOccurs + " connections are expected from type '" + from + "' to type '" + to + "'",
                                    invalidNodeIds: [idToValidate1]
                                };

                                expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('equal number of existing and required connections', function () {
                            it("should return valid:true and empty message", function () {

                                var idToValidate1 = "someid1";
                                var nodeId1 = "someid11";
                                var nodeId2 = "someid22";

                                var nodes = [
                                    {id: idToValidate1, type: from},
                                    {id: nodeId1, type: to},
                                    {id: nodeId2, type: to}
                                ];

                                var connections = [
                                    {
                                        from: nodes[0],
                                        to: nodes[1]
                                    },
                                    {
                                        from: nodes[0],
                                        to: nodes[2]
                                    }
                                ];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: true,
                                    message: "",
                                    invalidNodeIds: []
                                };

                                expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('zero existing connections', function () {
                            it("should return valid:false and generic message", function () {

                                var idToValidate1 = "someid1";
                                var idToValidate2 = "someid2";

                                var nodes = [
                                    {id: idToValidate1, type: from},
                                    {id: idToValidate2, type: from}
                                ];

                                var connections = [];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: false,
                                    message: "At least " + minOccurs + " connections are expected from type '" + from + "' to type '" + to + "'",
                                    invalidNodeIds: [idToValidate1, idToValidate2]
                                };

                                expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });
                    });

                    describe('no connections are required', function () {
                        var minConnectionOccursService;
                        var from = "nodeTypeA";
                        var to = "nodeTypeB";
                        var minOccurs = 0;

                        beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                            minConnectionOccursService = new MinConnectionOccursService(from, to, type, minOccurs);
                        }]));

                        describe('more existing connections than required', function () {
                            it("should return valid:true and empty message", function () {

                                var idToValidate1 = "someid1";
                                var nodeId1 = "someid11";
                                var nodeId2 = "someid22";

                                var nodes = [
                                    {id: idToValidate1, type: from},
                                    {id: nodeId1, type: to},
                                    {id: nodeId2, type: to}
                                ];

                                var connections = [
                                    {
                                        from: nodes[0],
                                        to: nodes[1]
                                    },
                                    {
                                        from: nodes[0],
                                        to: nodes[2]
                                    }
                                ];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: true,
                                    message: "",
                                    invalidNodeIds: []
                                };

                                expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('no existing connections', function () {
                            it("should return valid:true and empty message", function () {

                                var idToValidate1 = "someid1";
                                var nodeId1 = "someid11";
                                var nodeId2 = "someid22";

                                var nodes = [
                                    {id: idToValidate1, type: from},
                                    {id: nodeId1, type: to},
                                    {id: nodeId2, type: to}
                                ];

                                var connections = [];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: true,
                                    message: "",
                                    invalidNodeIds: []
                                };

                                expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });
                    });

                    describe('custom message', function () {
                        var minConnectionOccursService;
                        var from = "nodeTypeA";
                        var to = "nodeTypeB";
                        var minOccurs = 2;
                        var customMessage = "Minimum number of connections is " + minOccurs;

                        beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                            minConnectionOccursService = new MinConnectionOccursService(from, to, type, minOccurs, customMessage);
                        }]));

                        it("should return valid:false and a custom message", function () {

                            var idToValidate1 = "someid1";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";

                            var nodes = [
                                {id: idToValidate1, type: from},
                                {id: nodeId1, type: to},
                                {id: nodeId2, type: to}
                            ];

                            var connections = [];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: false,
                                message: customMessage,
                                invalidNodeIds: [idToValidate1]
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });
                });

                describe("incoming connections", function () {

                    var type = "in";

                    describe('two connections are required', function () {
                        var minConnectionOccursService;
                        var from = "nodeTypeA";
                        var to = "nodeTypeB";
                        var minOccurs = 2;

                        beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                            minConnectionOccursService = new MinConnectionOccursService(from, to, type, minOccurs);
                        }]));

                        describe('more existing connections than required', function () {
                            it("should return valid:true and empty message", function () {

                                var idToValidate1 = "someid1";
                                var nodeId1 = "someid11";
                                var nodeId2 = "someid22";
                                var nodeId3 = "someid33";

                                var nodes = [
                                    {id: idToValidate1, type: to},
                                    {id: nodeId1, type: from},
                                    {id: nodeId2, type: from},
                                    {id: nodeId3, type: from}
                                ];

                                var connections = [
                                    {
                                        from: nodes[1],
                                        to: nodes[0]
                                    },
                                    {
                                        from: nodes[2],
                                        to: nodes[0]
                                    },
                                    {
                                        from: nodes[3],
                                        to: nodes[0]
                                    }
                                ];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: true,
                                    message: "",
                                    invalidNodeIds: []
                                };

                                expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('less existing connections than required', function () {
                            it("should return valid:false, generic message and an array of invalid ids", function () {

                                var idToValidate1 = "someid1";
                                var idToValidate2 = "someid2";
                                var nodeId1 = "someid11";
                                var nodeId2 = "someid22";

                                var nodes = [
                                    {id: idToValidate1, type: to},
                                    {id: idToValidate2, type: to},
                                    {id: nodeId1, type: from},
                                    {id: nodeId2, type: from}
                                ];

                                var connections = [
                                    {
                                        from: nodes[2],
                                        to: nodes[0]
                                    },
                                    {
                                        from: nodes[3],
                                        to: nodes[1]
                                    }
                                ];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: false,
                                    message: "At least " + minOccurs + " connections are expected from type '" + from + "' to type '" + to + "'",
                                    invalidNodeIds: [idToValidate1, idToValidate2]
                                };

                                expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('equal number of existing and required connections', function () {
                            it("should return valid:true and empty message", function () {

                                var idToValidate1 = "someid1";
                                var nodeId1 = "someid11";
                                var nodeId2 = "someid22";

                                var nodes = [
                                    {id: idToValidate1, type: to},
                                    {id: nodeId1, type: from},
                                    {id: nodeId2, type: from}
                                ];

                                var connections = [
                                    {
                                        from: nodes[1],
                                        to: nodes[0]
                                    },
                                    {
                                        from: nodes[2],
                                        to: nodes[0]
                                    }
                                ];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: true,
                                    message: "",
                                    invalidNodeIds: []
                                };

                                expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('zero existing connections', function () {
                            it("should return valid:false and generic message", function () {

                                var idToValidate1 = "someid1";
                                var idToValidate2 = "someid2";

                                var nodes = [
                                    {id: idToValidate1, type: to},
                                    {id: idToValidate2, type: from}
                                ];

                                var connections = [];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: false,
                                    message: "At least " + minOccurs + " connections are expected from type '" + from + "' to type '" + to + "'",
                                    invalidNodeIds: [idToValidate1]
                                };

                                expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });
                    });

                    describe('no connections are required', function () {
                        var minConnectionOccursService;
                        var from = "nodeTypeA";
                        var to = "nodeTypeB";
                        var minOccurs = 0;

                        beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                            minConnectionOccursService = new MinConnectionOccursService(from, to, type, minOccurs);
                        }]));

                        describe('more existing connections than required', function () {
                            it("should return valid:true and empty message", function () {

                                var idToValidate1 = "someid1";
                                var nodeId1 = "someid11";
                                var nodeId2 = "someid22";

                                var nodes = [
                                    {id: idToValidate1, type: to},
                                    {id: nodeId1, type: from},
                                    {id: nodeId2, type: from}
                                ];

                                var connections = [
                                    {
                                        from: nodes[1],
                                        to: nodes[0]
                                    },
                                    {
                                        from: nodes[1],
                                        to: nodes[0]
                                    }
                                ];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: true,
                                    message: "",
                                    invalidNodeIds: []
                                };

                                expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('no existing connections', function () {
                            it("should return valid:true and empty message", function () {

                                var idToValidate1 = "someid1";
                                var nodeId1 = "someid11";
                                var nodeId2 = "someid22";

                                var nodes = [
                                    {id: idToValidate1, type: to},
                                    {id: nodeId1, type: from},
                                    {id: nodeId2, type: from}
                                ];

                                var connections = [];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: true,
                                    message: "",
                                    invalidNodeIds: []
                                };

                                expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });
                    });

                    describe('custom message', function () {
                        var minConnectionOccursService;
                        var from = "nodeTypeA";
                        var to = "nodeTypeB";
                        var minOccurs = 2;
                        var customMessage = "Minimum number of connections is " + minOccurs;

                        beforeEach(inject(['dap.core.shared.validation.MinConnectionOccurs', function (MinConnectionOccursService) {
                            minConnectionOccursService = new MinConnectionOccursService(from, to, type, minOccurs, customMessage);
                        }]));

                        it("should return valid:false and a custom message", function () {

                            var idToValidate1 = "someid1";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";

                            var nodes = [
                                {id: idToValidate1, type: to},
                                {id: nodeId1, type: from},
                                {id: nodeId2, type: from}
                            ];

                            var connections = [];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: false,
                                message: customMessage,
                                invalidNodeIds: [idToValidate1]
                            };

                            expect(minConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });
                });
            });
        });
    });

});