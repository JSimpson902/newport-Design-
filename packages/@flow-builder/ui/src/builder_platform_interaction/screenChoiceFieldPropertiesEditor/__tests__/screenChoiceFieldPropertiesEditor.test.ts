// @ts-nocheck
import { updateInlineResourceProperties } from 'builder_platform_interaction/actions';
import {
    createTestScreenField,
    INTERACTION_COMPONENTS_SELECTORS,
    query,
    SCREEN_NO_DEF_VALUE,
    setDocumentBodyChildren,
    ticks
} from 'builder_platform_interaction/builderTestUtils';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import {
    EditElementEvent,
    EditListItemEvent,
    PropertyChangedEvent,
    ScreenEditorEventName
} from 'builder_platform_interaction/events';
import { ELEMENT_TYPE, FlowScreenFieldType } from 'builder_platform_interaction/flowMetadata';
import { addCurrentValueToEvent } from 'builder_platform_interaction/screenEditorCommonUtils';
import { ChoiceDisplayOptions } from 'builder_platform_interaction/screenEditorUtils';
import { loggingUtils } from 'builder_platform_interaction/sharedUtils';
import { Store } from 'builder_platform_interaction/storeLib';
import * as usebyMock from 'builder_platform_interaction/usedByLib';
import { createElement } from 'lwc';
import ScreenChoiceFieldPropertiesEditor from '../screenChoiceFieldPropertiesEditor';

const { logInteraction } = loggingUtils;

const mockEvent = new Event('test');
jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));
jest.mock('builder_platform_interaction/ferovResourcePicker', () =>
    require('builder_platform_interaction_mocks/ferovResourcePicker')
);

jest.mock('builder_platform_interaction/selectors', () => {
    return {
        readableElementsSelector: jest.fn((data) => Object.values(data.elements))
    };
});

jest.mock('builder_platform_interaction/screenEditorCommonUtils', () => {
    return {
        addCurrentValueToEvent: jest.fn(() => mockEvent)
    };
});

jest.mock('builder_platform_interaction/screenComponentVisibilitySection', () =>
    require('builder_platform_interaction_mocks/screenComponentVisibilitySection')
);

jest.mock('builder_platform_interaction/storeUtils', () => {
    const { ELEMENT_TYPE } = require('builder_platform_interaction/flowMetadata');
    return {
        getElementByGuid(guid) {
            let elementType;
            let picklistField;
            if (guid.includes('RCS')) {
                elementType = ELEMENT_TYPE.RECORD_CHOICE_SET;
            } else if (guid.includes('PICKLIST')) {
                elementType = ELEMENT_TYPE.PICKLIST_CHOICE_SET;
                picklistField = 'val1';
            } else if (guid.includes('altPCS')) {
                elementType = ELEMENT_TYPE.PICKLIST_CHOICE_SET;
                picklistField = null;
            } else {
                elementType = ELEMENT_TYPE.CHOICE;
            }
            return {
                name: guid,
                choiceText: 'choice text ' + guid,
                guid,
                elementType,
                picklistField
            };
        }
    };
});

jest.mock('builder_platform_interaction/sobjectLib', () => {
    return {
        fetchFieldsForEntity(entity) {
            return new Promise((resolve, reject) => {
                resolve(entity);
                reject(entity);
            });
        },
        getEntityFieldWithApiName(entity, field) {
            if (field) {
                return {
                    activePicklistValues: [field]
                };
            }
            return null;
        }
    };
});

jest.mock('builder_platform_interaction/usedByLib', () => {
    return {
        usedBy: jest.fn()
    };
});

jest.mock('builder_platform_interaction/builderUtils', () => {
    const actual = jest.requireActual('builder_platform_interaction/builderUtils');
    return Object.assign({}, actual);
});

jest.mock('builder_platform_interaction/sharedUtils', () => {
    const actual = jest.requireActual('builder_platform_interaction_mocks/sharedUtils');
    const commonUtils = Object.assign({}, actual.commonUtils, {
        format: jest.fn().mockImplementation((formatString, ...args) => {
            return formatString.replace(/\{(\d+)\}/gm, (match, index) => {
                const substitution = args[index];
                if (substitution === undefined) {
                    return match;
                }
                return substitution + '';
            });
        })
    });
    return Object.assign({}, actual, {
        invokeModal: jest.fn(),
        commonUtils
    });
});

