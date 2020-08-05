// @ts-nocheck
import { createElement } from 'lwc';
import ParameterList from '../parameterList';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { generateGuid } from 'builder_platform_interaction/storeLib';
import { getValueFromHydratedItem } from 'builder_platform_interaction/dataMutationLib';
import {
    getAdvancedOptionCheckbox,
    getUseAdvancedOptionComponent
} from 'builder_platform_interaction/builderTestUtils';
import {
    ConfigurationEditorTypeMappingChangeEvent,
    DynamicTypeMappingChangeEvent
} from 'builder_platform_interaction/events';

jest.mock('builder_platform_interaction/ferovResourcePicker', () =>
    require('builder_platform_interaction_mocks/ferovResourcePicker')
);
jest.mock('builder_platform_interaction/outputResourcePicker', () =>
    require('builder_platform_interaction_mocks/outputResourcePicker')
);
jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

const defaultInputHeader = 'Send to action';
const defaultOutputHeader = 'Received from action';
const defaultEmptyInputsTitle = 'No inputs';
const defaultEmptyInputsBody = 'No variables to define';
const defaultEmptyInputsOutputsTitle = 'No inputs and No outputs';
const defaultEmptyInputsOutputsBody = 'This action doesn’t have or return any data';

const defaultInputParameters = [
    {
        label: { value: 'Community ID', error: null },
        name: { value: 'communityId', error: null },
        isInput: true,
        isRequired: false,
        dataType: 'String',
        value: { value: '"3824e478-141e-48e5-b1cd-5dbfd5868435"', error: null },
        valueDataType: 'reference',
        rowIndex: generateGuid()
    },
    {
        label: { value: 'Subject Name or Id', error: null },
        name: { value: 'subjectNameOrId', error: null },
        isInput: true,
        isRequired: true,
        dataType: 'String',
        value: { value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f', error: null },
        valueDataType: 'reference',
        rowIndex: generateGuid()
    },
    {
        label: { value: 'Message', error: null },
        name: { value: 'text', error: null },
        isInput: true,
        isRequired: true,
        dataType: 'String',
        value: { value: 'This is a message', error: null },
        valueDataType: 'String',
        rowIndex: generateGuid()
    }
];

const defaultOutputParameters = [
    {
        label: { value: 'Feed ID', error: null },
        name: { value: 'feedId', error: null },
        isInput: false,
        isRequired: false,
        dataType: 'String',
        value: { value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f', error: null },
        valueDataType: 'reference',
        rowIndex: generateGuid()
    },
    {
        label: { value: 'Account ID', error: null },
        name: { value: 'accountId', error: null },
        isInput: false,
        isRequired: false,
        dataType: 'String',
        value: { value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f', error: null },
        valueDataType: 'reference',
        rowIndex: generateGuid()
    }
];

const defaultParameterList = (storeOutputAutomatically = false, automaticOutputHandlingSupported = false) => ({
    inputs: defaultInputParameters,
    outputs: defaultOutputParameters,
    storeOutputAutomatically,
    automaticOutputHandlingSupported
});

const parameterListWithInputs = (storeOutputAutomatically = false, automaticOutputHandlingSupported = false) => ({
    inputs: defaultInputParameters,
    outputs: [],
    storeOutputAutomatically,
    automaticOutputHandlingSupported
});

const parameterListWithOutputs = (storeOutputAutomatically = false, automaticOutputHandlingSupported = false) => ({
    inputs: [],
    outputs: defaultOutputParameters,
    storeOutputAutomatically,
    automaticOutputHandlingSupported
});

const parameterListWithConfigurationEditor = (
    storeOutputAutomatically = false,
    automaticOutputHandlingSupported = false,
    configurationEditor = null
) => ({
    inputs: defaultInputParameters,
    outputs: defaultOutputParameters,
    storeOutputAutomatically,
    automaticOutputHandlingSupported,
    configurationEditor
});

const selectors = {
    divInputs: '.inputs',
    divOutputs: '.outputs',
    emptyInputs: '.emptyInputsMessage',
    emptyOutputs: '.emptyOutputsMessage',
    inputHeader: '.inputHeader',
    outputHeader: '.outputHeader',
    emptyInputsOutputs: '.emptyInputsOutputsMessage',
    goneCamping: '.goneCamping',
    parameterItem: 'builder_platform_interaction-parameter-item',
    configurationEditor: 'builder_platform_interaction-custom-property-editor'
};

const getInputsDiv = (parameterList) => parameterList.shadowRoot.querySelector(selectors.divInput);

const getOutputsDiv = (parameterList) => parameterList.shadowRoot.querySelector(selectors.divOutputs);

const getInputParameterItems = (parameterList) => {
    return parameterList.shadowRoot.querySelector(selectors.divInputs).querySelectorAll(selectors.parameterItem);
};

const getOutputParameterItems = (parameterList) => {
    return parameterList.shadowRoot.querySelector(selectors.divOutputs).querySelectorAll(selectors.parameterItem);
};

const getEmptyInputs = (parameterList) => {
    return parameterList.shadowRoot.querySelector(selectors.emptyInputs).querySelector(selectors.goneCamping);
};

const getEmptyInputsOutputs = (parameterList) => {
    return parameterList.shadowRoot.querySelector(selectors.emptyInputsOutputs).querySelector(selectors.goneCamping);
};

const getInputHeader = (parameterList) => parameterList.shadowRoot.querySelector(selectors.inputHeader);

const getOutputHeader = (parameterList) => parameterList.shadowRoot.querySelector(selectors.outputHeader);

const getConfigurationEditor = (parameterList) => parameterList.shadowRoot.querySelector(selectors.configurationEditor);

function createComponentForTest({
    elementType = ELEMENT_TYPE.ACTION_CALL,
    inputHeader = defaultInputHeader,
    outputHeader = defaultOutputHeader,
    emptyInputsTitle = defaultEmptyInputsTitle,
    emptyInputsBody = defaultEmptyInputsBody,
    emptyInputsOutputsBody = defaultEmptyInputsOutputsBody,
    emptyInputsOutputsTitle = defaultEmptyInputsOutputsTitle,
    inputs = [],
    outputs = [],
    sortInputs = true,
    sortOutputs = true,
    storeOutputAutomatically = false,
    automaticOutputHandlingSupported = false,
    configurationEditor
} = {}) {
    const el = createElement('builder_platform_interaction-parameter-list', {
        is: ParameterList
    });
    Object.assign(el, {
        elementType,
        inputHeader,
        outputHeader,
        inputs,
        outputs,
        emptyInputsTitle,
        emptyInputsBody,
        emptyInputsOutputsBody,
        emptyInputsOutputsTitle,
        sortInputs,
        sortOutputs,
        storeOutputAutomatically,
        automaticOutputHandlingSupported,
        configurationEditor
    });
    document.body.appendChild(el);
    return el;
}

describe('parameter-list', () => {
    describe('Automatic output handling not supported', () => {
        describe('without values', () => {
            let parameterList;
            beforeEach(() => {
                parameterList = createComponentForTest();
            });
            it('should not display any input parameters', () => {
                const inputDiv = getInputsDiv(parameterList);
                expect(inputDiv).toBeNull();
            });
            it('should display the empty inputs and outputs message', () => {
                const emptyInputsOutputsElement = getEmptyInputsOutputs(parameterList);
                expect(emptyInputsOutputsElement.title).toEqual(defaultEmptyInputsOutputsTitle);
                expect(emptyInputsOutputsElement.body).toEqual(defaultEmptyInputsOutputsBody);
            });
            it('should not contains input div header', () => {
                const inputHeader = getInputHeader(parameterList);
                expect(inputHeader).toBeNull();
            });
            it('should not contains output div header', () => {
                const outputHeader = getOutputHeader(parameterList);
                expect(outputHeader).toBeNull();
            });
            it('should not display the outputs div', () => {
                const outputsDiv = getOutputsDiv(parameterList);
                expect(outputsDiv).toBeNull();
            });
        });
        describe('with default values', () => {
            let parameterList;
            beforeEach(() => {
                parameterList = createComponentForTest(defaultParameterList());
            });
            it('should contains input div header', () => {
                const inputHeader = getInputHeader(parameterList);
                expect(inputHeader).not.toBeNull();
                expect(inputHeader.firstChild.nodeValue).toEqual(defaultInputHeader);
            });
            it('should contains output div header', () => {
                const outputHeader = getOutputHeader(parameterList);
                expect(outputHeader).not.toBeNull();
                expect(outputHeader.firstChild.nodeValue).toEqual(defaultOutputHeader);
            });
            it('contains input parameters in inputs div', () => {
                const parameterItems = getInputParameterItems(parameterList);
                expect(parameterItems).toHaveLength(defaultInputParameters.length);
            });
            it('sorts input parameters by isRequired and label', () => {
                const parameterItems = getInputParameterItems(parameterList);
                const expectedInputs = [
                    { name: 'text', label: 'Message', isRequired: true },
                    {
                        name: 'subjectNameOrId',
                        label: 'Subject Name or Id',
                        isRequired: true
                    },
                    {
                        name: 'communityId',
                        label: 'Community ID',
                        isRequired: false
                    }
                ];
                const inputParameters = [...parameterItems].map((parameterItem) => {
                    return {
                        name: getValueFromHydratedItem(parameterItem.item.name),
                        label: getValueFromHydratedItem(parameterItem.item.label),
                        isRequired: parameterItem.item.isRequired
                    };
                });
                expect(inputParameters).toEqual(expectedInputs);
            });
            it('contains output parameters in outputs div', () => {
                const parameterItems = getOutputParameterItems(parameterList);
                expect(parameterItems).toHaveLength(defaultOutputParameters.length);
            });
            it('sorts outputs parameters by label', () => {
                const parameterItems = getOutputParameterItems(parameterList);
                const expectedOutputs = [
                    {
                        name: 'accountId',
                        label: 'Account ID',
                        isRequired: false
                    },
                    { name: 'feedId', label: 'Feed ID', isRequired: false }
                ];
                const outputParameters = [...parameterItems].map((parameterItem) => {
                    return {
                        name: getValueFromHydratedItem(parameterItem.item.name),
                        label: getValueFromHydratedItem(parameterItem.item.label),
                        isRequired: parameterItem.item.isRequired
                    };
                });
                expect(outputParameters).toEqual(expectedOutputs);
            });
        });
    });
    describe('Automatic output handling supported', () => {
        let parameterList;
        beforeEach(() => {
            parameterList = createComponentForTest(defaultParameterList(true, true));
        });
        it('contains input parameters in inputs div', () => {
            const parameterItems = getInputParameterItems(parameterList);
            expect(parameterItems).toHaveLength(defaultInputParameters.length);
        });
        it('sorts input parameters by isRequired and label', () => {
            const parameterItems = getInputParameterItems(parameterList);
            const expectedInputs = [
                { name: 'text', label: 'Message', isRequired: true },
                {
                    name: 'subjectNameOrId',
                    label: 'Subject Name or Id',
                    isRequired: true
                },
                {
                    name: 'communityId',
                    label: 'Community ID',
                    isRequired: false
                }
            ];
            const inputParameters = [...parameterItems].map((parameterItem) => {
                return {
                    name: getValueFromHydratedItem(parameterItem.item.name),
                    label: getValueFromHydratedItem(parameterItem.item.label),
                    isRequired: parameterItem.item.isRequired
                };
            });
            expect(inputParameters).toEqual(expectedInputs);
        });
        it('Does not display the output div', () => {
            const outputsDiv = getOutputsDiv(parameterList);
            expect(outputsDiv).toBeNull();
        });
        it('Display the Use Advanced Option checkbox', () => {
            const advancedOptionCheckbox = getAdvancedOptionCheckbox(parameterList);
            expect(advancedOptionCheckbox).toBeDefined();
            expect(advancedOptionCheckbox.type).toBe('checkbox');
            expect(advancedOptionCheckbox.checked).toBe(false);
        });
        it('should not contains output div header', () => {
            const outputHeader = getOutputHeader(parameterList);
            expect(outputHeader).toBeNull();
        });
    });
    describe('Automatic output handling supported with inputs only', () => {
        let parameterList;
        beforeEach(() => {
            parameterList = createComponentForTest(parameterListWithInputs(true, true));
        });
        it('contains input parameters in inputs div', () => {
            const parameterItems = getInputParameterItems(parameterList);
            expect(parameterItems).toHaveLength(defaultInputParameters.length);
        });
        it('Should not display the Use Advanced Option checkbox', () => {
            const advancedOptionCheckbox = getUseAdvancedOptionComponent(parameterList);
            expect(advancedOptionCheckbox).toBeNull();
        });
        it('should not contains output div header', () => {
            const outputHeader = getOutputHeader(parameterList);
            expect(outputHeader).toBeNull();
        });
    });
    describe('Automatic output handling supported with outputs only', () => {
        let parameterList;
        beforeEach(() => {
            parameterList = createComponentForTest(parameterListWithOutputs(false, true));
        });
        it('Display the Use Advanced Option checkbox', () => {
            const advancedOptionCheckbox = getAdvancedOptionCheckbox(parameterList);
            expect(advancedOptionCheckbox).toBeDefined();
            expect(advancedOptionCheckbox.type).toBe('checkbox');
            expect(advancedOptionCheckbox.checked).toBe(true);
        });
        it('should contains output div header', () => {
            const outputHeader = getOutputHeader(parameterList);
            expect(outputHeader).not.toBeNull();
            expect(outputHeader.firstChild.nodeValue).toEqual(defaultOutputHeader);
        });
        it('should not contains input div header', () => {
            const inputHeader = getInputHeader(parameterList);
            expect(inputHeader).toBeNull();
        });
        it('should contain empty inputs message in input tab', () => {
            const nothing = getEmptyInputs(parameterList);
            expect(nothing.title).toEqual(defaultEmptyInputsTitle);
            expect(nothing.body).toEqual(defaultEmptyInputsBody);
        });
    });
    describe('Automatic output handling supported with advanced option', () => {
        let parameterList;
        beforeEach(() => {
            parameterList = createComponentForTest(defaultParameterList(false, true));
        });
        it('contains input parameters in inputs div', () => {
            const parameterItems = getInputParameterItems(parameterList);
            expect(parameterItems).toHaveLength(defaultInputParameters.length);
        });
        it('sorts input parameters by isRequired and label', () => {
            const parameterItems = getInputParameterItems(parameterList);
            const expectedInputs = [
                { name: 'text', label: 'Message', isRequired: true },
                {
                    name: 'subjectNameOrId',
                    label: 'Subject Name or Id',
                    isRequired: true
                },
                {
                    name: 'communityId',
                    label: 'Community ID',
                    isRequired: false
                }
            ];
            const inputParameters = [...parameterItems].map((parameterItem) => {
                return {
                    name: getValueFromHydratedItem(parameterItem.item.name),
                    label: getValueFromHydratedItem(parameterItem.item.label),
                    isRequired: parameterItem.item.isRequired
                };
            });
            expect(inputParameters).toEqual(expectedInputs);
        });
        it('contains output parameters in outputs div', () => {
            const parameterItems = getOutputParameterItems(parameterList);
            expect(parameterItems).toHaveLength(defaultOutputParameters.length);
        });
        it('Display the Use Advanced Option checkbox', () => {
            const advancedOptionCheckbox = getAdvancedOptionCheckbox(parameterList);
            expect(advancedOptionCheckbox).toBeDefined();
            expect(advancedOptionCheckbox.type).toBe('checkbox');
            expect(advancedOptionCheckbox.checked).toBe(true);
        });
        it('sorts outputs parameters by label', () => {
            const parameterItems = getOutputParameterItems(parameterList);
            const expectedOutputs = [
                { name: 'accountId', label: 'Account ID', isRequired: false },
                { name: 'feedId', label: 'Feed ID', isRequired: false }
            ];
            const outputParameters = [...parameterItems].map((parameterItem) => {
                return {
                    name: getValueFromHydratedItem(parameterItem.item.name),
                    label: getValueFromHydratedItem(parameterItem.item.label),
                    isRequired: parameterItem.item.isRequired
                };
            });
            expect(outputParameters).toEqual(expectedOutputs);
        });
        it('should contains output div header', () => {
            const outputHeader = getOutputHeader(parameterList);
            expect(outputHeader).not.toBeNull();
            expect(outputHeader.firstChild.nodeValue).toEqual(defaultOutputHeader);
        });
    });
    describe('custom property editor', () => {
        let parameterList;
        beforeEach(() => {
            parameterList = createComponentForTest(
                parameterListWithConfigurationEditor(false, true, {
                    name: 'c:helloWord',
                    errors: []
                })
            );
        });
        it('should create configuration editor component if configuration editor is defined', () => {
            const configurationEditor = getConfigurationEditor(parameterList);
            expect(configurationEditor).not.toBeNull();
        });
        it('should not display input divs if configuration editor is defined', () => {
            const inputsDiv = getInputsDiv(parameterList);
            expect(inputsDiv).toBeNull();
        });

        it('handles cpe type mapping change event and fires the dynamic type mapping changed event', async () => {
            const configurationEditor = getConfigurationEditor(parameterList);
            const handler = jest.fn();
            parameterList.addEventListener(DynamicTypeMappingChangeEvent.EVENT_NAME, handler);
            configurationEditor.dispatchEvent(new ConfigurationEditorTypeMappingChangeEvent('T__input', 'Account'));
            await Promise.resolve();
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].detail).toMatchObject({
                typeName: 'T__input',
                typeValue: 'Account',
                isConfigurable: true,
                error: undefined,
                rowIndex: undefined
            });
        });
    });
});
