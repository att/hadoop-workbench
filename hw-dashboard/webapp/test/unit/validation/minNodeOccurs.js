define(["ngMockE2E"], function () {
    "use strict";

    describe('validation.MinNodeOccurs', function () {

        describe('constructor', function () {
            beforeEach(module('dap.shared.validation'));
            var MinNodeOccursService;

            beforeEach(inject(['dap.core.shared.validation.MinNodeOccurs', function (_MinNodeOccursService_) {
                MinNodeOccursService = _MinNodeOccursService_;
            }]));

            describe('nodeType param', function () {
                it('should throw an exception if nodeType is undefined', function () {
                    /*jshint -W080*/
                    var nodeType = undefined;
                    var minOccurs = 0;
                    expect(MinNodeOccursService.bind({}, nodeType, minOccurs)).toThrow(new Error('nodeType should be specified and should not be empty string'));
                });

                it('should throw an exception if nodeType is null', function () {
                    var nodeType = null;
                    var minOccurs = 0;
                    expect(MinNodeOccursService.bind({}, nodeType, minOccurs)).toThrow(new Error('nodeType should be specified and should not be empty string'));
                });

                it('should throw an exception if nodeType is an empty string', function () {
                    var nodeType = "";
                    var minOccurs = 0;
                    expect(MinNodeOccursService.bind({}, nodeType, minOccurs)).toThrow(new Error('nodeType should be specified and should not be empty string'));
                });
            });

            describe('minOccurs param', function () {
                it('should throw an exception if minOccurs is undefined', function () {
                    var nodeType = "nodeType";
                    /*jshint -W080*/
                    var minOccurs = undefined;
                    expect(MinNodeOccursService.bind({}, nodeType, minOccurs)).toThrow(new Error('minOccurs should be specified and be number greater than or equal to zero'));
                });

                it('should throw an exception if minOccurs is null', function () {
                    var nodeType = "nodeType";
                    var minOccurs = null;
                    expect(MinNodeOccursService.bind({}, nodeType, minOccurs)).toThrow(new Error('minOccurs should be specified and be number greater than or equal to zero'));
                });

                it('should throw an exception if minOccurs is less than zero', function () {
                    var nodeType = "nodeType";
                    var minOccurs = -1;
                    expect(MinNodeOccursService.bind({}, nodeType, minOccurs)).toThrow(new Error('minOccurs should be specified and be number greater than or equal to zero'));
                });

                it('should throw an exception if minOccurs is a string', function () {
                    var nodeType = "nodeType";
                    var minOccurs = "0";
                    expect(MinNodeOccursService.bind({}, nodeType, minOccurs)).toThrow(new Error('minOccurs should be specified and be number greater than or equal to zero'));
                });
            });

        });

        describe('validate', function () {
            describe('two nodes are required', function () {
                beforeEach(module('dap.shared.validation'));
                var minNodeOccursService;
                var nodeType = "nodeType";
                var minOccurs = 2;

                beforeEach(inject(['dap.core.shared.validation.MinNodeOccurs', function (MinNodeOccursService) {
                    minNodeOccursService = new MinNodeOccursService(nodeType, minOccurs);
                }]));

                describe('existing nodes are not an array', function () {
                    it("should throw an exception if nodes are not of Array type", function () {
                        var nodes = {};

                        expect(minNodeOccursService.validate.bind({}, nodes)).toThrow(new Error("Invalid parameter passed - Array is expected"));
                    });
                });

                describe('more existing nodes than required', function () {
                    it("should return valid:true and empty message", function () {
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
                            valid: true,
                            message: ""
                        };

                        expect(minNodeOccursService.validate(nodes)).toEqual(validationResult);
                    });
                });

                describe('less existing nodes than required', function () {
                    it("should return valid:false and generic message", function () {
                        var nodes = [
                            {
                                type: nodeType
                            }
                        ];
                        var validationResult = {
                            valid: false,
                            message: 'At least ' + minOccurs + ' node of type ' + nodeType + ' is expected'
                        };

                        expect(minNodeOccursService.validate(nodes)).toEqual(validationResult);
                    });
                });

                describe('equal number of existing and required nodes', function () {
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

                        expect(minNodeOccursService.validate(nodes)).toEqual(validationResult);
                    });
                });

                describe('zero existing nodes', function () {
                    it("should return valid:false and generic message", function () {
                        var nodes = [];
                        var validationResult = {
                            valid: false,
                            message: 'At least ' + minOccurs + ' node of type ' + nodeType + ' is expected'
                        };

                        expect(minNodeOccursService.validate(nodes)).toEqual(validationResult);
                    });
                });
            });

            describe('no nodes are required', function () {
                beforeEach(module('dap.shared.validation'));
                var minNodeOccursService;
                var nodeType = "nodeType";
                var minOccurs = 0;

                beforeEach(inject(['dap.core.shared.validation.MinNodeOccurs', function (MinNodeOccursService) {
                    minNodeOccursService = new MinNodeOccursService(nodeType, minOccurs);
                }]));

                describe('more existing nodes than required', function () {
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

                        expect(minNodeOccursService.validate(nodes)).toEqual(validationResult);
                    });
                });

                describe('no existing nodes', function () {
                    it("should return valid:true and empty message", function () {
                        var nodes = [];
                        var validationResult = {
                            valid: true,
                            message: ""
                        };

                        expect(minNodeOccursService.validate(nodes)).toEqual(validationResult);
                    });
                });
            });

            describe('custom message', function () {
                beforeEach(module('dap.shared.validation'));
                var minNodeOccursService;
                var nodeType = "nodeType";
                var minOccurs = 2;
                var customMessage = "Minimum number of nodes is " + minOccurs;

                beforeEach(inject(['dap.core.shared.validation.MinNodeOccurs', function (MinNodeOccursService) {
                    minNodeOccursService = new MinNodeOccursService(nodeType, minOccurs, customMessage);
                }]));

                it("should return valid:false and a custom message", function () {
                    var nodes = [
                        {
                            type: nodeType
                        }
                    ];
                    var validationResult = {
                        valid: false,
                        message: customMessage
                    };

                    expect(minNodeOccursService.validate(nodes)).toEqual(validationResult);
                });
            });
        });
    });

});