jest.mock('builder_platform_interaction/actions', () => {
    return {
        updateInlineResourceProperties: jest.fn(() => 'test response')
    };
});

const SELECTORS = {
    ...INTERACTION_COMPONENTS_SELECTORS,
    REQUIRED_CHECKBOX: 'builder_platform_interaction-screen-property-field[name="isRequired"]',
    DEFAULT_VALUE: 'builder_platform_interaction-screen-property-field[name="defaultValue"]',
    CHOICE_SELECTOR: 'builder_platform_interaction-screen-property-field[name="choice"]',
    HELP_TEXT: 'builder_platform_interaction-screen-property-field[name="helpText"]',
    SCALE: 'builder_platform_interaction-screen-property-field.scale',
    DISPLAY_RADIO_GROUP: 'lightning-radio-group.test-display-radio-group',
    DISPLAY_TYPE_COMBOBOX: 'builder_platform_interaction-screen-property-field.display-combobox'
};

const fieldName = 'field1';
const field = createTestScreenField(fieldName, FlowScreenFieldType.RadioButtons, SCREEN_NO_DEF_VALUE, {
    dataType: 'String',
    validation: false,
    helpText: false
});

const createComponentUnderTest = (props) => {
    const el = createElement('builder_platform_interaction-screen-choice-field-properties-editor', {
        is: ScreenChoiceFieldPropertiesEditor
    });

    Object.assign(
        el,
        props || {
            field
        }
    );

    setDocumentBodyChildren(el);

    return el;
};

const getDisplayTypeCombobox = (screenChoiceFieldPropEditor) => {
    return screenChoiceFieldPropEditor.shadowRoot.querySelector(SELECTORS.DISPLAY_TYPE_COMBOBOX);
};

const getVisualDisplayRadioGroup = (screenChoiceFieldPropEditor) => {
    return screenChoiceFieldPropEditor.shadowRoot.querySelector(SELECTORS.DISPLAY_RADIO_GROUP);
};

const getLabelDescription = (screenChoiceFieldPropEditor) => {
    return screenChoiceFieldPropEditor.shadowRoot.querySelector(SELECTORS.LABEL_DESCRIPTION);
};

const getDataTypePicker = (screenChoiceFieldPropEditor) => {
    return screenChoiceFieldPropEditor.shadowRoot.querySelector(SELECTORS.DATA_TYPE_PICKER);
};

describe('screen-choice-field-properties-editor for radio field, type String', () => {
    let screenChoiceFieldPropEditor;
    beforeEach(() => {
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.RadioButtons, SCREEN_NO_DEF_VALUE, {
                dataType: 'String',
                validation: false,
                helpText: false
            })
        });
    });
    it('Should not have scale input ', () => {
        const scale = screenChoiceFieldPropEditor.shadowRoot.querySelector(SELECTORS.SCALE);

        expect(scale).toBeFalsy();
    });
    it('API Name field should be filled in', () => {
        const nameAndLabelField = getLabelDescription(screenChoiceFieldPropEditor);
        expect(nameAndLabelField.devName.value).toBe(fieldName);
    });
    it('Label field should be filled in', () => {
        const nameAndLabelField = getLabelDescription(screenChoiceFieldPropEditor);
        expect(nameAndLabelField).toBeDefined();
        expect(nameAndLabelField.label.value).toBe(fieldName);
    });
    it('Default value field is not present', () => {
        const renderedDefaultValueField = query(screenChoiceFieldPropEditor, SELECTORS.DEFAULT_VALUE);
        expect(renderedDefaultValueField).toBeNull();
    });
    it('Required checkbox is present and not checked', () => {
        const renderedRequiredCheckbox = query(screenChoiceFieldPropEditor, SELECTORS.REQUIRED_CHECKBOX);
        expect(renderedRequiredCheckbox).toBeDefined();
        expect(renderedRequiredCheckbox.value).toBeFalsy();
    });
    it('Datatype drop down is set to not required', () => {
        const dataTypeDropDown = getDataTypePicker(screenChoiceFieldPropEditor);
        expect(dataTypeDropDown).toBeDefined();
        expect(dataTypeDropDown.required).toBeFalsy();
    });
    it('Datatype drop down and set', () => {
        const dataTypeDropDown = getDataTypePicker(screenChoiceFieldPropEditor);
        expect(dataTypeDropDown).toBeDefined();
        expect(dataTypeDropDown.value).toBeDefined();
        expect(dataTypeDropDown.value.dataType).toBe('TextBox');
    });
    it('Help text is present and filled in', () => {
        const helpTextField = query(screenChoiceFieldPropEditor, SELECTORS.HELP_TEXT);
        expect(helpTextField).toBeDefined();
        expect(helpTextField.value.value).toBe('Screen field field1 help text');
    });
});

