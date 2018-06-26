import { mutateTextWithMergeFields, demutateTextWithMergeFields } from '../mergeFieldsMutation';


jest.mock('builder_platform_interaction-store-utils', () => {
    const guidToDevNameMapping = { 'VARIABLE_1' : 'variable1', 'VARIABLE_2' : 'variable2' };
    const devNameToGuidMapping = { 'variable1' : 'VARIABLE_1', 'variable2' : 'VARIABLE_2' };
    return {
        getElementByGuid: (guid) => {
            return {
                guid,
                name : guidToDevNameMapping[guid]
            };
        },
        getElementByDevName: (devName) => {
            return {
                guid : devNameToGuidMapping[devName],
                name : devName
            };
        }
    };
});

describe('Text with merge fields mutation', () => {
    it('Replaces guid by devName for a merge field inside a template', () => {
        expect(mutateTextWithMergeFields('a template with {!VARIABLE_1}')).toEqual('a template with {!variable1}');
    });
    it('Replaces guid by devName for a compound merge field inside a template', () => {
        expect(mutateTextWithMergeFields('{!VARIABLE_1.name}')).toEqual('{!variable1.name}');
    });
    it('Replaces guids by devName for multiple merge fields inside a template', () => {
        expect(mutateTextWithMergeFields(' {!VARIABLE_1.name} {!VARIABLE_2.id}')).toEqual(' {!variable1.name} {!variable2.id}');
    });
    it('Ignores unknown elements for merge fields', () => {
        expect(mutateTextWithMergeFields(' {!NOT_A_VARIABLE.a}')).toEqual(' {!NOT_A_VARIABLE.a}');
    });
});

describe('Text with merge fields demutation', () => {
    it('Replaces devName by guid for a merge field inside a template', () => {
        expect(demutateTextWithMergeFields('{!variable1}')).toEqual('{!VARIABLE_1}');
    });
    it('Replaces devName by guid for a compound merge field inside a template', () => {
        expect(demutateTextWithMergeFields('{!variable1.first}')).toEqual('{!VARIABLE_1.first}');
    });
    it('Replaces guids by devName for multiple merge fields inside a template', () => {
        expect(demutateTextWithMergeFields(' {!variable1.a} {!variable2.a}')).toEqual(' {!VARIABLE_1.a} {!VARIABLE_2.a}');
    });
    it('Ignores unknown elements for merge fields', () => {
        expect(demutateTextWithMergeFields(' {!not_a_variable.a}')).toEqual(' {!not_a_variable.a}');
    });
    it('Properly handle {!{!', () => {
        expect(demutateTextWithMergeFields(' {!{!VARIABLE_1}}')).toEqual(' {!{!VARIABLE_1}}');
    });
});