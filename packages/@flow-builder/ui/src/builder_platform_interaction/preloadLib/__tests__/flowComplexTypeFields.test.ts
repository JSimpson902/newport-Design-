// @ts-nocheck
import { describeExtensions } from 'builder_platform_interaction/flowExtensionLib';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { fetchDetailsForInvocableAction } from 'builder_platform_interaction/invocableActionLib';
import { loadApexClasses } from 'builder_platform_interaction/preloadLib';
import { fetchFieldsForEntity } from 'builder_platform_interaction/sobjectLib';
import { fetchActiveOrLatestFlowOutputVariables } from 'builder_platform_interaction/subflowsLib';
import * as flowWithAllElements from 'mock/flows/flowWithAllElements.json';
import { getMetadataFlowElementByName } from 'mock/flows/mock-flow';
import {
    accountSObjectCollectionVariable,
    accountSObjectVariable,
    actionCallAutomaticOutput,
    actionCallElement,
    apexCallAutomaticAnonymousAccountOutput,
    apexCallManualAccountOutput,
    apexCarVariable,
    apexComplexTypeCollectionVariable,
    emailScreenField,
    emailScreenFieldAutomaticOutput,
    externalServiceAutomaticOutput,
    lookupRecordAutomaticOutput,
    lookupRecordCollectionAutomaticOutput,
    lookupRecordOutputReference,
    screenElement,
    subflowAutomaticOutput,
    subflowWithAllVariableTypes
} from 'mock/storeData';
import {
    loadFieldsForApexClassesInFlow,
    loadFieldsForExtensionsInFlow,
    loadFieldsForExtensionsInFlowFromMetadata,
    loadFieldsForSobjectsInFlow,
    loadFieldsForSubflowsInFlow,
    loadFieldsForSubflowsInFlowFromMetadata,
    loadParametersForInvocableActionsInFlow,
    loadParametersForInvocableApexActionsInFlowFromMetadata,
    loadParametersForStageStepsInFlow
} from '../flowComplexTypeFields';

jest.mock('builder_platform_interaction/sobjectLib', () => ({
    fetchFieldsForEntity: jest.fn().mockImplementation(() => Promise.resolve())
}));

jest.mock('builder_platform_interaction/flowExtensionLib', () => ({
    describeExtensions: jest.fn().mockImplementation(() => Promise.resolve())
}));

jest.mock('builder_platform_interaction/invocableActionLib', () => ({
    fetchDetailsForInvocableAction: jest.fn().mockImplementation(() => Promise.resolve())
}));

jest.mock('builder_platform_interaction/preloadLib', () => ({
    loadApexClasses: jest.fn().mockImplementation(() => Promise.resolve())
}));

jest.mock('builder_platform_interaction/subflowsLib', () => ({
    fetchActiveOrLatestFlowOutputVariables: jest.fn().mockImplementation(() => Promise.resolve())
}));