describe('screen-choice-field-properties-editor for multi-select picklist', () => {
    let screenChoiceFieldPropEditor;
    beforeEach(() => {
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.MultiSelectPicklist, SCREEN_NO_DEF_VALUE, {
                validation: false,
                helpText: false
            })
        });
    });
    it('Should not have scale input ', () => {
        const scale = screenChoiceFieldPropEditor.shadowRoot.querySelector(SELECTORS.SCALE);

        expect(scale).toBeFalsy();
    });
    it('API Name field should be filled in', () => {
        const nameAndLabelField = getLabelDescription(screenChoiceFieldPropEditor);
        expect(nameAndLabelField.devName.value).toBe(fieldName);
    });
    it('Label field should be filled in', () => {
        const nameAndLabelField = getLabelDescription(screenChoiceFieldPropEditor);
        expect(nameAndLabelField).toBeDefined();
        expect(nameAndLabelField.label.value).toBe(fieldName);
    });
    it('Default value field is not present', () => {
        const renderedDefaultValueField = query(screenChoiceFieldPropEditor, SELECTORS.DEFAULT_VALUE);
        expect(renderedDefaultValueField).toBeNull();
    });
    it('Required checkbox is present and not checked', () => {
        const renderedRequiredCheckbox = query(screenChoiceFieldPropEditor, SELECTORS.REQUIRED_CHECKBOX);
        expect(renderedRequiredCheckbox).toBeDefined();
        expect(renderedRequiredCheckbox.value).toBeFalsy();
    });
    it('Datatype drop down is set to not required', () => {
        const dataTypeDropDown = getDataTypePicker(screenChoiceFieldPropEditor);
        expect(dataTypeDropDown).toBeDefined();
        expect(dataTypeDropDown.required).toBeFalsy();
    });
    it('Datatype drop down is set to Text', () => {
        const dataTypeDropDown = getDataTypePicker(screenChoiceFieldPropEditor);
        expect(dataTypeDropDown).toBeDefined();
        expect(dataTypeDropDown.value).toBeDefined();
        expect(dataTypeDropDown.value.dataType).toBe('TextBox');
    });
    it('Datatype drop down is disabled', () => {
        const dataTypeDropDown = getDataTypePicker(screenChoiceFieldPropEditor);
        expect(dataTypeDropDown).toBeDefined();
        expect(dataTypeDropDown.typeAndCollectionDisabled).toBeTruthy();
    });
    it('Help text is present and filled in', () => {
        const helpTextField = query(screenChoiceFieldPropEditor, SELECTORS.HELP_TEXT);
        expect(helpTextField).toBeDefined();
        expect(helpTextField.value.value).toBe('Screen field field1 help text');
    });
});

