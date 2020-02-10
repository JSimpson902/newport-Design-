import { createElement } from 'lwc';
import { describeExtension } from 'builder_platform_interaction/flowExtensionLib';
import { fetchMergedFlowOutputVariables } from 'builder_platform_interaction/subflowsLib';
import { fetchDetailsForInvocableAction } from 'builder_platform_interaction/invocableActionLib';
import { mockSubmitForApprovalActionParameters, mockLocalActionParameters } from 'mock/calloutData';
import ResourceDetailsParameters from 'builder_platform_interaction/resourceDetailsParameters';
import {
    mockExtensionScreenfieldAutomaticOutputsModeResourceDetails,
    mockActionSubmitForApprovalAutomaticOutputsModeResourceDetails,
    mockActionLocalActionInAutomaticOutputsModeResourceDetails,
    mockSubflowInAutomaticOutputModeResourceDetails
} from 'mock/resourceDetailsData';
import { mockFlowRuntimeEmailFlowExtensionDescription } from 'mock/flowExtensionsData';
import { Store } from 'builder_platform_interaction/storeLib';
import { flowWithAllElementsUIModel } from 'mock/storeData';
import { flowWithActiveAndLatest as mockFlowWithActiveAndLatest } from 'serverData/GetFlowInputOutputVariables/flowWithActiveAndLatest.json';

const createComponentUnderTest = resourceDetails => {
    const el = createElement('builder_platform_interaction-resource-details-parameters', {
        is: ResourceDetailsParameters
    });
    el.resourceDetails = resourceDetails;
    document.body.appendChild(el);
    return el;
};

jest.mock('builder_platform_interaction/flowExtensionLib', () => ({
    describeExtension: jest.fn(() => Promise.resolve(mockFlowRuntimeEmailFlowExtensionDescription))
}));

jest.mock('builder_platform_interaction/invocableActionLib', () => ({
    fetchDetailsForInvocableAction: jest.fn(() => Promise.resolve(mockSubmitForApprovalActionParameters))
}));

jest.mock('builder_platform_interaction/subflowsLib', () => {
    const actual = require.requireActual('builder_platform_interaction/subflowsLib');
    return {
        fetchMergedFlowOutputVariables: jest.fn(flowName => {
            if (flowName === 'flowWithActiveAndLatest') {
                return Promise.resolve(
                    actual.getMergedInputOutputVariables(mockFlowWithActiveAndLatest).outputVariables
                );
            }
            return Promise.reject(`No flow with name ${flowName}`);
        }),
        getSubflowVariableLabelWithWarning: actual.getSubflowVariableLabelWithWarning
    };
});

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

jest.mock(
    '@salesforce/label/FlowBuilderSubflows.variableInLatestVersionOnly',
    () => ({ default: '{0} (Latest Version Only)' }),
    { virtual: true }
);

jest.mock(
    '@salesforce/label/FlowBuilderSubflows.variableInActiveVersionOnly',
    () => ({ default: '{0} (Active Version Only)' }),
    { virtual: true }
);

const SELECTORS = { SPINNER: '.spinner' };

const EXPECTED_MOCK_ORDERED_PARAMETERS_FOR_LC_EMAIL_IN_AUTO_MODE = [
    {
        apiName: 'disabled',
        label: 'Disabled',
        description: 'Prevents the user from modifying or copying the value.',
        typeIconName: 'utility:crossfilter'
    },
    {
        apiName: 'label',
        label: 'Label',
        description: 'The label that appears above the email field.',
        typeIconName: 'utility:text'
    },
    {
        apiName: 'placeholder',
        label: 'Placeholder Text',
        description:
            "Text that appears in the field when it's empty. Use placeholder text to give users a hint about what to enter in the field.",
        typeIconName: 'utility:text'
    },
    {
        apiName: 'readonly',
        label: 'Read Only',
        description: 'Prevents the user from modifying the value, but not from copying it.',
        typeIconName: 'utility:crossfilter'
    },
    {
        apiName: 'required',
        label: 'Required',
        description: 'Requires the user to enter a value.',
        typeIconName: 'utility:crossfilter'
    },
    {
        apiName: 'value',
        label: 'Value',
        description:
            "To provide a default value, set this attribute's value. To use the user-entered value elsewhere in your flow, store this attribute's output value in a variable.",
        typeIconName: 'utility:text'
    }
];

