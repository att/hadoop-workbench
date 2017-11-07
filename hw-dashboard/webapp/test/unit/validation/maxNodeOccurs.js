define(["ngMockE2E"], function () {
    "use strict";

    describe('validation.MaxNodeOccurs', function () {

        describe('constructor', function () {
            beforeEach(module('dap.shared.validation'));
            var MaxNodeOccursService;

            beforeEach(inject(['dap.core.shared.validation.MaxNodeOccurs', function (_MaxNodeOccursService_) {
                MaxNodeOccursService = _MaxNodeOccursService_;
            }]));

            describe('nodeType param', function () {
                it('should throw an exception if nodeType is undefined', function () {
                    /*jshint -W080*/
                    var nodeType = undefined;
                    var maxOccurs = 0;
                    expect(MaxNodeOccursService.bind({}, nodeType, maxOccurs)).toThrow(new Error('nodeType should be specified and should not be empty string'));
                });

                it('should throw an exception if nodeType is null', function () {
                    var nodeType = null;
                    var maxOccurs = 0;
                    expect(MaxNodeOccursService.bind({}, nodeType, maxOccurs)).toThrow(new Error('nodeType should be specified and should not be empty string'));
                });

                it('should throw an exception if nodeType is an empty string', function () {
                    var nodeType = "";
                    var maxOccurs = 0;
                    expect(MaxNodeOccursService.bind({}, nodeType, maxOccurs)).toThrow(new Error('nodeType should be specified and should not be empty string'));
                });
            });

            describe('maxOccurs param', function () {
                it('should throw an exception if maxOccurs is undefined', function () {
                    var nodeType = "nodeType";
                    /*jshint -W080*/
                    var maxOccurs = undefined;
                    expect(MaxNodeOccursService.bind({}, nodeType, maxOccurs)).toThrow(new Error('maxOccurs should be specified and be number greater than or equal to zero'));
                });

                it('should throw an exception if maxOccurs is null', function () {
                    var nodeType = "nodeType";
                    var maxOccurs = null;
                    expect(MaxNodeOccursService.bind({}, nodeType, maxOccurs)).toThrow(new Error('maxOccurs should be specified and be number greater than or equal to zero'));
                });

                it('should throw an exception if maxOccurs is less than zero', function () {
                    var nodeType = "nodeType";
                    var maxOccurs = -1;
                    expect(MaxNodeOccursService.bind({}, nodeType, maxOccurs)).toThrow(new Error('maxOccurs should be specified and be number greater than or equal to zero'));
                });

                it('should throw an exception if maxOccurs is a string', function () {
                    var nodeType = "nodeType";
                    var maxOccurs = "0";
                    expect(MaxNodeOccursService.bind({}, nodeType, maxOccurs)).toThrow(new Error('maxOccurs should be specified and be number greater than or equal to zero'));
                });
            });

        });

        describe('validate', function () {
            describe('two nodes are allowed', function () {
                beforeEach(module('dap.shared.validation'));
                var maxNodeOccursService;
                var nodeType = "nodeType";
                var maxOccurs = 2;

                beforeEach(inject(['dap.core.shared.validation.MaxNodeOccurs', function (MaxNodeOccursService) {
                    maxNodeOccursService = new MaxNodeOccursService(nodeType, maxOccurs);
                }]));

                describe('existing nodes are not an array', function () {
                    it("should throw an exception if nodes are not of Array type", function () {
                        var nodes = {};

                        expect(maxNodeOccursService.validate.bind({}, nodes)).toThrow(new Error("Invalid parameter passed - Array is expected"));
                    });
                });

                describe('more existing nodes than allowed', function () {
                    it("should return valid:false and generic message", function () {
                        var nodes = [
                            {
                                type: nodeType
                            },
                            {
                                type: nodeType
                            },
                            {
                                type: nodeType
                            }
                        ];
                        var validationResult = {
                            valid: false,
                            message: "No more than " + maxOccurs + " nodes of type " + nodeType + " are allowed"
                        };

                        expect(maxNodeOccursService.validate(nodes)).toEqual(validationResult);
                    });
                });

                describe('less existing nodes than allowed', function () {
                    it("should return valid:true and empty message", function () {
                        var nodes = [
                            {
                                type: nodeType
                            }
                        ];
                        var validationResult = {
                            valid: true,
                            message: ""
                        };

                        expect(maxNodeOccursService.validate(nodes)).toEqual(validationResult);
                    });
                });

                describe('equal number of existing and allowed nodes', function () {
                    it("should return valid:true and empty message", function () {
                        var nodes = [
                            {
                                type: nodeType
                            },
                            {
                                type: nodeType
                            }
                        ];
                        var validationResult = {
                            valid: true,
                            message: ""
                        };

                        expect(maxNodeOccursService.validate(nodes)).toEqual(validationResult);
                    });
                });

                describe('zero existing nodes', function () {
                    it("should return valid:true and empty message", function () {
                        var nodes = [];
                        var validationResult = {
                            valid: true,
                            message: ""
                        };

                        expect(maxNodeOccursService.validate(nodes)).toEqual(validationResult);
                    });
                });
            });

            describe('no nodes are allowed', function () {
                beforeEach(module('dap.shared.validation'));
                var maxNodeOccursService;
                var nodeType = "nodeType";
                var maxOccurs = 0;

                beforeEach(inject(['dap.core.shared.validation.MaxNodeOccurs', function (MaxNodeOccursService) {
                    maxNodeOccursService = new MaxNodeOccursService(nodeType, maxOccurs);
                }]));

                describe('more existing nodes than allowed', function () {
                    it("should return valid:false and generic message", function () {
                        var nodes = [
                            {
                                type: nodeType
                            }
                        ];
                        var validationResult = {
                            valid: false,
                            message: "No nodes of type " + nodeType + " are allowed"
                        };

                        expect(maxNodeOccursService.validate(nodes)).toEqual(validationResult);
                    });
                });

                describe('equal allowed and existing nodes', function () {
                    it("should return valid:true and empty message", function () {
                        var nodes = [];
                        var validationResult = {
                            valid: true,
                            message: ""
                        };

                        expect(maxNodeOccursService.validate(nodes)).toEqual(validationResult);
                    });
                });
            });

            describe('custom message', function () {
                beforeEach(module('dap.shared.validation'));
                var maxNodeOccursService;
                var nodeType = "nodeType";
                var maxOccurs = 1;
                var customMessage = "Maximum number of nodes is " + maxOccurs;

                beforeEach(inject(['dap.core.shared.validation.MaxNodeOccurs', function (MaxNodeOccursService) {
                    maxNodeOccursService = new MaxNodeOccursService(nodeType, maxOccurs, customMessage);
                }]));

                it("should return valid:false and a custom message", function () {
                    var nodes = [
                        {
                            type: nodeType
                        },
                        {
                            type: nodeType
                        }
                    ];
                    var validationResult = {
                        valid: false,
                        message: customMessage
                    };

                    expect(maxNodeOccursService.validate(nodes)).toEqual(validationResult);
                });
            });

        });
    });
});