describe('screen-choice-field-properties-editor for multi-select checkboxes, type Number', () => {
    let screenChoiceFieldPropEditor;
    beforeEach(() => {
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.MultiSelectCheckboxes, SCREEN_NO_DEF_VALUE, {
                dataType: 'Number',
                validation: false,
                helpText: false,
                scale: 1
            })
        });
    });
    it('API Name field should be filled in', () => {
        const nameAndLabelField = getLabelDescription(screenChoiceFieldPropEditor);
        expect(nameAndLabelField.devName.value).toBe(fieldName);
    });
    it('Label field should be filled in', () => {
        const nameAndLabelField = getLabelDescription(screenChoiceFieldPropEditor);
        expect(nameAndLabelField).toBeDefined();
        expect(nameAndLabelField.label.value).toBe(fieldName);
    });
    it('Default value field is not present', () => {
        const renderedDefaultValueField = query(screenChoiceFieldPropEditor, SELECTORS.DEFAULT_VALUE);
        expect(renderedDefaultValueField).toBeNull();
    });
    it('Required checkbox is present and not checked', () => {
        const renderedRequiredCheckbox = query(screenChoiceFieldPropEditor, SELECTORS.REQUIRED_CHECKBOX);
        expect(renderedRequiredCheckbox).toBeDefined();
        expect(renderedRequiredCheckbox.value).toBeFalsy();
    });
    it('Datatype drop down is set to not required', () => {
        const dataTypeDropDown = getDataTypePicker(screenChoiceFieldPropEditor);
        expect(dataTypeDropDown).toBeDefined();
        expect(dataTypeDropDown.required).toBeFalsy();
    });
    it('Datatype drop down and set', () => {
        const dataTypeDropDown = getDataTypePicker(screenChoiceFieldPropEditor);
        expect(dataTypeDropDown).toBeDefined();
        expect(dataTypeDropDown.value).toBeDefined();
        expect(dataTypeDropDown.value.dataType).toBe('Number');
    });
    it('Help text is present and filled in', () => {
        const helpTextField = query(screenChoiceFieldPropEditor, SELECTORS.HELP_TEXT);
        expect(helpTextField).toBeDefined();
        expect(helpTextField.value.value).toBe('Screen field field1 help text');
    });
});

describe('screen-choice-field-properties-editor choice selectors', () => {
    let screenChoiceFieldPropEditor;
    beforeEach(() => {
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.RadioButtons, SCREEN_NO_DEF_VALUE, {
                dataType: 'String',
                createChoices: true
            })
        });
    });
    it('Should not have scale input ', () => {
        const scale = screenChoiceFieldPropEditor.shadowRoot.querySelector(SELECTORS.SCALE);

        expect(scale).toBeFalsy();
    });
    it('Correct number of choice selectors are present', () => {
        const choiceSelectors = query(screenChoiceFieldPropEditor, SELECTORS.CHOICE_SELECTOR, true);
        expect(choiceSelectors).toBeDefined();
        expect(choiceSelectors).toHaveLength(3);
        expect(choiceSelectors[0].required).toBeTruthy();
        expect(choiceSelectors[0].value.value).toMatch('choice0');
        expect(choiceSelectors[1].value.value).toMatch('choice1');
        expect(choiceSelectors[2].value.value).toMatch('choice2');
    });
    it('Fires a choice changed event when the error on a choice has changed', async () => {
        const propChangedEvent = new PropertyChangedEvent(
            null,
            null,
            'some new error',
            screenChoiceFieldPropEditor.field.choiceReferences[0].choiceReference.value,
            null,
            0,
            null
        );
        const renderedChoiceSelector = query(screenChoiceFieldPropEditor, SELECTORS.CHOICE_SELECTOR);

        const choiceChangedSpy = jest.fn();
        window.addEventListener(ScreenEditorEventName.ChoiceChanged, choiceChangedSpy);
        renderedChoiceSelector.dispatchEvent(propChangedEvent);
        await ticks(1);
        window.removeEventListener(ScreenEditorEventName.ChoiceChanged, choiceChangedSpy);
        expect(choiceChangedSpy).toHaveBeenCalled();
    });
    it('Decorates the add new resource event correctly when dispatched by the choice selector and no text has been entered', async () => {
        const addNewResourceEvent = new CustomEvent('addnewresource', {
            detail: {}
        });
        const renderedChoiceSelector = query(screenChoiceFieldPropEditor, SELECTORS.CHOICE_SELECTOR);
        renderedChoiceSelector.dispatchEvent(addNewResourceEvent);
        expect(addNewResourceEvent.detail.newResourceInfo).toBeDefined();
        expect(addNewResourceEvent.detail.newResourceInfo.dataType).toEqual('String');
        expect(addNewResourceEvent.detail.newResourceInfo.newResourceTypeLabel).toEqual(
            'FlowBuilderScreenEditor.typedResourceLabel'
        );
        expect(addNewResourceEvent.detail.newResourceInfo.resourceTypes).toBeDefined();
        expect(addNewResourceEvent.detail.newResourceInfo.resourceTypes).toHaveLength(4);
    });
    it('Decorates the add new resource event correctly when dispatched by the choice selector and text has been entered', async () => {
        const addNewResourceEvent = new CustomEvent('addnewresource', {
            detail: { newResourceInfo: { userProvidedText: '__Mustard__' } }
        });
        const renderedChoiceSelector = query(screenChoiceFieldPropEditor, SELECTORS.CHOICE_SELECTOR);
        renderedChoiceSelector.dispatchEvent(addNewResourceEvent);
        expect(addNewResourceEvent.detail.newResourceInfo.newResource).toBeDefined();
        expect(addNewResourceEvent.detail.newResourceInfo.newResource.name).toEqual('Mustard');
        expect(addNewResourceEvent.detail.newResourceInfo.newResource.choiceText).toEqual('__Mustard__');
        expect(addNewResourceEvent.detail.newResourceInfo.newResource.storedValue).toEqual('__Mustard__');
        expect(addNewResourceEvent.detail.newResourceInfo.newResource.elementType).toEqual(ELEMENT_TYPE.CHOICE);
        expect(addNewResourceEvent.detail.newResourceInfo.newResource.dataType).toEqual('String');
        expect(addNewResourceEvent.detail.newResourceInfo.resourceTypes).toHaveLength(1);
    });
    it('Decorates the add new resource event correctly when dispatched by the choice selector and given the text that was entered, the resulting dev name is empty', async () => {
        const addNewResourceEvent = new CustomEvent('addnewresource', {
            detail: { newResourceInfo: { userProvidedText: '____' } }
        });
        const renderedChoiceSelector = query(screenChoiceFieldPropEditor, SELECTORS.CHOICE_SELECTOR);
        renderedChoiceSelector.dispatchEvent(addNewResourceEvent);
        expect(addNewResourceEvent.detail.newResourceInfo.newResource).toBeDefined();
        expect(addNewResourceEvent.detail.newResourceInfo.newResource.name).toEqual('UniqueName');
        expect(addNewResourceEvent.detail.newResourceInfo.newResource.choiceText).toEqual('____');
        expect(addNewResourceEvent.detail.newResourceInfo.newResource.storedValue).toEqual('____');
        expect(addNewResourceEvent.detail.newResourceInfo.newResource.elementType).toEqual(ELEMENT_TYPE.CHOICE);
        expect(addNewResourceEvent.detail.newResourceInfo.newResource.dataType).toEqual('String');
        expect(addNewResourceEvent.detail.newResourceInfo.resourceTypes).toHaveLength(1);
    });
});