const EXPECTED_MOCK_ORDERED_PARAMETERS_FOR_ACTION_SUBMIT_FOR_APPROVAL_IN_AUTO_MODE = [
    {
        apiName: 'instanceId',
        label: 'Instance ID',
        description: 'The ID of the approval process instance.',
        typeIconName: 'utility:text'
    },
    {
        apiName: 'instanceStatus',
        label: 'Instance Status',
        description:
            'The status of the approval. The valid values are "Approved," "Rejected," "Removed," or "Pending."',
        typeIconName: 'utility:text'
    },
    {
        apiName: 'newWorkItemIds',
        label: 'New Work Item IDs',
        description: 'An array of the ID(s) of the work item(s) created for the next step in this approval process.',
        typeIconName: 'utility:text'
    },
    {
        apiName: 'actorIds',
        label: 'Next Approver IDs',
        description: 'An array of the ID(s) of the next approver(s).',
        typeIconName: 'utility:text'
    },
    {
        apiName: 'entityId',
        label: 'Record ID',
        description: 'The ID of the record submitted for approval.',
        typeIconName: 'utility:text'
    }
];

const EXPECTED_MOCK_ORDERED_PARAMETERS_FOR_ACTION_LOCAL_ACTION_IN_AUTO_MODE = [
    {
        apiName: 'greeting',
        label: 'greeting',
        description: null,
        typeIconName: 'utility:text'
    },
    {
        apiName: 'subject',
        label: 'subject',
        description: null,
        typeIconName: 'utility:text'
    }
];

const EXPECTED_MOCK_ORDERED_PARAMETERS_FOR_SUBFLOW_IN_AUTO_MODE = [
    { apiName: 'accountOutput', label: 'accountOutput', typeIconName: 'utility:sobject' },
    { apiName: 'accountOutputCollection', label: 'accountOutputCollection', typeIconName: 'utility:sobject' },
    { apiName: 'carOutput', label: 'carOutput (Latest Version Only)', typeIconName: 'utility:apex' },
    {
        apiName: 'carOutputCollection',
        label: 'carOutputCollection (Latest Version Only)',
        typeIconName: 'utility:apex'
    },
    { apiName: 'inputOutput1', label: 'inputOutput1', typeIconName: 'utility:text' },
    { apiName: 'inputOutput2', label: 'inputOutput2 (Active Version Only)', typeIconName: 'utility:text' },
    { apiName: 'output1', label: 'output1', typeIconName: 'utility:text' },
    { apiName: 'output2', label: 'output2 (Active Version Only)', typeIconName: 'utility:text' },
    { apiName: 'output3', label: 'output3 (Active Version Only)', typeIconName: 'utility:text' },
    { apiName: 'output4', label: 'output4 (Latest Version Only)', typeIconName: 'utility:text' }
];

