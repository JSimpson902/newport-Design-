import {
    retrieveResourceComplexTypeFields,
    isAutomaticOutputElementWithoutChildren
} from '../complexTypeLib';
import * as store from 'mock/storeData';
import { mockFlowRuntimeEmailFlowExtensionDescription } from 'mock/flowExtensionsData';
import { accountFields as mockAccountFields } from 'serverData/GetFieldsForEntity/accountFields.json';
import { chatterPostActionParameters as mockChatterPostActionParameters } from 'serverData/GetInvocableActionParameters/chatterPostActionParameters.json';
import { getAccountFromApexAnonymousOutputActionParameters as mockGetAccountFromApexAnonymousOutputActionParameters } from 'serverData/GetInvocableActionParameters/getAccountFromApexAnonymousOutputActionParameters.json';
import { getAccountNameFromApexAnonymousOutputActionParameters as mockGetAccountNameFromApexAnonymousOutputActionParameters } from 'serverData/GetInvocableActionParameters/getAccountNameFromApexAnonymousOutputActionParameters.json';
import { logACallActionParameters as mockLogACallActionParameters } from 'serverData/GetInvocableActionParameters/logACallActionParameters.json';
import { getParametersForInvocableAction } from 'builder_platform_interaction/invocableActionLib';
import { getCachedExtension } from 'builder_platform_interaction/flowExtensionLib';
import { setApexClasses } from 'builder_platform_interaction/apexTypeLib';
import { apexTypesForFlow } from 'serverData/GetApexTypes/apexTypesForFlow.json';
import { expectFieldsAreComplexTypeFieldDescriptions } from 'builder_platform_interaction/builderTestUtils';

jest.mock('builder_platform_interaction/sobjectLib', () => {
    return {
        getFieldsForEntity: jest
            .fn()
            .mockImplementation(() => mockAccountFields)
    };
});

jest.mock('builder_platform_interaction/flowExtensionLib', () => {
    return {
        getCachedExtension: jest
            .fn()
            .mockImplementation(
                () => mockFlowRuntimeEmailFlowExtensionDescription
            )
    };
});

const mockImplementationForGetParametersForInvocableAction = ({
    actionName,
    actionType
}) => {
    const key = `${actionType}-${actionName}`;
    switch (key) {
        case 'chatterPost-chatterPost':
            return mockChatterPostActionParameters;
        case 'quickAction-Case.LogACall':
            return mockLogACallActionParameters;
        case 'apex-getAccounts':
            return mockGetAccountFromApexAnonymousOutputActionParameters;
        case 'apex-InvocableGetAccountName':
            return mockGetAccountNameFromApexAnonymousOutputActionParameters;
        default:
            return undefined;
    }
};

jest.mock('builder_platform_interaction/invocableActionLib', () => {
    return {
        getParametersForInvocableAction: jest
            .fn()
            .mockImplementation(({ actionName, actionType }) =>
                mockImplementationForGetParametersForInvocableAction({
                    actionName,
                    actionType
                })
            )
    };
});

describe('complexTypeFieldDescription', () => {
    beforeAll(() => {
        setApexClasses(apexTypesForFlow);
    });
    afterAll(() => {
        setApexClasses(null);
    });
    describe('retrieveResourceComplexTypeFields', () => {
        it('returns fields for entity when element data type is SObject', () => {
            const fields = retrieveResourceComplexTypeFields(
                store.accountSObjectVariable
            );
            expectFieldsAreComplexTypeFieldDescriptions(fields);
        });
        it('returns properties for apex class when element data type is Apex', () => {
            const fields = retrieveResourceComplexTypeFields(
                store.apexCarVariable
            );
            expectFieldsAreComplexTypeFieldDescriptions(fields);
        });
        it('returns extension parameters when element data type is LIGHTNING_COMPONENT_OUTPUT', () => {
            const fields = retrieveResourceComplexTypeFields(
                store.emailScreenFieldAutomaticOutput
            );
            expectFieldsAreComplexTypeFieldDescriptions(fields);
        });
        it('return action parameters when element data type is ACTION_OUTPUT', () => {
            const fields = retrieveResourceComplexTypeFields(
                store.actionCallAutomaticOutput
            );
            expectFieldsAreComplexTypeFieldDescriptions(fields);
        });
        it('returns entity fields for action single anonymous automatic SObject output', () => {
            const fields = retrieveResourceComplexTypeFields(
                store.apexCallAutomaticAnonymousAccountOutput
            );
            expectFieldsAreComplexTypeFieldDescriptions(fields);
            expect(fields).toEqual(mockAccountFields);
        });
        it('returns undefined for action single anonymous automatic primitive output', () => {
            const fields = retrieveResourceComplexTypeFields(
                store.apexCallAutomaticAnonymousStringOutput
            );

            expect(fields).toBeUndefined();
        });
    });
    describe('isAutomaticOutputElementWithoutChildren', () => {
        describe('For action elements', () => {
            afterEach(() => {
                getParametersForInvocableAction.mockImplementation(
                    ({ actionName, actionType }) =>
                        mockImplementationForGetParametersForInvocableAction({
                            actionName,
                            actionType
                        })
                );
            });
            it('returns true for an action element in automatic output mode that has no children', () => {
                expect(
                    isAutomaticOutputElementWithoutChildren(
                        store.caseLogACallAutomatic
                    )
                ).toBe(true);
            });
            it('returns undefined for an action if action parameters have not been loaded yet', () => {
                getParametersForInvocableAction.mockImplementation(
                    () => undefined
                );
                expect(
                    isAutomaticOutputElementWithoutChildren(
                        store.caseLogACallAutomatic
                    )
                ).toBeUndefined();
            });
            it('returns false for an action element in automatic mode that has children', () => {
                expect(
                    isAutomaticOutputElementWithoutChildren(
                        store.actionCallAutomaticOutput
                    )
                ).toBe(false);
            });
        });
        describe('For LC screen fields', () => {
            afterEach(() => {
                getCachedExtension.mockImplementation(
                    () => mockFlowRuntimeEmailFlowExtensionDescription
                );
            });
            // Currently, LC screen fields always have outputs
            it('returns false for a screen field in automatic mode that has children', () => {
                expect(
                    isAutomaticOutputElementWithoutChildren(
                        store.emailScreenFieldAutomaticOutput
                    )
                ).toBe(false);
            });
            it('returns undefined for a screen field in automatic mode for which properties have not been loaded yet', () => {
                getCachedExtension.mockImplementation(() => undefined);
                expect(
                    isAutomaticOutputElementWithoutChildren(
                        store.emailScreenFieldAutomaticOutput
                    )
                ).toBeUndefined();
            });
        });
    });
});