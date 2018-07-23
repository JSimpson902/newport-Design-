import { validateTextWithMergeFields, validateMergeField } from '../mergeFieldValidation';

jest.mock('builder_platform_interaction-sobject-lib', () => {
    const fields = {
        'Account' : {
            Name : {}
        }
    };
    return {
        getFieldsForEntity: (entityName, callback) => callback(fields[entityName])
    };
});

describe('Merge field validation', () => {
    it('Returns a validation error when it is not a valid merge field', (done) => {
        validateMergeField('{!strVar1').then(validationErrors => {
            expect(validationErrors).toEqual([
                {
                    "endIndex": 8,
                    "errorType": "notAValidMergeField",
                    "message": "FlowBuilderMergeFieldValidation.notAValidMergeField",
                    "startIndex": 0
                }]);
            done();
        });
    });
    describe('Variables', () => {
        it('Returns no validation error when it references an existing variable', (done) => {
            validateMergeField('{!strVar1}').then(validationErrors => {
                expect(validationErrors).toEqual([]);
                done();
            });
        });
        it('Returns a validation error when it does not reference an existing variable', (done) => {
            validateMergeField('{!not_existing_variable}').then(validationErrors => {
                expect(validationErrors).toEqual([
                    {
                        "endIndex": 22,
                        "errorType": "unknownMergeField",
                        "message": "FlowBuilderMergeFieldValidation.unknownResource",
                        "startIndex": 2
                    }]);
                done();
            });
        });
        it('Returns no validation error when it references an existing variable record field', (done) => {
            validateMergeField('{!accVar1.Name}').then(validationErrors => {
                expect(validationErrors).toEqual([]);
                done();
            });
        });
        it('is not case-sensitive for field names', (done) => {
            validateMergeField('{!accVar1.NAME}').then(validationErrors => {
                expect(validationErrors).toEqual([]);
                done();
            });
        });
        it('Returns a validation error when it does not reference an existing variable record field', (done) => {
            validateMergeField('{!accVar1.Unknown}').then(validationErrors => {
                expect(validationErrors).toEqual([
                    {
                        "endIndex": 16,
                        "errorType": "unknownMergeField",
                        "message": "FlowBuilderMergeFieldValidation.unknownRecordField",
                        "startIndex": 2
                    }]);
                done();
            });
        });
        it('Returns a validation error for variable field merge field when variable does not exist', (done) => {
            validateMergeField('{!unknownVariable.Unknown}').then(validationErrors => {
                expect(validationErrors).toEqual([
                    {
                        "endIndex": 24,
                        "errorType": "unknownMergeField",
                        "message": "FlowBuilderMergeFieldValidation.unknownResource",
                        "startIndex": 2
                    }]);
                done();
            });
        });
    });
    describe('Global constants', () => {
        it('Returns no validation error when it references {!$GlobalConstant.EmptyString}', (done) => {
            validateMergeField('{!$GlobalConstant.EmptyString}').then(validationErrors => {
                expect(validationErrors).toEqual([]);
                done();
            });
        });
        it('Returns a validation error when it references a global constant that does not exist', (done) => {
            validateMergeField('{!$GlobalConstant.A}').then(validationErrors => {
                expect(validationErrors).toEqual([
                    {
                        "endIndex": 18,
                        "errorType": "invalidGlobalConstant",
                        "message": "FlowBuilderMergeFieldValidation.invalidGlobalConstant",
                        "startIndex": 2
                    }]);
                done();
            });
        });
        it('Returns a validation error when it references {!$GlobalConstant.EmptyString} when global constants are not allowed', (done) => {
            validateMergeField('{!$GlobalConstant.EmptyString}', { allowGlobalConstants : false }).then(validationErrors => {
                expect(validationErrors).toEqual([
                    {
                        "endIndex": 28,
                        "errorType": "notAValidMergeField",
                        "message": "FlowBuilderMergeFieldValidation.globalConstantsNotAllowed",
                        "startIndex": 2
                    }]);
                done();
            });
        });
    });
    describe('Elements', () => {
        it('Returns no validation error when it references a canvas element that can have a fault connector (actionCall ...)', (done) => {
            validateMergeField('{!actionCall1}').then(validationErrors => {
                expect(validationErrors).toEqual([]);
                done();
            });
        });
        it('Returns a validation error when it references a canvas element without a type', (done) => {
            validateMergeField('{!assignment1}').then(validationErrors => {
                expect(validationErrors).toEqual([
                    {
                        "endIndex": 12,
                        "errorType": "wrongDataType",
                        "message": "FlowBuilderMergeFieldValidation.resourceCannotBeUsedAsMergeField",
                        "startIndex": 2
                    }]);
                done();
            });
        });
        it('Returns a validation error when it references a property of a canvas element', (done) => {
            validateMergeField('{!actionCall1.property}').then(validationErrors => {
                expect(validationErrors).toEqual([
                    {
                        "endIndex": 21,
                        "errorType": "notAValidMergeField",
                        "message": "FlowBuilderMergeFieldValidation.notAValidMergeField",
                        "startIndex": 2
                    }]);
                done();
            });
        });
        it('Returns no validation error when it references a decision outcome', (done) => {
            validateMergeField('{!outcome1}').then(validationErrors => {
                expect(validationErrors).toEqual([]);
                done();
            });
        });
    });
});
describe('Text with merge fields validation', () => {
    it('Returns no validation error when it references existing variables', (done) => {
        validateTextWithMergeFields('{!accVar1.Name} == {!strVar1}').then(validationErrors => {
            expect(validationErrors).toEqual([]);
            done();
        });
    });
});