describe('Default value for choice based field', () => {
    let screenChoiceFieldPropEditor;
    beforeEach(() => {
        const testField = createTestScreenField(fieldName, FlowScreenFieldType.RadioButtons, SCREEN_NO_DEF_VALUE, {
            dataType: FLOW_DATA_TYPE.NUMBER.value,
            createChoices: true
        });
        testField.choiceReferences[0] = {
            choiceReference: { value: 'choice-RCS', error: null }
        };
        testField.choiceReferences[1] = {
            choiceReference: { value: 'choice1', error: null }
        };
        testField.choiceReferences[2] = {
            choiceReference: { value: 'choice-PICKLIST', error: null }
        };
        testField.defaultValue = 123;
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: testField
        });
    });
    it('Default value is set to the number literal value specified in the screen field data', () => {
        const defaultValue = query(screenChoiceFieldPropEditor, SELECTORS.DEFAULT_VALUE);
        expect(defaultValue).toBeDefined();
        expect(defaultValue.value).toBeDefined();
        expect(defaultValue.value).toEqual(123);
    });
    it('Default value ferov resource picker shows all data type compatible resources', () => {
        const defaultValueProp = query(screenChoiceFieldPropEditor, SELECTORS.DEFAULT_VALUE);
        expect(defaultValueProp).toBeDefined();
        const ferovResourcePicker = query(defaultValueProp, INTERACTION_COMPONENTS_SELECTORS.FEROV_RESOURCE_PICKER);
        expect(ferovResourcePicker.comboboxConfig.type).toEqual(FLOW_DATA_TYPE.NUMBER.value);
        expect(ferovResourcePicker.comboboxConfig.literalsAllowed).toBeTruthy();
    });
});