describe('flowComplexTypeFields', () => {
    const stateWithElements = (elements) => {
        const elementsMap = elements.reduce((acc, element) => {
            acc[element.guid] = element;
            return acc;
        }, {});
        return { elements: elementsMap };
    };
    describe('loadFieldsForSobjectsInFlow', () => {
        const expectOneCallToFetchFieldsForEntity = (expectedEntityName) => {
            expect(fetchFieldsForEntity.mock.calls).toHaveLength(1);
            expect(fetchFieldsForEntity.mock.calls[0][0]).toBe(expectedEntityName);
        };
        it('Load fields for sobject variables', async () => {
            await loadFieldsForSobjectsInFlow(stateWithElements([accountSObjectVariable]));
            expectOneCallToFetchFieldsForEntity('Account');
        });
        it('Does not load fields for sobject variable collections', async () => {
            await loadFieldsForSobjectsInFlow(stateWithElements([accountSObjectCollectionVariable]));
            expect(fetchFieldsForEntity.mock.calls).toHaveLength(0);
        });
        it('Load fields for lookups in automatic output mode with first record only', async () => {
            await loadFieldsForSobjectsInFlow(stateWithElements([lookupRecordAutomaticOutput]));
            expectOneCallToFetchFieldsForEntity('Account');
        });
        it('Does not load fields for lookups in automatic output mode when we retrieve all records', async () => {
            await loadFieldsForSobjectsInFlow(stateWithElements([lookupRecordCollectionAutomaticOutput]));
            expect(fetchFieldsForEntity.mock.calls).toHaveLength(0);
        });
        it('Does not load fields for lookups not in automatic output mode', async () => {
            await loadFieldsForSobjectsInFlow(stateWithElements([lookupRecordOutputReference]));
            expect(fetchFieldsForEntity.mock.calls).toHaveLength(0);
        });
    });
    describe('loadFieldsForApexClassesInFlow', () => {
        it('Load fields for apex type variables', async () => {
            await loadFieldsForApexClassesInFlow(stateWithElements([apexCarVariable]));
            expect(loadApexClasses.mock.calls).toHaveLength(1);
        });
        it('Does not load fields for apex type variable collections', async () => {
            await loadFieldsForApexClassesInFlow(stateWithElements([apexComplexTypeCollectionVariable]));
            expect(loadApexClasses.mock.calls).toHaveLength(0);
        });
    });
    describe('loadFieldsForExtensionsInFlow', () => {
        const expectOneCallToDescribeExtensions = (expectedNames) => {
            expect(describeExtensions.mock.calls).toHaveLength(1);
            expect(describeExtensions.mock.calls[0][0]).toEqual(expectedNames);
        };
        it('Load fields for screen fields in automatic output mode', async () => {
            await loadFieldsForExtensionsInFlow(stateWithElements([screenElement, emailScreenFieldAutomaticOutput]));
            expectOneCallToDescribeExtensions([emailScreenFieldAutomaticOutput.extensionName]);
        });
        it('Does not load fields for screen fields not in automatic mode', async () => {
            await loadFieldsForExtensionsInFlow(stateWithElements([screenElement, emailScreenField]));
            expectOneCallToDescribeExtensions([]);
        });
    });
    describe('loadFieldsForExtensionsInFlowFromMetadata', () => {
        const expectOneCallToDescribeExtensions = (expectedNames) => {
            expect(describeExtensions.mock.calls).toHaveLength(1);
            expect(describeExtensions.mock.calls[0][0]).toEqual(expectedNames);
        };
        const screenElementMetadata = getMetadataFlowElementByName(flowWithAllElements, screenElement.name);

        it('Load fields for screen fields in automatic output mode', async () => {
            await loadFieldsForExtensionsInFlowFromMetadata([
                screenElementMetadata,
                ...screenElementMetadata.fields.filter(
                    (screenField) => screenField.name === emailScreenFieldAutomaticOutput.name
                )
            ]);
            expectOneCallToDescribeExtensions([emailScreenFieldAutomaticOutput.extensionName]);
        });
        it('Does not load fields for screen fields not in automatic mode', async () => {
            await loadFieldsForExtensionsInFlowFromMetadata([
                screenElementMetadata,
                ...screenElementMetadata.fields.filter((screenField) => screenField.name === emailScreenField.name)
            ]);
            expectOneCallToDescribeExtensions([]);
        });
    });
    describe('loadParametersForInvocableActionsInFlow', () => {
        const expectThreeCallsToFetchParametersForInvocableAction = (...expectedActionCallNameAndType) => {
            expect(fetchDetailsForInvocableAction.mock.calls).toHaveLength(3);
            expect(fetchDetailsForInvocableAction.mock.calls[0][0]).toEqual(expectedActionCallNameAndType[0]);
            expect(fetchDetailsForInvocableAction.mock.calls[1][0]).toEqual(expectedActionCallNameAndType[1]);
            expect(fetchDetailsForInvocableAction.mock.calls[2][0]).toEqual(expectedActionCallNameAndType[2]);
        };
        it('Load invocable action parameters for actions in automatic output mode', async () => {
            await loadParametersForInvocableActionsInFlow(
                stateWithElements([
                    actionCallAutomaticOutput,
                    apexCallAutomaticAnonymousAccountOutput,
                    externalServiceAutomaticOutput
                ])
            );
            expectThreeCallsToFetchParametersForInvocableAction(
                {
                    actionName: 'chatterPost',
                    actionType: 'chatterPost'
                },
                {
                    actionName: 'GetAccount',
                    actionType: 'apex'
                },
                {
                    actionName: 'BankServiceNew.addAccount',
                    actionType: 'externalService'
                }
            );
        });
        it('Does not load invocable action parameters for actions not in automatic output mode', async () => {
            await loadParametersForInvocableActionsInFlow(stateWithElements([actionCallElement]));
            expect(fetchDetailsForInvocableAction.mock.calls).toHaveLength(0);
        });
    });
    describe('loadFieldsForSubflowsInFlow', () => {
        it('Load subflow output variables for subflows in automatic output mode', async () => {
            await loadFieldsForSubflowsInFlow(stateWithElements([subflowAutomaticOutput]));
            expect(fetchActiveOrLatestFlowOutputVariables.mock.calls).toHaveLength(1);
            expect(fetchActiveOrLatestFlowOutputVariables.mock.calls[0][0]).toBe('flowWithActiveAndLatest');
        });
    });
    describe('loadParametersForInvocableApexActionsInFlowFromMetadata', () => {
        const expectOneCallToFetchParametersForInvocableAction = (expectedActionCallNameAndType) => {
            expect(fetchDetailsForInvocableAction.mock.calls).toHaveLength(1);
            expect(fetchDetailsForInvocableAction.mock.calls[0][0]).toEqual(expectedActionCallNameAndType);
        };
        it('Load invocable action parameters only for apex actions in automatic output mode', async () => {
            await loadParametersForInvocableApexActionsInFlowFromMetadata([
                getMetadataFlowElementByName(flowWithAllElements, actionCallAutomaticOutput.name),
                getMetadataFlowElementByName(flowWithAllElements, apexCallAutomaticAnonymousAccountOutput.name),
                getMetadataFlowElementByName(flowWithAllElements, externalServiceAutomaticOutput.name),
                getMetadataFlowElementByName(flowWithAllElements, apexCallManualAccountOutput.name)
            ]);
            expectOneCallToFetchParametersForInvocableAction({
                actionName: 'GetAccount',
                actionType: 'apex'
            });
        });
        it('Does not load invocable action parameters for actions not in automatic output mode', async () => {
            await loadParametersForInvocableApexActionsInFlowFromMetadata([
                getMetadataFlowElementByName(flowWithAllElements, actionCallElement.name)
            ]);
            expect(fetchDetailsForInvocableAction.mock.calls).toHaveLength(0);
        });
    });
    describe('loadFieldsForSubflowsInFlowFromMetadata', () => {
        it('Loads fields for subflows in metadata only if set to store output automatically', async () => {
            await loadFieldsForSubflowsInFlowFromMetadata([
                getMetadataFlowElementByName(flowWithAllElements, subflowAutomaticOutput.name),
                getMetadataFlowElementByName(flowWithAllElements, subflowWithAllVariableTypes.name)
            ]);
            expect(fetchActiveOrLatestFlowOutputVariables.mock.calls).toHaveLength(1);
            expect(fetchActiveOrLatestFlowOutputVariables.mock.calls[0][0]).toEqual(subflowAutomaticOutput.flowName);
        });
        it('Does not load fields for subflows that do not store output automatically', async () => {
            await loadFieldsForSubflowsInFlowFromMetadata([
                getMetadataFlowElementByName(flowWithAllElements, subflowWithAllVariableTypes.name)
            ]);
            expect(fetchActiveOrLatestFlowOutputVariables.mock.calls).toHaveLength(0);
        });
    });
    describe('loadParametersForStageStepsInFlow', () => {
        it('loads parameters for all step stages', async () => {
            const step = {
                elementType: ELEMENT_TYPE.STAGE_STEP,
                actionName: 'aName',
                actionType: 'aType'
            };

            const state = {
                elements: {
                    '123': step
                }
            };

            await loadParametersForStageStepsInFlow(state);
            expect(fetchDetailsForInvocableAction.mock.calls).toHaveLength(1);
            expect(fetchDetailsForInvocableAction.mock.calls[0][0]).toEqual({
                actionName: step.actionName,
                actionType: step.actionType
            });
        });
    });
});
