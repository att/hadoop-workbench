define(["ngMockE2E"], function () {
    "use strict";

    describe('validation.MaxConnectionOccurs', function () {
        beforeEach(module('dap.shared.validation'));

        describe('constructor', function () {
            var MaxConnectionOccursService;
            beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (_MaxConnectionOccursService_) {
                MaxConnectionOccursService = _MaxConnectionOccursService_;
            }]));

            describe('from and to params', function () {
                it("should throw an exception if 'from' and 'to' params are both undefined", function () {
                    /*jshint -W080*/
                    var from = undefined;
                    var to = undefined;
                    var type = "out";
                    var maxOccurs = 0;
                    expect(MaxConnectionOccursService.bind({}, from, to, type, maxOccurs)).toThrow(new Error("At least 'from' or 'too' param should be specified and should not empty string"));
                });

                it("should throw an exception if 'from' and 'to' params are both null", function () {
                    var from = null;
                    var to = null;
                    var type = "out";
                    var maxOccurs = 0;
                    expect(MaxConnectionOccursService.bind({}, from, to, type, maxOccurs)).toThrow(new Error("At least 'from' or 'too' param should be specified and should not empty string"));
                });

                it("should throw an exception if 'from' and 'to' params are both empty string", function () {
                    var from = "";
                    var to = "";
                    var type = "out";
                    var maxOccurs = 0;
                    expect(MaxConnectionOccursService.bind({}, from, to, type, maxOccurs)).toThrow(new Error("At least 'from' or 'too' param should be specified and should not empty string"));
                });
            });

            describe('maxOccurs param', function () {
                it('should throw an exception if maxOccurs is undefined', function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = "out";
                    /*jshint -W080*/
                    var maxOccurs = undefined;

                    expect(MaxConnectionOccursService.bind({}, from, to, type, maxOccurs)).toThrow(new Error('maxOccurs should be specified and be number greater than or equal to zero'));
                });

                it('should throw an exception if maxOccurs is null', function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var maxOccurs = null;
                    var type = "out";

                    expect(MaxConnectionOccursService.bind({}, from, to, type, maxOccurs)).toThrow(new Error('maxOccurs should be specified and be number greater than or equal to zero'));
                });

                it('should throw an exception if maxOccurs is less than zero', function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = "out";
                    var maxOccurs = -1;

                    expect(MaxConnectionOccursService.bind({}, from, to, type, maxOccurs)).toThrow(new Error('maxOccurs should be specified and be number greater than or equal to zero'));
                });

                it('should throw an exception if maxOccurs is a string', function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var maxOccurs = "0";
                    var type = "out";

                    expect(MaxConnectionOccursService.bind({}, from, to, type, maxOccurs)).toThrow(new Error('maxOccurs should be specified and be number greater than or equal to zero'));
                });
            });

            describe('type param', function () {
                it('should throw an exception if type is undefined', function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = undefined; // jshint ignore:line
                    var maxOccurs = 3;
                    expect(MaxConnectionOccursService.bind({}, from, to, type, maxOccurs)).toThrow(new Error("type should be specified and should be either 'out' or 'in'"));
                });

                it('should throw an exception if type is null', function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = null; // jshint ignore:line
                    var maxOccurs = 3;
                    expect(MaxConnectionOccursService.bind({}, from, to, type, maxOccurs)).toThrow(new Error("type should be specified and should be either 'out' or 'in'"));
                });

                it("should throw an exception if type is empty string", function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = "";
                    var maxOccurs = 3;
                    expect(MaxConnectionOccursService.bind({}, from, to, type, maxOccurs)).toThrow(new Error("type should be specified and should be either 'out' or 'in'"));
                });

                it("should throw an exception if type is a string other than 'in' or 'out'", function () {
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var type = "someotherstring";
                    var maxOccurs = 3;
                    expect(MaxConnectionOccursService.bind({}, from, to, type, maxOccurs)).toThrow(new Error("type should be specified and should be either 'out' or 'in'"));
                });
            });

        });

        describe('validate', function () {

            describe("nodes and connections params", function () {

                describe('existing connections are not an array', function () {
                    it("should throw an exception if connections are not of Array type", function () {

                        var maxConnectionOccursService = null;
                        inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                            maxConnectionOccursService = new MaxConnectionOccursService("typeA", "typeB", "out", 3);
                        }]);

                        var valuesToValidate = {
                            nodes: [],
                            connections: {}
                        };

                        expect(maxConnectionOccursService.validate.bind({}, valuesToValidate)).toThrow(new Error("Both nodes and connections should be of Array type"));
                    });
                });

                describe('existing nodes are not an array', function () {
                    it("should throw an exception if nodes are not of Array type", function () {

                        var maxConnectionOccursService = null;
                        inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                            maxConnectionOccursService = new MaxConnectionOccursService("typeA", "typeB", "out", 3);
                        }]);

                        var valuesToValidate = {
                            nodes: {},
                            connections: []
                        };

                        expect(maxConnectionOccursService.validate.bind({}, valuesToValidate)).toThrow(new Error("Both nodes and connections should be of Array type"));
                    });
                });

            });

            describe("only 'from' param is set", function () {

                var type = "out";

                describe('two connections are allowed', function () {
                    var maxConnectionOccursService;
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var toConstructorParam = undefined; // jshint ignore:line
                    var maxOccurs = 2;

                    beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                        maxConnectionOccursService = new MaxConnectionOccursService(from, toConstructorParam, type, maxOccurs);
                    }]));

                    describe('more existing connections than allowed', function () {
                        it("should return valid:false, generic message and array with invalid ids", function () {

                            var idToValidate1 = "someid";
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
                                valid: false,
                                message: "No more than " + maxOccurs + " connections are allowed from type '" + from + "'",
                                invalidNodeIds: [idToValidate1]
                            };

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('less existing connections than allowed', function () {
                        it("should return valid:true, empty message and empty array with no invalid ids", function () {

                            var idToValidate1 = "someid1";
                            var idToValidate2 = "someid2";
                            var idToValidate3 = "someid3";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";
                            var nodeId3 = "someid33";

                            var nodes = [
                                {id: idToValidate1, type: from},
                                {id: idToValidate2, type: from},
                                {id: idToValidate3, type: from},
                                {id: nodeId1, type: to},
                                {id: nodeId2, type: to},
                                {id: nodeId3, type: to}
                            ];

                            var connections = [
                                {
                                    from: nodes[0],
                                    to: nodes[3]
                                },
                                {
                                    from: nodes[1],
                                    to: nodes[4]
                                },
                                {
                                    from: nodes[2],
                                    to: nodes[5]
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

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('equal number of existing and allowed connections', function () {
                        it("should return valid:true, empty message and empty array with no invalid ids", function () {
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

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('zero existing connections', function () {
                        it("should return valid:true, empty message and empty array with no invalid ids", function () {

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

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });
                });

                describe('no connections are allowed', function () {
                    var maxConnectionOccursService;
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var toConstructorParam = undefined; // jshint ignore:line
                    var maxOccurs = 0;

                    beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                        maxConnectionOccursService = new MaxConnectionOccursService(from, toConstructorParam, type, maxOccurs);
                    }]));

                    describe('more existing connections than allowed', function () {
                        it("should return valid:false, generic message and array with invalid ids", function () {

                            var idToValidate1 = "someid1";
                            var idToValidate2 = "someid2";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";

                            var nodes = [
                                {id: idToValidate1, type: from},
                                {id: idToValidate2, type: from},
                                {id: nodeId1, type: to},
                                {id: nodeId2, type: to}
                            ];

                            var connections = [
                                {
                                    from: nodes[0],
                                    to: nodes[2]
                                },
                                {
                                    from: nodes[1],
                                    to: nodes[3]
                                }
                            ];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: false,
                                message: "No connections are allowed from type '" + from + "'",
                                invalidNodeIds: [idToValidate1, idToValidate2]
                            };

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('no existing connections', function () {
                        it("should return valid:true, empty message and empty array with no invalid ids", function () {

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

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });
                });

                describe('custom message', function () {
                    var maxConnectionOccursService;
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var toConstructorParam = undefined; // jshint ignore:line
                    var maxOccurs = 2;
                    var customMessage = "Maximum number of connections is " + maxOccurs;

                    beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                        maxConnectionOccursService = new MaxConnectionOccursService(from, toConstructorParam, type, maxOccurs, customMessage);
                    }]));

                    it("should return valid:false, custom message and array with invalid ids", function () {

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
                            valid: false,
                            message: customMessage,
                            invalidNodeIds: [idToValidate]
                        };

                        expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                    });
                });
            });

            describe("only 'to' param is set", function () {

                var type = "in";

                describe('two connections are allowed', function () {
                    var maxConnectionOccursService;
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var fromConstructorParam = undefined; // jshint ignore:line
                    var maxOccurs = 2;

                    beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                        maxConnectionOccursService = new MaxConnectionOccursService(fromConstructorParam, to, type, maxOccurs);
                    }]));

                    describe('more existing connections than allowed', function () {
                        it("should return valid:false, generic message and array with invalid ids", function () {

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
                                    to: nodes[0],
                                    from: nodes[1]
                                },
                                {
                                    to: nodes[0],
                                    from: nodes[2]
                                },
                                {
                                    to: nodes[0],
                                    from: nodes[3]
                                }
                            ];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: false,
                                message: "No more than " + maxOccurs + " connections are allowed to type '" + to + "'",
                                invalidNodeIds: [idToValidate]
                            };

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('less existing connections than allowed', function () {
                        it("should return valid:true, empty message and empty array with no invalid ids", function () {

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
                                    to: nodes[0],
                                    from: nodes[2]
                                },
                                {
                                    to: nodes[1],
                                    from: nodes[3]
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

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('equal number of existing and allowed connections', function () {
                        it("should return valid:true, empty message and empty array with no invalid ids", function () {

                            var idToValidate1 = "someid1";
                            var idToValidate2 = "someid2";
                            var nodeId1 = "someid11";
                            var nodeId2 = "someid22";
                            var nodeId3 = "someid33";
                            var nodeId4 = "someid44";

                            var nodes = [
                                {id: idToValidate1, type: to},
                                {id: idToValidate2, type: to},
                                {id: nodeId1, type: from},
                                {id: nodeId2, type: from},
                                {id: nodeId3, type: from},
                                {id: nodeId4, type: from}
                            ];

                            var connections = [
                                {
                                    to: nodes[0],
                                    from: nodes[2]
                                },
                                {
                                    to: nodes[0],
                                    from: nodes[3]
                                },
                                {
                                    to: nodes[1],
                                    from: nodes[4]
                                },
                                {
                                    to: nodes[1],
                                    from: nodes[5]
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

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('zero existing connections', function () {
                        it("should return valid:true, empty message and empty array with no invalid ids", function () {
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

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });
                });

                describe('no connections are allowed', function () {
                    var maxConnectionOccursService;
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var fromConstructorParam = undefined; // jshint ignore:line
                    var maxOccurs = 0;

                    beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                        maxConnectionOccursService = new MaxConnectionOccursService(fromConstructorParam, to, type, maxOccurs);
                    }]));

                    describe('more existing connections than allowed', function () {
                        it("should return valid:false, generic message and array with invalid ids", function () {

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
                                    to: nodes[0],
                                    from: nodes[2]
                                },
                                {
                                    to: nodes[1],
                                    from: nodes[3]
                                }
                            ];

                            var valuesToValidate = {
                                nodes: nodes,
                                connections: connections
                            };

                            var validationResult = {
                                valid: false,
                                message: "No connections are allowed to type '" + to + "'",
                                invalidNodeIds: [idToValidate1, idToValidate2]
                            };

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                    describe('no existing connections', function () {
                        it("should return valid:true, empty message and empty array with no invalid ids", function () {

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

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });
                });

                describe('custom message', function () {
                    var maxConnectionOccursService;
                    var from = "nodeTypeA";
                    var to = "nodeTypeB";
                    var fromConstructorParam = undefined; // jshint ignore:line
                    var maxOccurs = 2;
                    var customMessage = "Maximum number of connections is " + maxOccurs;

                    beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                        maxConnectionOccursService = new MaxConnectionOccursService(fromConstructorParam, to, type, maxOccurs, customMessage);
                    }]));

                    it("should return valid:false, custom message and array with invalid ids", function () {
                        var idToValidate = "someid1";
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
                                to: nodes[0],
                                from: nodes[1]
                            },
                            {
                                to: nodes[0],
                                from: nodes[2]
                            },
                            {
                                to: nodes[0],
                                from: nodes[3]
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

                        expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                    });
                });
            });

            describe("both 'from' and 'to' params are set", function () {

                describe("outgoing connections", function () {

                    var type = "out";

                    describe('two connections are allowed', function () {
                        var maxConnectionOccursService;
                        var from = "nodeTypeA";
                        var to = "nodeTypeB";
                        var maxOccurs = 2;

                        beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                            maxConnectionOccursService = new MaxConnectionOccursService(from, to, type, maxOccurs);
                        }]));

                        describe('more existing connections than allowed', function () {
                            it("should return valid:false, generic message and array of invalid ids", function () {

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
                                    valid: false,
                                    message: "No more than " + maxOccurs + " connections are allowed from type '" + from + "' to type '" + to + "'",
                                    invalidNodeIds: [idToValidate1]
                                };

                                expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('less existing connections than allowed', function () {
                            it("should return valid:true and empty message", function () {

                                var idToValidate1 = "someid1";
                                var nodeId1 = "someid11";

                                var nodes = [
                                    {id: idToValidate1, type: from},
                                    {id: nodeId1, type: to}
                                ];

                                var connections = [
                                    {
                                        from: nodes[0],
                                        to: nodes[1]
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

                                expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('equal number of existing and allowed connections', function () {
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

                                expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('zero existing connections', function () {
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

                                expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });
                    });

                    describe('no connections are allowed', function () {
                        var maxConnectionOccursService;
                        var from = "nodeTypeA";
                        var to = "nodeTypeB";
                        var maxOccurs = 0;

                        beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                            maxConnectionOccursService = new MaxConnectionOccursService(from, to, type, maxOccurs);
                        }]));

                        describe('more existing connections than allowed', function () {
                            it("should return valid:false and generic message", function () {

                                var idToValidate1 = "someid1";
                                var nodeId1 = "someid11";

                                var nodes = [
                                    {id: idToValidate1, type: from},
                                    {id: nodeId1, type: to}
                                ];

                                var connections = [
                                    {
                                        from: nodes[0],
                                        to: nodes[1]
                                    }
                                ];

                                var valuesToValidate = {
                                    nodes: nodes,
                                    connections: connections
                                };

                                var validationResult = {
                                    valid: false,
                                    message: "No connections are allowed from type '" + from + "' to type '" + to + "'",
                                    invalidNodeIds: [idToValidate1]
                                };

                                expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
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

                                expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });
                    });

                    describe('custom message', function () {
                        var maxConnectionOccursService;
                        var from = "nodeTypeA";
                        var to = "nodeTypeB";
                        var maxOccurs = 2;
                        var customMessage = "Maximum number of connections is " + maxOccurs;

                        beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                            maxConnectionOccursService = new MaxConnectionOccursService(from, to, type, maxOccurs, customMessage);
                        }]));

                        it("should return valid:false and a custom message", function () {

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
                                valid: false,
                                message: customMessage,
                                invalidNodeIds: [idToValidate1]
                            };

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });

                });

                describe("incoming connections", function () {

                    var type = "in";

                    describe('two connections are allowed', function () {
                        var maxConnectionOccursService;
                        var from = "nodeTypeA";
                        var to = "nodeTypeB";
                        var maxOccurs = 2;

                        beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                            maxConnectionOccursService = new MaxConnectionOccursService(from, to, type, maxOccurs);
                        }]));

                        describe('more existing connections than allowed', function () {
                            it("should return valid:false, generic message and array of invalid ids", function () {

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

                                var validationResult = {
                                    valid: false,
                                    message: "No more than " + maxOccurs + " connections are allowed from type '" + from + "' to type '" + to + "'",
                                    invalidNodeIds: [idToValidate1]
                                };

                                expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('less existing connections than allowed', function () {
                            it("should return valid:true and empty message", function () {

                                var idToValidate1 = "someid1";
                                var nodeId1 = "someid11";

                                var nodes = [
                                    {id: idToValidate1, type: to},
                                    {id: nodeId1, type: from}
                                ];

                                var connections = [
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

                                expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('equal number of existing and allowed connections', function () {
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

                                expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });

                        describe('zero existing connections', function () {
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

                                expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });
                    });

                    describe('no connections are allowed', function () {
                        var maxConnectionOccursService;
                        var from = "nodeTypeA";
                        var to = "nodeTypeB";
                        var maxOccurs = 0;

                        beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                            maxConnectionOccursService = new MaxConnectionOccursService(from, to, type, maxOccurs);
                        }]));

                        describe('more existing connections than allowed', function () {
                            it("should return valid:false and generic message", function () {

                                var idToValidate1 = "someid1";
                                var nodeId1 = "someid11";

                                var nodes = [
                                    {id: idToValidate1, type: to},
                                    {id: nodeId1, type: from}
                                ];

                                var connections = [
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
                                    valid: false,
                                    message: "No connections are allowed from type '" + from + "' to type '" + to + "'",
                                    invalidNodeIds: [idToValidate1]
                                };

                                expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
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

                                expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                            });
                        });
                    });

                    describe('custom message', function () {
                        var maxConnectionOccursService;
                        var from = "nodeTypeA";
                        var to = "nodeTypeB";
                        var maxOccurs = 2;
                        var customMessage = "Maximum number of connections is " + maxOccurs;

                        beforeEach(inject(['dap.core.shared.validation.MaxConnectionOccurs', function (MaxConnectionOccursService) {
                            maxConnectionOccursService = new MaxConnectionOccursService(from, to, type, maxOccurs, customMessage);
                        }]));

                        it("should return valid:false and a custom message", function () {

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

                            var validationResult = {
                                valid: false,
                                message: customMessage,
                                invalidNodeIds: [idToValidate1]
                            };

                            expect(maxConnectionOccursService.validate(valuesToValidate)).toEqual(validationResult);
                        });
                    });
                });
            });
        });
    });
});