describe('screen-choice-field-properties-editor for field that is set to required', () => {
    let screenChoiceFieldPropEditor;
    beforeEach(() => {
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.RadioButtons, SCREEN_NO_DEF_VALUE, {
                required: true
            })
        });
    });
    it('Required checkbox is present and checked', () => {
        const requiredCheckbox = query(screenChoiceFieldPropEditor, SELECTORS.REQUIRED_CHECKBOX);
        expect(requiredCheckbox).toBeDefined();
        expect(requiredCheckbox.value).toBeTruthy();
    });
});

describe('screen-choice-field-properties-editor with help text', () => {
    let screenChoiceFieldPropEditor;
    beforeEach(() => {
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.RadioButtons, SCREEN_NO_DEF_VALUE)
        });
    });
    it('Help text is displayed', () => {
        const helpTextField = query(screenChoiceFieldPropEditor, SELECTORS.HELP_TEXT);
        expect(helpTextField).toBeDefined();
        expect(helpTextField.value.value).toBe('Screen field field1 help text');
    });
});

describe('screen-choice-field-properties-editor for existing field', () => {
    let screenChoiceFieldPropEditor;
    beforeEach(() => {
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.RadioButtons, SCREEN_NO_DEF_VALUE)
        });
    });
    it('DataType drop down is disabled', () => {
        const dataTypeDropDown = getDataTypePicker(screenChoiceFieldPropEditor);
        expect(dataTypeDropDown).toBeDefined();
        expect(dataTypeDropDown.typeAndCollectionDisabled).toBeTruthy();
    });
});

describe('screen-choice-field-properties-editor for new field', () => {
    let screenChoiceFieldPropEditor;
    beforeEach(() => {
        const testField = createTestScreenField(fieldName, FlowScreenFieldType.RadioButtons, SCREEN_NO_DEF_VALUE);
        testField.isNewField = true;
        testField.dataType = null;
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: testField
        });
    });
    it('DataType drop down is enabled', () => {
        const dataTypeDropDown = getDataTypePicker(screenChoiceFieldPropEditor);
        expect(dataTypeDropDown).toBeDefined();
        expect(dataTypeDropDown.typeAndCollectionDisabled).toBeFalsy();
    });
});

