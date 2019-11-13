import {
    setEntities,
    clearEntityFieldsCache
} from 'builder_platform_interaction/sobjectLib';
import {
    setAuraFetch,
    resetFetchOnceCache
} from 'builder_platform_interaction/serverDataLib';
import {
    setGlobalVariables,
    setSystemVariables
} from 'builder_platform_interaction/systemLib';
import { setRules } from 'builder_platform_interaction/ruleLib';
import OutputResourcePicker from 'builder_platform_interaction/outputResourcePicker';
import { Store } from 'builder_platform_interaction/storeLib';
import { reducer } from 'builder_platform_interaction/reducers';
import { resetCacheTemplates } from 'builder_platform_interaction/processTypeLib';
import {
    LIGHTNING_COMPONENTS_SELECTORS,
    INTERACTION_COMPONENTS_SELECTORS
} from 'builder_platform_interaction/builderTestUtils';

export const FLOW_BUILDER_VALIDATION_ERROR_MESSAGES = {
    CANNOT_BE_BLANK: 'FlowBuilderValidation.cannotBeBlank',
    GENERIC: 'FlowBuilderCombobox.genericErrorMessage'
};

const LABEL_DESCRIPTION_SELECTORS = {
    DEV_NAME: '.devName',
    LABEL: '.label'
};

export const getLabelDescriptionElement = editor => {
    return editor.shadowRoot.querySelector(
        INTERACTION_COMPONENTS_SELECTORS.LABEL_DESCRIPTION
    );
};

export const getLabelDescriptionNameElement = editor => {
    return getLabelDescriptionElement(editor).shadowRoot.querySelector(
        LABEL_DESCRIPTION_SELECTORS.DEV_NAME
    );
};

export const getLabelDescriptionLabelElement = editor => {
    return getLabelDescriptionElement(editor).shadowRoot.querySelector(
        LABEL_DESCRIPTION_SELECTORS.LABEL
    );
};

export const focusoutEvent = new FocusEvent('focusout', {
    bubbles: true,
    cancelable: true
});

export const textInputEvent = textInput => {
    return new CustomEvent('textinput', {
        bubbles: true,
        cancelable: true,
        detail: { text: textInput }
    });
};

export const blurEvent = new FocusEvent('blur', {
    bubbles: true,
    cancelable: true
});

export const selectEvent = value => {
    return new CustomEvent('select', {
        bubbles: true,
        cancelable: true,
        detail: { value }
    });
};

export const expectGroupedComboboxItem = (groupedCombobox, itemText) => {
    expect(groupedCombobox.items).toEqual(
        expect.arrayContaining([expect.objectContaining({ text: itemText })])
    );
};
export const expectGroupedComboboxItemInGroup = (
    groupedCombobox,
    groupLabel,
    value,
    property = 'text'
) => {
    expect(groupedCombobox.items).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                label: groupLabel,
                items: expect.arrayContaining([
                    expect.objectContaining({ [property]: value })
                ])
            })
        ])
    );
};
export const getGroupedComboboxItemInGroup = (
    groupedCombobox,
    groupLabel,
    itemText
) => {
    for (const item of groupedCombobox.items) {
        if (item.label === groupLabel && item.items) {
            for (const subItem of item.items) {
                if (subItem.text === itemText) {
                    return subItem;
                }
            }
        }
    }
    return undefined;
};

export const getGroupedComboboxItemInGroupByDisplayText = (
    groupedCombobox,
    groupLabel,
    displayText
) => {
    for (const item of groupedCombobox.items) {
        if (item.label === groupLabel && item.items) {
            for (const subItem of item.items) {
                if (subItem.displayText === displayText) {
                    return subItem;
                }
            }
        }
    }
    return undefined;
};

export const getGroupedComboboxItem = (groupedCombobox, itemText) => {
    for (const item of groupedCombobox.items) {
        if (item.text === itemText) {
            return item;
        }
    }
    return undefined;
};

export const getFieldToFerovExpressionBuilders = parentElement => {
    return parentElement.shadowRoot.querySelectorAll(
        INTERACTION_COMPONENTS_SELECTORS.FIELD_TO_FEROV_EXPRESSION_BUILDER
    );
};

export const getBaseExpressionBuilder = parentElement => {
    return parentElement.shadowRoot.querySelector(
        INTERACTION_COMPONENTS_SELECTORS.BASE_EXPRESSION_BUILDER
    );
};

export const getEntityResourcePicker = editor => {
    return editor.shadowRoot.querySelector(
        INTERACTION_COMPONENTS_SELECTORS.ENTITY_RESOURCE_PICKER
    );
};

export const getRadioGroup = parentElement => {
    return parentElement.shadowRoot.querySelectorAll(
        LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_RADIO_GROUP
    );
};

export const getChildComponent = (parentComponent, childComponentSelector) => {
    return parentComponent.shadowRoot.querySelector(childComponentSelector);
};

export const getRecordVariablePickerChildGroupedComboboxComponent = parentPickerComponent => {
    const ferovResourcePicker = parentPickerComponent.shadowRoot.querySelector(
        INTERACTION_COMPONENTS_SELECTORS.FEROV_RESOURCE_PICKER
    );
    const baseResourcePicker = ferovResourcePicker.shadowRoot.querySelector(
        INTERACTION_COMPONENTS_SELECTORS.BASE_RESOURCE_PICKER
    );
    const interactionCombobox = baseResourcePicker.shadowRoot.querySelector(
        INTERACTION_COMPONENTS_SELECTORS.INTERACTION_COMBOBOX
    );
    return interactionCombobox.shadowRoot.querySelector(
        LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_GROUPED_COMBOBOX
    );
};

export const getEntityResourcePickerChildGroupedComboboxComponent = parentPickerComponent => {
    const resourcePicker = parentPickerComponent.shadowRoot.querySelector(
        INTERACTION_COMPONENTS_SELECTORS.BASE_RESOURCE_PICKER
    );
    const combobox = resourcePicker.shadowRoot.querySelector(
        INTERACTION_COMPONENTS_SELECTORS.COMBOBOX
    );
    return combobox.shadowRoot.querySelector(
        LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_GROUPED_COMBOBOX
    );
};

export const changeComboboxValue = (combobox, newValue) => {
    combobox.dispatchEvent(textInputEvent(newValue));
    combobox.dispatchEvent(blurEvent);
};

export const changeInputValue = (input, newValue) => {
    input.value = newValue;
    input.dispatchEvent(focusoutEvent);
};

export const newFilterItem = (
    lhsValue = '',
    operatorValue = '',
    rhsValue = '',
    rhsDataType = ''
) => ({
    leftHandSide: {
        value: lhsValue,
        error: null
    },
    rightHandSide: {
        value: rhsValue,
        error: null
    },
    rightHandSideDataType: {
        value: rhsDataType,
        error: null
    },
    operator: {
        value: operatorValue,
        error: null
    }
});

/**
 * Reset the state (to be called in afterAll)
 */
export const resetState = () => {
    setEntities();
    clearEntityFieldsCache();
    setSystemVariables('[]');
    setGlobalVariables({ globalVariableTypes: [], globalVariables: [] });
    setAuraFetch();
    resetFetchOnceCache();
    const store = Store.getStore(reducer);
    store.dispatch({ type: 'INIT' });
    setRules();
    OutputResourcePicker.RULES = [];
    resetCacheTemplates();
};

export class ToggleOnChangeEvent extends CustomEvent {
    constructor() {
        super('change', { detail: { checked: true } });
    }
}

export class OnChangeEvent extends CustomEvent {
    constructor(value) {
        super('change', { detail: { value } });
    }
}