describe('Resource Details parameters', () => {
    let resourceDetailsParametersComponent;
    beforeAll(() => {
        Store.setMockState(flowWithAllElementsUIModel);
    });
    afterAll(() => {
        Store.resetStore();
    });
    describe('Extension (ie: ligthning component) screenfield in automatic outputs mode', () => {
        describe('No fetch exception', () => {
            beforeEach(() => {
                resourceDetailsParametersComponent = createComponentUnderTest(
                    mockExtensionScreenfieldAutomaticOutputsModeResourceDetails
                );
            });
            describe('Parameters fetch server call OK and NO error', () => {
                test('check "Parameters" details (via API)', () => {
                    const parameters = resourceDetailsParametersComponent.parameters;
                    expect(parameters).toEqual(EXPECTED_MOCK_ORDERED_PARAMETERS_FOR_LC_EMAIL_IN_AUTO_MODE);
                });
                test('check UI: icon names, tooltip, labels...(snapshot) parameters displayed', () => {
                    expect(resourceDetailsParametersComponent).toMatchSnapshot();
                });
            });
            describe('Parameters fetch server call OK but error', () => {
                beforeAll(() => {
                    describeExtension.mockImplementation(() =>
                        Promise.reject(new Error('An error occured during extension parameters fetching'))
                    );
                });
                test('check "Parameters" details (via API)', () => {
                    const parameters = resourceDetailsParametersComponent.parameters;
                    expect(parameters).toHaveLength(0);
                });
                test('check UI: icon names, tooltip, labels (snapshot) no parameters displayed', () => {
                    expect(resourceDetailsParametersComponent).toMatchSnapshot();
                });
            });
        });
        describe('Fetch exception', () => {
            test('spinner should not be displayed)', () => {
                describeExtension.mockImplementation(() => {
                    throw new Error('Runtime exception this time');
                });
                resourceDetailsParametersComponent = createComponentUnderTest(
                    mockExtensionScreenfieldAutomaticOutputsModeResourceDetails
                );
                const spinner = resourceDetailsParametersComponent.shadowRoot.querySelector(SELECTORS.spinner);
                expect(spinner).toBeNull();
            });
        });
    });

    describe('core action', () => {
        describe('"submit for approval" in automatic outputs mode', () => {
            describe('No fetch exception', () => {
                beforeEach(() => {
                    resourceDetailsParametersComponent = createComponentUnderTest(
                        mockActionSubmitForApprovalAutomaticOutputsModeResourceDetails
                    );
                });
                describe('Parameters fetch server call OK and NO error', () => {
                    test('check "Parameters" details (via API)', () => {
                        const parameters = resourceDetailsParametersComponent.parameters;
                        expect(parameters).toEqual(
                            EXPECTED_MOCK_ORDERED_PARAMETERS_FOR_ACTION_SUBMIT_FOR_APPROVAL_IN_AUTO_MODE
                        );
                    });
                    test('check UI: icon names, tooltip, labels...(snapshot) parameters displayed', () => {
                        expect(resourceDetailsParametersComponent).toMatchSnapshot();
                    });
                });
                describe('Parameters fetch server call OK but error', () => {
                    beforeAll(() => {
                        fetchDetailsForInvocableAction.mockImplementation(() =>
                            Promise.reject(new Error('An error occured during extension parameters fetching'))
                        );
                    });
                    test('check "Parameters" details (via API)', () => {
                        const parameters = resourceDetailsParametersComponent.parameters;
                        expect(parameters).toHaveLength(0);
                    });
                    test('check UI: icon names, tooltip, labels (snapshot) no parameters displayed', () => {
                        expect(resourceDetailsParametersComponent).toMatchSnapshot();
                    });
                });
            });
        });

        describe('"Local action" in automatic outputs mode', () => {
            describe('No fetch exception', () => {
                beforeAll(() => {
                    fetchDetailsForInvocableAction.mockImplementation(() => Promise.resolve(mockLocalActionParameters));
                });
                beforeEach(() => {
                    resourceDetailsParametersComponent = createComponentUnderTest(
                        mockActionLocalActionInAutomaticOutputsModeResourceDetails
                    );
                });
                describe('Parameters fetch server call OK and NO error', () => {
                    test('check "Parameters" details (via API)', () => {
                        const parameters = resourceDetailsParametersComponent.parameters;
                        expect(parameters).toEqual(
                            EXPECTED_MOCK_ORDERED_PARAMETERS_FOR_ACTION_LOCAL_ACTION_IN_AUTO_MODE
                        );
                    });
                    test('check UI: icon names, tooltip, labels...(snapshot) parameters displayed', () => {
                        expect(resourceDetailsParametersComponent).toMatchSnapshot();
                    });
                });
                describe('Parameters fetch server call OK but error', () => {
                    beforeAll(() => {
                        fetchDetailsForInvocableAction.mockImplementation(() =>
                            Promise.reject(new Error('An error occured during extension parameters fetching'))
                        );
                    });
                    test('check "Parameters" details (via API)', () => {
                        const parameters = resourceDetailsParametersComponent.parameters;
                        expect(parameters).toHaveLength(0);
                    });
                    test('check UI: icon names, tooltip, labels (snapshot) no parameters displayed', () => {
                        expect(resourceDetailsParametersComponent).toMatchSnapshot();
                    });
                });
            });
        });
    });

    describe('Subflow in automatic outputs mode', () => {
        describe('No fetch exception', () => {
            beforeEach(() => {
                resourceDetailsParametersComponent = createComponentUnderTest(
                    mockSubflowInAutomaticOutputModeResourceDetails
                );
            });
            describe('Parameters fetch server call OK and NO error', () => {
                test('check "Parameters" details (via API)', () => {
                    const parameters = resourceDetailsParametersComponent.parameters;
                    expect(parameters).toEqual(EXPECTED_MOCK_ORDERED_PARAMETERS_FOR_SUBFLOW_IN_AUTO_MODE);
                });
                test('check UI: icon names, tooltip, labels...(snapshot) parameters displayed', () => {
                    expect(resourceDetailsParametersComponent).toMatchSnapshot();
                });
            });
            describe('Parameters fetch server call OK but error', () => {
                beforeAll(() => {
                    fetchMergedFlowOutputVariables.mockImplementation(() =>
                        Promise.reject(new Error('An error occured during subflow parameters fetching'))
                    );
                });
                test('check "Parameters" details (via API)', () => {
                    const parameters = resourceDetailsParametersComponent.parameters;
                    expect(parameters).toHaveLength(0);
                });
                test('check UI: icon names, tooltip, labels (snapshot) no parameters displayed', () => {
                    expect(resourceDetailsParametersComponent).toMatchSnapshot();
                });
            });
        });
        describe('Fetch exception', () => {
            test('spinner should not be displayed)', () => {
                describeExtension.mockImplementation(() => {
                    throw new Error('Runtime exception this time');
                });
                resourceDetailsParametersComponent = createComponentUnderTest(
                    mockSubflowInAutomaticOutputModeResourceDetails
                );
                const spinner = resourceDetailsParametersComponent.shadowRoot.querySelector(SELECTORS.spinner);
                expect(spinner).toBeNull();
            });
        });
    });
});