describe('screen-choise-field-properties-editor component visibility', () => {
    let screenChoiseFieldPropEditor;
    beforeEach(() => {
        screenChoiseFieldPropEditor = createComponentUnderTest();
    });

    it('section is present', () => {
        const componentVisibilitySection = query(
            screenChoiseFieldPropEditor,
            SELECTORS.SCREEN_COMPONENT_VISIBILITY_SECTION
        );
        expect(componentVisibilitySection).not.toBeNull();
    });
});
describe('scale input', () => {
    it('Scale field should be present with number field', () => {
        const a = createComponentUnderTest({
            field: createTestScreenField(fieldName, 'TextBox', SCREEN_NO_DEF_VALUE, {
                dataType: 'Number',
                validation: false,
                helpText: false
            })
        });
        const renderedScaleField = query(a, SELECTORS.SCALE);
        expect(renderedScaleField).toBeTruthy();
    });
    it('should dispatch the correct event with number field ', async () => {
        const propChangedEvent = new PropertyChangedEvent(null, null, 'some new error', 2, null, 0, null);
        const a = createComponentUnderTest({
            field: createTestScreenField(fieldName, 'TextBox', SCREEN_NO_DEF_VALUE, {
                dataType: 'Number',
                validation: false,
                helpText: false
            })
        });
        const renderedScaleField = query(a, SELECTORS.SCALE);
        renderedScaleField.dispatchEvent(propChangedEvent);
        const spy = addCurrentValueToEvent;
        await ticks(1);
        expect(spy).toHaveBeenCalled();
    });
    it('Scale field should not be present with string field and corresponding fn should not be dispatched', () => {
        const a = createComponentUnderTest({
            field: createTestScreenField(fieldName, 'TextBox', SCREEN_NO_DEF_VALUE, {
                dataType: 'String',
                validation: false,
                helpText: false
            })
        });
        const spy = addCurrentValueToEvent;
        const renderedScaleField = query(a, SELECTORS.SCALE);
        expect(renderedScaleField).not.toBeTruthy();
        expect(spy).not.toHaveBeenCalled();
    });
});
describe('Screen choice visual display configuration', () => {
    it('For picklist screen field, single select and picklist should be selected in configuration', async () => {
        const screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.DropdownBox, SCREEN_NO_DEF_VALUE)
        });
        expect(getVisualDisplayRadioGroup(screenChoiceFieldPropEditor).value).toEqual(
            ChoiceDisplayOptions.SINGLE_SELECT
        );
        expect(getDisplayTypeCombobox(screenChoiceFieldPropEditor).value).toEqual(FlowScreenFieldType.DropdownBox);
    });
    it('For radio buttons screen field, single select and radio buttons should be selected in configuration', () => {
        const screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.RadioButtons, SCREEN_NO_DEF_VALUE)
        });
        expect(getVisualDisplayRadioGroup(screenChoiceFieldPropEditor).value).toEqual(
            ChoiceDisplayOptions.SINGLE_SELECT
        );
        expect(getDisplayTypeCombobox(screenChoiceFieldPropEditor).value).toEqual(FlowScreenFieldType.RadioButtons);
    });
    it('For Multi-Select Picklist screen field, multi select and multi-select picklist should be selected in configuration', () => {
        const screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.MultiSelectPicklist, SCREEN_NO_DEF_VALUE)
        });
        expect(getVisualDisplayRadioGroup(screenChoiceFieldPropEditor).value).toEqual(
            ChoiceDisplayOptions.MULTI_SELECT
        );
        expect(getDisplayTypeCombobox(screenChoiceFieldPropEditor).value).toEqual(
            FlowScreenFieldType.MultiSelectPicklist
        );
    });
    it('For Checkbox Group screen field, multi select and Checkbox Group should be selected in configuration', () => {
        const screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.MultiSelectCheckboxes, SCREEN_NO_DEF_VALUE)
        });
        expect(getVisualDisplayRadioGroup(screenChoiceFieldPropEditor).value).toEqual(
            ChoiceDisplayOptions.MULTI_SELECT
        );
        expect(getDisplayTypeCombobox(screenChoiceFieldPropEditor).value).toEqual(
            FlowScreenFieldType.MultiSelectCheckboxes
        );
    });
});
describe('Switching visual display type', () => {
    it('Changing visual display dispatches a Choice Display Changed event', () => {
        const screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.DropdownBox, SCREEN_NO_DEF_VALUE)
        });
        const choiceDisplayChangedCallback = jest.fn();

        screenChoiceFieldPropEditor.addEventListener(
            ScreenEditorEventName.ChoiceDisplayChanged,
            choiceDisplayChangedCallback
        );
        const event = new PropertyChangedEvent(
            'choiceDisplayType',
            FlowScreenFieldType.RadioButtons,
            null,
            null,
            FlowScreenFieldType.DropdownBox
        );
        getDisplayTypeCombobox(screenChoiceFieldPropEditor).dispatchEvent(event);
        expect(choiceDisplayChangedCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: {
                    screenElement: screenChoiceFieldPropEditor.field,
                    newDisplayType: FlowScreenFieldType.RadioButtons
                }
            })
        );
    });
});
describe('screen-choice-field-properties-editor expanded picklist values', () => {
    let screenChoiceFieldPropEditor;
    beforeEach(() => {
        const testField = createTestScreenField(fieldName, FlowScreenFieldType.DropdownBox, SCREEN_NO_DEF_VALUE, {});
        testField.choiceReferences[0] = {
            choiceReference: { value: 'choice-PICKLIST', error: null }
        };
        testField.choiceReferences[1] = {
            choiceReference: { value: 'choice-altPCS', error: null }
        };
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: testField
        });
    });
    it('shows expanded picklist values in default field for first picklist choice set', () => {
        const defaultValueElement = query(screenChoiceFieldPropEditor, SELECTORS.DEFAULT_VALUE);
        expect(defaultValueElement.activePicklistValues).toEqual(['val1']);
    });
});
describe('screen-choice-field-properties-editor missing picklist choice field', () => {
    let screenChoiceFieldPropEditor;
    beforeEach(() => {
        const testField = createTestScreenField(fieldName, FlowScreenFieldType.DropdownBox, SCREEN_NO_DEF_VALUE, {});
        testField.choiceReferences[0] = {
            choiceReference: { value: 'choice-altPCS', error: null }
        };
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: testField
        });
    });
    it('shows no picklist values in default field for first picklist choice set', () => {
        const defaultValueElement = query(screenChoiceFieldPropEditor, SELECTORS.DEFAULT_VALUE);
        expect(defaultValueElement.activePicklistValues).toBeUndefined();
    });
});
describe('screen-choice-field-properties-editor for single select, type Number', () => {
    let screenChoiceFieldPropEditor;
    beforeEach(() => {
        const testField = createTestScreenField(fieldName, FlowScreenFieldType.DropdownBox, SCREEN_NO_DEF_VALUE, {
            dataType: FLOW_DATA_TYPE.NUMBER.value
        });
        testField.choiceReferences[0] = {
            choiceReference: { value: 'choice-1', error: null }
        };
        testField.choiceReferences[1] = {
            choiceReference: { value: 'choice-2', error: null }
        };
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: testField
        });
    });
    describe('switching type of choice', () => {
        it('Should dispatch a singleormultichoicetypechanged event', async () => {
            usebyMock.usedBy.mockReturnValueOnce(['parentGuid', 'someGuid']);
            const visualDisplayRadioGroup = getVisualDisplayRadioGroup(screenChoiceFieldPropEditor);
            const choiceChangedSpy = jest.fn();
            screenChoiceFieldPropEditor.addEventListener(
                ScreenEditorEventName.SingleOrMultiChoiceTypeChanged,
                choiceChangedSpy
            );
            visualDisplayRadioGroup.dispatchEvent(
                new CustomEvent('change', {
                    detail: {
                        value: ChoiceDisplayOptions.MULTI_SELECT
                    }
                })
            );
            await ticks(1);
            expect(choiceChangedSpy).toHaveBeenCalled();
        });
    });
});

