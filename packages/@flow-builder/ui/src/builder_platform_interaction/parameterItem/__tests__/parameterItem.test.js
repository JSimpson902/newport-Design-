import { createElement } from 'lwc';
import ParameterItem from 'builder_platform_interaction/parameterItem';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { FEROV_DATA_TYPE, FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import {
    UpdateParameterItemEvent,
    DeleteParameterItemEvent,
    ComboboxStateChangedEvent
} from 'builder_platform_interaction/events';
import { stringVariable } from 'mock/storeData';
import { isUndefinedOrNull } from 'builder_platform_interaction/commonUtils';
import { generateGuid } from 'builder_platform_interaction/storeLib';

jest.mock('builder_platform_interaction/outputResourcePicker', () =>
    require('builder_platform_interaction_mocks/outputResourcePicker')
);
jest.mock('builder_platform_interaction/ferovResourcePicker', () =>
    require('builder_platform_interaction_mocks/ferovResourcePicker')
);

const parameterLabel = 'Parameter Label';
const parameterName = 'parameterName';
const parameterStringValue = 'Simple String Value';

function createComponentForTest({
    item = createMockParameterItem(true, 'string'),
    elementType = ELEMENT_TYPE.ACTION_CALL,
    itemIndex = 0,
    showDelete = false,
    warningMessage,
    warningBadge,
    grayPill = false,
    isInput = true
} = {}) {
    const el = createElement('builder_platform_interaction-parameter-item', {
        is: ParameterItem
    });
    Object.assign(el, {
        item,
        elementType,
        itemIndex,
        showDelete,
        warningMessage,
        warningBadge,
        grayPill,
        isInput
    });
    document.body.appendChild(el);
    return el;
}

function createMockParameterItem(isRequired, dataType, value, valueDataType, objectType, maxOccurs) {
    const item = {
        isRequired,
        dataType,
        objectType,
        label: parameterLabel,
        name: parameterName,
        description: 'Parameter Description',
        maxOccurs,
        rowIndex: generateGuid()
    };
    if (!isUndefinedOrNull(value)) {
        item.value = { value, error: null };
    }
    if (!isUndefinedOrNull(valueDataType)) {
        item.valueDataType = valueDataType;
    }
    return item;
}

class ToggleOnChangeEvent extends CustomEvent {
    constructor() {
        super('change', { detail: { checked: true } });
    }
}

class ToggleOffChangeEvent extends CustomEvent {
    constructor() {
        super('change', { detail: { checked: false } });
    }
}

class DeleteButtonClickEvent extends CustomEvent {
    constructor() {
        super('click', {});
    }
}

const selectors = {
    ferovResourcePicker: 'builder_platform_interaction-ferov-resource-picker',
    outputResourcePicker: 'builder_platform_interaction-output-resource-picker',
    hiddenFerovResourcePickerElement: 'builder_platform_interaction-ferov-resource-picker.slds-hide',
    toggle: 'lightning-input',
    baseResourcePicker: 'builder_platform_interaction-base-resource-picker',
    warningIcon: 'builder_platform_interaction-status-icon',
    warningBadge: 'lightning-badge',
    deleteButton: 'lightning-button-icon'
};

function getFerovResourcePickerElement(parameterItem) {
    return parameterItem.shadowRoot.querySelector(selectors.ferovResourcePicker);
}

function getHiddenFerovResourcePickerElement(parameterItem) {
    return parameterItem.shadowRoot.querySelector(selectors.hiddenFerovResourcePickerElement);
}

function getOutputResourcePickerElement(parameterItem) {
    return parameterItem.shadowRoot.querySelector(selectors.outputResourcePicker);
}

function getLightningInputToggle(parameterItem) {
    return parameterItem.shadowRoot.querySelector(selectors.toggle);
}

function getWarningIcon(parameterItem) {
    return parameterItem.shadowRoot.querySelector(selectors.warningIcon);
}

function getWarningBadge(parameterItem) {
    return parameterItem.shadowRoot.querySelector(selectors.warningBadge);
}

function getDeleteButton(parameterItem) {
    return parameterItem.shadowRoot.querySelector(selectors.deleteButton);
}

describe('parameter-item', () => {
    describe('input picker', () => {
        const mockRules = ['foo'];
        let ferovResourcePicker;
        let parameterItemCmp;
        beforeEach(() => {
            parameterItemCmp = createComponentForTest();
            parameterItemCmp.rules = mockRules;
            ferovResourcePicker = getFerovResourcePickerElement(parameterItemCmp);
        });

        it('gets the rules used by the ferovResourcePicker through an api property', () => {
            expect(parameterItemCmp.rules).toEqual(mockRules);
        });

        it('passes rules to the ferovResourePicker', () => {
            expect(ferovResourcePicker.rules).toEqual(mockRules);
        });
    });

    describe('showing combobox, not showing input toggle for required input parameter', () => {
        describe('parameter has no value', () => {
            let ferovResourcePicker, toggleInput;
            beforeAll(() => {
                const parameterItemCmp = createComponentForTest();
                ferovResourcePicker = getFerovResourcePickerElement(parameterItemCmp);
                toggleInput = getLightningInputToggle(parameterItemCmp);
            });
            it('combobox should be shown', () => {
                expect(ferovResourcePicker).not.toBeNull();
            });
            it('combobox value should be null', () => {
                expect(ferovResourcePicker.value).toBeNull();
            });
            it('combobox should be required', () => {
                expect(ferovResourcePicker.comboboxConfig.required).toBe(true);
            });
            it('combobox label should be shown', () => {
                expect(ferovResourcePicker.comboboxConfig.label).toEqual(parameterLabel);
            });
            it('input toggle should not be shown', () => {
                expect(toggleInput).toBeNull();
            });
        });
        describe('parameter has value', () => {
            let ferovResourcePicker, toggleInput;
            beforeAll(() => {
                const parameterItemCmp = createComponentForTest({
                    item: createMockParameterItem(
                        true,
                        FLOW_DATA_TYPE.STRING.value,
                        parameterStringValue,
                        FEROV_DATA_TYPE.STRING
                    ),
                    isInput: true
                });
                ferovResourcePicker = getFerovResourcePickerElement(parameterItemCmp);
                toggleInput = getLightningInputToggle(parameterItemCmp);
            });
            it('combobox should be shown', () => {
                expect(ferovResourcePicker).not.toBeNull();
            });
            it('combobox value should be equal to parameterStringValue', () => {
                expect(ferovResourcePicker.value).toEqual(parameterStringValue);
            });
            it('combobox should be required', () => {
                expect(ferovResourcePicker.comboboxConfig.required).toBe(true);
            });
            it('combobox label should be shown', () => {
                expect(ferovResourcePicker.comboboxConfig.label).toEqual(parameterLabel);
            });
            it('input toggle should not be shown', () => {
                expect(toggleInput).toBeNull();
            });
        });
    });
    describe('showing input toggle, show or hide combobox for optional input parameter', () => {
        describe('parameter has no value', () => {
            let hiddenFerovResourcePicker, toggleInput;
            beforeAll(() => {
                const parameterItemCmp = createComponentForTest({
                    item: createMockParameterItem(false, FLOW_DATA_TYPE.STRING.value),
                    isInput: true
                });
                hiddenFerovResourcePicker = getHiddenFerovResourcePickerElement(parameterItemCmp);
                toggleInput = getLightningInputToggle(parameterItemCmp);
            });
            it('combobox should be hidden', () => {
                expect(hiddenFerovResourcePicker).not.toBeNull();
            });
            it('input toggle should be shown', () => {
                expect(toggleInput).not.toBeNull();
            });
            it('input toggle status should be not set', () => {
                expect(toggleInput.checked).toBe(false);
            });
        });
        describe('parameter has value', () => {
            let ferovResourcePicker, toggleInput;
            beforeAll(() => {
                const parameterItemCmp = createComponentForTest({
                    item: createMockParameterItem(
                        false,
                        FLOW_DATA_TYPE.STRING.value,
                        parameterStringValue,
                        FEROV_DATA_TYPE.STRING
                    ),
                    isInput: true
                });
                ferovResourcePicker = getFerovResourcePickerElement(parameterItemCmp);
                toggleInput = getLightningInputToggle(parameterItemCmp);
            });
            it('combobox should be shown', () => {
                expect(ferovResourcePicker).not.toBeNull();
            });
            it('combobox value should be equal to parameterStringValue', () => {
                expect(ferovResourcePicker.value).toEqual(parameterStringValue);
            });
            it('combobox should not be required', () => {
                expect(ferovResourcePicker.comboboxConfig.required).toBe(false);
            });
            it('input toggle should be shown', () => {
                expect(toggleInput).not.toBeNull();
            });
            it('input toggle status should be set', () => {
                expect(toggleInput.checked).toBe(true);
            });
        });
    });
    describe('showing combobox, not showing input toggle for output parameter', () => {
        describe('parameter has no value', () => {
            let outputResourcePicker, toggleInput;
            beforeAll(() => {
                const parameterItemCmp = createComponentForTest({
                    item: createMockParameterItem(false, FLOW_DATA_TYPE.STRING.value),
                    isInput: false
                });
                outputResourcePicker = getOutputResourcePickerElement(parameterItemCmp);
                toggleInput = getLightningInputToggle(parameterItemCmp);
            });
            it('combobox should be shown', () => {
                expect(outputResourcePicker).not.toBeNull();
            });
            it('combobox value should be null', () => {
                expect(outputResourcePicker.value).toBeNull();
            });
            it('combobox should not be required', () => {
                expect(outputResourcePicker.comboboxConfig.required).toBe(false);
            });
            it('combobox label should be shown', () => {
                expect(outputResourcePicker.comboboxConfig.label).toEqual(parameterLabel);
            });
            it('input toggle should not be shown', () => {
                expect(toggleInput).toBeNull();
            });
        });
        describe('parameter has value', () => {
            let outputResourcePicker, toggleInput;
            beforeAll(() => {
                const parameterItemCmp = createComponentForTest({
                    item: createMockParameterItem(
                        false,
                        FLOW_DATA_TYPE.STRING.value,
                        stringVariable.guid + '.' + stringVariable.name,
                        FEROV_DATA_TYPE.REFERENCE
                    ),
                    isInput: false
                });
                outputResourcePicker = getOutputResourcePickerElement(parameterItemCmp);
                toggleInput = getLightningInputToggle(parameterItemCmp);
            });
            it('combobox should be shown', () => {
                expect(outputResourcePicker).not.toBeNull();
            });
            it('combobox value should be equal to stringVariableGuid.stringVariableDevName', () => {
                expect(outputResourcePicker.value).toEqual(stringVariable.guid + '.' + stringVariable.name);
            });
            it('combobox should not be required', () => {
                expect(outputResourcePicker.comboboxConfig.required).toBe(false);
            });
            it('combobox label should be shown', () => {
                expect(outputResourcePicker.comboboxConfig.label).toEqual(parameterLabel);
            });
            it('input toggle should not be shown', () => {
                expect(toggleInput).toBeNull();
            });
        });
    });
    describe('handling onchange from input toggle', () => {
        it('should show the combobox for optional input parameter when toggle from OFF to ON ', () => {
            const parameterItemCmp = createComponentForTest({
                item: createMockParameterItem(false, FLOW_DATA_TYPE.STRING.value),
                isInput: true
            });
            const toggleInput = getLightningInputToggle(parameterItemCmp);
            toggleInput.dispatchEvent(new ToggleOnChangeEvent());
            return Promise.resolve().then(() => {
                expect(getHiddenFerovResourcePickerElement(parameterItemCmp)).toBeNull();
                expect(getFerovResourcePickerElement(parameterItemCmp)).not.toBeNull();
            });
        });
        it('should hide the combobox for optional input parameter when toggle from ON to OFF ', () => {
            const parameterItemCmp = createComponentForTest({
                item: createMockParameterItem(
                    false,
                    FLOW_DATA_TYPE.STRING.value,
                    parameterStringValue,
                    FEROV_DATA_TYPE.STRING
                ),
                isInput: true
            });
            return Promise.resolve()
                .then(() => {
                    const toggleInput = getLightningInputToggle(parameterItemCmp);
                    toggleInput.dispatchEvent(new ToggleOffChangeEvent());
                })
                .then(() => {
                    expect(getHiddenFerovResourcePickerElement(parameterItemCmp)).not.toBeNull();
                });
        });
        it('should hide the comboBox when toggle OFF ', () => {
            const parameterItemCmp = createComponentForTest({
                item: createMockParameterItem(
                    false,
                    FLOW_DATA_TYPE.STRING.value,
                    parameterStringValue,
                    FEROV_DATA_TYPE.STRING
                ),
                isInput: true
            });
            const toggleInput = getLightningInputToggle(parameterItemCmp);
            // from ON to OFF
            toggleInput.dispatchEvent(new ToggleOffChangeEvent());
            return Promise.resolve().then(() => {
                expect(getHiddenFerovResourcePickerElement(parameterItemCmp)).not.toBeNull();
            });
        });
        it('should preserve the value for optional input parameter when toggle OFF', () => {
            const parameterItemCmp = createComponentForTest({
                item: createMockParameterItem(
                    false,
                    FLOW_DATA_TYPE.STRING.value,
                    parameterStringValue,
                    FEROV_DATA_TYPE.STRING
                ),
                isInput: true
            });
            const toggleInput = getLightningInputToggle(parameterItemCmp);
            // from ON to OFF
            toggleInput.dispatchEvent(new ToggleOffChangeEvent());
            // from OFF to ON
            return Promise.resolve()
                .then(() => {
                    toggleInput.dispatchEvent(new ToggleOnChangeEvent());
                })
                .then(() => {
                    const combobox = getFerovResourcePickerElement(parameterItemCmp);
                    expect(combobox).not.toBeNull();
                    expect(combobox.value).toEqual(parameterStringValue);
                });
        });
        it('should fire UpdateParameterItemEvent', () => {
            const parameterItemCmp = createComponentForTest({
                item: createMockParameterItem(
                    false,
                    FLOW_DATA_TYPE.STRING.value,
                    parameterStringValue,
                    FEROV_DATA_TYPE.STRING
                ),
                isInput: true
            });
            const eventCallback = jest.fn();
            parameterItemCmp.addEventListener(UpdateParameterItemEvent.EVENT_NAME, eventCallback);
            const toggleInput = getLightningInputToggle(parameterItemCmp);
            // from ON to OFF
            toggleInput.dispatchEvent(new ToggleOffChangeEvent());
            return Promise.resolve()
                .then(() => {
                    expect(eventCallback).toHaveBeenCalled();
                    expect(eventCallback.mock.calls[0][0]).toMatchObject({
                        detail: {
                            isInput: true,
                            name: parameterName,
                            value: null,
                            valueDataType: null,
                            error: null,
                            rowIndex: expect.any(String)
                        }
                    });
                })
                .then(() => {
                    // from OFF to ON
                    toggleInput.dispatchEvent(new ToggleOnChangeEvent());
                    expect(eventCallback).toHaveBeenCalled();
                    expect(eventCallback.mock.calls[1][0]).toMatchObject({
                        detail: {
                            isInput: true,
                            name: parameterName,
                            value: parameterStringValue,
                            valueDataType: FEROV_DATA_TYPE.STRING,
                            error: null,
                            rowIndex: expect.any(String)
                        }
                    });
                });
        });
    });
    describe('handling value change event from combobox', () => {
        it('should fire UpdateParameterItemEvent', () => {
            const parameterItemCmp = createComponentForTest({
                item: createMockParameterItem(
                    false,
                    FLOW_DATA_TYPE.STRING.value,
                    parameterStringValue,
                    parameterStringValue,
                    FEROV_DATA_TYPE.STRING
                ),
                isInput: true
            });
            const eventCallback = jest.fn();
            parameterItemCmp.addEventListener(UpdateParameterItemEvent.EVENT_NAME, eventCallback);
            const newParamValue = 'new value';
            const cbChangeEvent = new ComboboxStateChangedEvent(null, newParamValue);
            const ferovResourcePicker = getFerovResourcePickerElement(parameterItemCmp);
            ferovResourcePicker.dispatchEvent(cbChangeEvent);
            return Promise.resolve().then(() => {
                expect(eventCallback).toHaveBeenCalled();
                expect(eventCallback.mock.calls[0][0]).toMatchObject({
                    detail: {
                        isInput: true,
                        name: parameterName,
                        value: newParamValue,
                        valueDataType: FEROV_DATA_TYPE.STRING,
                        rowIndex: expect.any(String)
                    }
                });
            });
        });
        it('should not fire UpdateParameterItemEvent if parameter is an optional input collection and it has no value', () => {
            const parameterItemCmp = createComponentForTest({
                item: createMockParameterItem(false, FLOW_DATA_TYPE.STRING.value, null, null, null, 5),
                isInput: true
            });
            const eventCallback = jest.fn();
            parameterItemCmp.addEventListener(UpdateParameterItemEvent.EVENT_NAME, eventCallback);
            const newParamValue = '';
            const cbChangeEvent = new ComboboxStateChangedEvent(null, newParamValue);
            const ferovResourcePicker = getFerovResourcePickerElement(parameterItemCmp);
            ferovResourcePicker.dispatchEvent(cbChangeEvent);
            return Promise.resolve().then(() => {
                expect(eventCallback).not.toHaveBeenCalled();
            });
        });
    });
    describe('showing badge and icon', () => {
        let parameterItemCmp;
        it('should show only icon if only warningMessage is set', () => {
            parameterItemCmp = createComponentForTest({
                item: createMockParameterItem(
                    false,
                    FLOW_DATA_TYPE.STRING.value,
                    parameterStringValue,
                    parameterStringValue,
                    FEROV_DATA_TYPE.STRING
                ),
                isInput: true,
                warningMessage: 'Warning message'
            });
            const statusIcon = getWarningIcon(parameterItemCmp);
            expect(statusIcon).not.toBeNull();
            expect(statusIcon.type).toBe('warning');
            expect(statusIcon.messages).toEqual([
                {
                    guid: expect.any(String),
                    messages: [{ guid: expect.any(String), message: 'Warning message' }],
                    sectionInfo: 'FlowBuilderCommonPropertyEditor.validationWarningsSectionInfo',
                    title: 'FlowBuilderCommonPropertyEditor.validationWarningsSectionTitle'
                }
            ]);
            expect(getWarningBadge(parameterItemCmp)).toBeNull();
        });
        it('should show badge and icon if both warningBadge and warningMessage are set', () => {
            parameterItemCmp = createComponentForTest({
                item: createMockParameterItem(
                    false,
                    FLOW_DATA_TYPE.STRING.value,
                    parameterStringValue,
                    FEROV_DATA_TYPE.STRING
                ),
                isInput: true,
                warningMessage: 'Warning',
                warningBadge: 'Debug Only'
            });
            expect(getWarningIcon(parameterItemCmp)).not.toBeNull();
            const badgeCmp = getWarningBadge(parameterItemCmp);
            expect(badgeCmp).not.toBeNull();
            expect(badgeCmp.label).toEqual('Debug Only');
            expect(badgeCmp.classList).toContain('slds-theme_warning');
        });
        it('should gray the badge', () => {
            parameterItemCmp = createComponentForTest({
                item: createMockParameterItem(
                    false,
                    FLOW_DATA_TYPE.STRING.value,
                    parameterStringValue,
                    FEROV_DATA_TYPE.STRING
                ),
                isInput: true,
                warningMessage: 'Warning',
                warningBadge: 'Debug Only',
                grayPill: true
            });
            const badgeCmp = getWarningBadge(parameterItemCmp);
            expect(badgeCmp.classList).not.toContain('slds-theme_warning');
        });
        it('should close popover when clicked out', () => {
            parameterItemCmp = createComponentForTest({
                item: createMockParameterItem(
                    false,
                    FLOW_DATA_TYPE.STRING.value,
                    parameterStringValue,
                    parameterStringValue,
                    FEROV_DATA_TYPE.STRING
                ),
                isInput: true,
                warningMessage: 'Warning message'
            });
            const statusIcon = getWarningIcon(parameterItemCmp);
            expect(statusIcon).not.toBeNull();
            expect(statusIcon.closeOnClickOut).toBe(true);
        });
    });
    describe('when showDelete is TRUE', () => {
        let parameterItemCmp, deleteBtn;
        beforeAll(() => {
            parameterItemCmp = createComponentForTest({
                item: createMockParameterItem(
                    false,
                    FLOW_DATA_TYPE.STRING.value,
                    parameterStringValue,
                    FEROV_DATA_TYPE.STRING
                ),
                isInput: true,
                showDelete: true
            });
            deleteBtn = getDeleteButton(parameterItemCmp);
        });
        it('should show delete icon button', () => {
            expect(deleteBtn).not.toBeNull();
            expect(deleteBtn.iconName).toEqual('utility:delete');
        });
        it('should hide toggle input', () => {
            expect(getLightningInputToggle(parameterItemCmp)).toBeNull();
        });
        it('should fire DeleteParameterItemEvent when delete button is clicked', () => {
            const eventCallback = jest.fn();
            parameterItemCmp.addEventListener(DeleteParameterItemEvent.EVENT_NAME, eventCallback);
            deleteBtn.dispatchEvent(new DeleteButtonClickEvent());
            return Promise.resolve().then(() => {
                expect(eventCallback).toHaveBeenCalled();
                expect(eventCallback.mock.calls[0][0]).toMatchObject({
                    detail: {
                        isInput: true,
                        name: parameterName,
                        rowIndex: expect.any(String)
                    }
                });
            });
        });
    });
    describe('when error is not null', () => {
        it('should show error message for input', () => {
            const item = createMockParameterItem(
                false,
                FLOW_DATA_TYPE.STRING.value,
                parameterStringValue,
                FEROV_DATA_TYPE.STRING
            );
            item.value.error = 'Error message';
            const parameterItemCmp = createComponentForTest({
                item,
                isInput: true
            });
            const ferovResourcePicker = getFerovResourcePickerElement(parameterItemCmp);
            expect(ferovResourcePicker.errorMessage).toEqual('Error message');
        });
        it('should show error message for output', () => {
            const item = createMockParameterItem(
                false,
                FLOW_DATA_TYPE.STRING.value,
                stringVariable.guid + '.' + stringVariable.name,
                FEROV_DATA_TYPE.REFERENCE
            );
            item.value.error = 'Error message';
            const parameterItemCmp = createComponentForTest({
                item,
                isInput: false
            });
            const ferovResourcePicker = getOutputResourcePickerElement(parameterItemCmp);
            expect(ferovResourcePicker.errorMessage).toEqual('Error message');
        });
    });
    describe('when value is empty', () => {
        it('should show combobox', () => {
            const item = createMockParameterItem(false, FLOW_DATA_TYPE.STRING.value, '', FEROV_DATA_TYPE.STRING);
            const parameterItemCmp = createComponentForTest({
                item,
                isInput: true
            });
            expect(getFerovResourcePickerElement(parameterItemCmp)).not.toBeNull();
            expect(getHiddenFerovResourcePickerElement(parameterItemCmp)).toBeNull();
        });
    });
    describe('when data type is SObject or Apex', () => {
        const testDisableDrilldown = (dataType, isInput) => {
            const item = createMockParameterItem(false, dataType, undefined, undefined, 'Account');
            const parameterItemCmp = createComponentForTest({
                item,
                isInput
            });
            const compRetrievalFn = isInput ? getFerovResourcePickerElement : getOutputResourcePickerElement;
            expect(compRetrievalFn(parameterItemCmp).enableFieldDrilldown).toBeFalsy();
        };
        it('disable field drilldown for sobject input', () => {
            testDisableDrilldown(FLOW_DATA_TYPE.SOBJECT.value, true);
        });
        it('disable field drilldown for sobject output', () => {
            testDisableDrilldown(FLOW_DATA_TYPE.SOBJECT.value, false);
        });
        it('disable field drilldown for apex input', () => {
            testDisableDrilldown(FLOW_DATA_TYPE.APEX.value, true);
        });
        it('disable field drilldown for apex output', () => {
            testDisableDrilldown(FLOW_DATA_TYPE.APEX.value, false);
        });
    });
});
