define(["ngMockE2E"], function () {
    "use strict";

    describe('validation.uniqueField', function () {
        beforeEach(module('dap.shared.validation'));

        describe('validate', function () {

            describe('existing nodes are not an array', function () {
                var uniqueFieldService;

                inject(['dap.core.shared.validation.UniqueField', function (UniqueFieldService) {
                    uniqueFieldService = new UniqueFieldService("id");

                    it("should throw an exception if nodes are not of Array type", function () {
                        var nodes = {};

                        expect(uniqueFieldService.validate.bind({}, nodes)).toThrow(new Error("Invalid parameter passed - Array is expected"));
                    });
                }]);
            });

            describe('objects with equal ID field of string type', function () {
                var uniqueFieldService;
                var fieldName = "id";

                beforeEach(inject(['dap.core.shared.validation.UniqueField', function (UniqueFieldService) {
                    uniqueFieldService = new UniqueFieldService(fieldName);
                }]));

                describe("two duplicate nodes in array of 5 nodes", function () {
                    it("should return valid:false and generic message", function () {
                        var duplicateId = "duplicateid";

                        var nodes = [
                            {
                                id: "not duplicate 1"
                            },
                            {
                                id: duplicateId
                            },
                            {
                                id: "not duplicate 2"
                            },
                            {
                                id: "not duplicate 3"
                            },
                            {
                                id: duplicateId
                            }
                        ];

                        var validationResult = {
                            valid: false,
                            message: "The field " + fieldName + " should be unique amongst all nodes",
                            invalidNodeIds: [duplicateId]
                        };

                        expect(uniqueFieldService.validate(nodes)).toEqual(validationResult);
                    });
                });

                describe("no duplicate nodes with array of 3 nodes", function () {
                    it("should return valid:true and generic message", function () {
                        var nodes = [
                            {
                                id: "not duplicate 1",
                                index: 1
                            },
                            {
                                id: "not duplicate 2",
                                index: 2
                            },
                            {
                                id: "not duplicate 3",
                                index: 3
                            }
                        ];

                        var validationResult = {
                            valid: true,
                            message: "",
                            invalidNodeIds: []
                        };

                        expect(uniqueFieldService.validate(nodes)).toEqual(validationResult);
                    });
                });
            });

            describe('objects with equal "id" field of string type', function () {
                var uniqueFieldService;
                var fieldName = "type";

                beforeEach(inject(['dap.core.shared.validation.UniqueField', function (UniqueFieldService) {
                    uniqueFieldService = new UniqueFieldService(fieldName);
                }]));

                describe("two duplicate nodes in array of 5 nodes", function () {
                    it("should return valid:false and generic message", function () {
                        var duplicateTypeNodeId1 = "duplicatetypeid1";
                        var duplicateTypeNodeId2 = "duplicatetypeid2";
                        var duplicateType = "duplicatetype";
                        var duplicateId = "duplicateid";

                        var nodes = [
                            {
                                id: duplicateTypeNodeId1,
                                type: duplicateType
                            },
                            {
                                id: duplicateId,
                                type: "sometype1"
                            },
                            {
                                id: "not duplicate 2"
                            },
                            {
                                id: duplicateTypeNodeId2,
                                type: duplicateType
                            },
                            {
                                id: duplicateId,
                                type: "sometype2"
                            }
                        ];

                        var validationResult = {
                            valid: false,
                            message: "The field " + fieldName + " should be unique amongst all nodes",
                            invalidNodeIds: [duplicateTypeNodeId1, duplicateTypeNodeId2]
                        };

                        expect(uniqueFieldService.validate(nodes)).toEqual(validationResult);
                    });
                });
            });

            describe('custom error message', function () {
                var uniqueFieldService;
                var fieldName = "id";
                var customMessage = "There is more than 1 node with equal value of 'id' field";

                inject(['dap.core.shared.validation.UniqueField', function (UniqueFieldService) {
                    uniqueFieldService = new UniqueFieldService(fieldName, customMessage);

                    it("should return valid:false and generic message", function () {
                        var duplicateTypeNodeId1 = "duplicatetypeid1";
                        var duplicateTypeNodeId2 = "duplicatetypeid2";
                        var duplicateType = "duplicatetype";

                        var nodes = [
                            {
                                id: duplicateTypeNodeId1,
                                type: duplicateType
                            },
                            {
                                id: "someid1",
                                type: "sometype1"
                            },
                            {
                                id: "not duplicate 2"
                            },
                            {
                                id: duplicateTypeNodeId2,
                                type: duplicateType
                            },
                            {
                                id: "someid2",
                                type: "sometype2"
                            }
                        ];

                        var validationResult = {
                            valid: false,
                            message: customMessage,
                            invalidNodeIds: [duplicateTypeNodeId1, duplicateTypeNodeId2]
                        };

                        expect(uniqueFieldService.validate(nodes)).toEqual(validationResult);
                    });
                }]);
            });
        });
    });

});