describe('handleEditChoice', () => {
    let screenChoiceFieldPropEditor, list;
    beforeEach(() => {
        logInteraction.mockClear();
        screenChoiceFieldPropEditor = createComponentUnderTest({
            field: createTestScreenField(fieldName, FlowScreenFieldType.RadioButtons, SCREEN_NO_DEF_VALUE, {
                dataType: 'String',
                createChoices: true
            })
        });
        list = screenChoiceFieldPropEditor.shadowRoot.querySelector(SELECTORS.LIST);
    });
    it('fires editElementEvent with correct choice GUID', () => {
        const eventCallback = jest.fn();
        screenChoiceFieldPropEditor.addEventListener(EditElementEvent.EVENT_NAME, eventCallback);
        list.dispatchEvent(new EditListItemEvent(1));
        expect(eventCallback).toHaveBeenCalled();
        expect(eventCallback.mock.calls[0][0]).toMatchObject({
            detail: {
                canvasElementGUID: 'choice1'
            }
        });
    });
    it('dispaches response from updateInlineResourceProperties when dispatching editelement', async () => {
        const updateInlineResourceSpy = updateInlineResourceProperties;
        const spy = Store.getStore().dispatch;
        const list = screenChoiceFieldPropEditor.shadowRoot.querySelector(SELECTORS.LIST);
        list.dispatchEvent(new EditListItemEvent(1));
        await ticks(1);
        expect(spy).toHaveBeenCalledWith('test response');
        expect(updateInlineResourceSpy).toHaveBeenCalledWith({
            lastInlineResourceRowIndex: 'choice1'
        });
    });
    it('logs edit choice resource in-line data', () => {
        list.dispatchEvent(new EditListItemEvent(1));
        expect(logInteraction).toHaveBeenCalled();
        expect(logInteraction.mock.calls[0][1]).toBe('choiceResourceEdit');
        expect(logInteraction.mock.calls[0][3]).toBe('click');
        const loggedData = {
            fieldType: FlowScreenFieldType.RadioButtons,
            dataType: 'String'
        };
        expect(logInteraction.mock.calls[0][2]).toEqual(loggedData);
    });
});
