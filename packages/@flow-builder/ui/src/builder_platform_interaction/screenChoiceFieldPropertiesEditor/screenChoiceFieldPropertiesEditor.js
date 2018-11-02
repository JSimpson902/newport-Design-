import { LightningElement, api } from 'lwc';
import { PropertyChangedEvent, createChoiceAddedEvent, createChoiceChangedEvent, createChoiceDeletedEvent } from "builder_platform_interaction/events";
import { LABELS } from "builder_platform_interaction/screenEditorI18nUtils";
import { ELEMENT_TYPE } from "builder_platform_interaction/flowMetadata";
import { INPUT_FIELD_DATA_TYPE } from "builder_platform_interaction/dataTypeLib";
import {  getFieldChoiceData } from "builder_platform_interaction/screenEditorUtils";
import { addCurrentValueToEvent } from "builder_platform_interaction/screenEditorCommonUtils";
import { hydrateIfNecessary } from "builder_platform_interaction/dataMutationLib";

const EXPANDED_SECTION_NAMES = ['choicesSection'];
const FLOW_INPUT_FIELD_SUB_TYPES = Object.values(INPUT_FIELD_DATA_TYPE);

/*
 * Screen element property editor for the radio field.
 */
export default class ScreenChoiceFieldPropertiesEditor extends LightningElement {
    @api field;

    labels = LABELS;
    inputFieldMap = INPUT_FIELD_DATA_TYPE;

    get expandedSectionNames() {
        return EXPANDED_SECTION_NAMES;
    }

    handlePropertyChanged = (event) => {
        this.dispatchEvent(addCurrentValueToEvent(event, this.field, this.field[event.detail.propertyName]));
        event.stopPropagation();
    }

    handleDataTypeChanged(event) {
        event.stopPropagation();
        const newFieldDataType = this.getFlowDataTypeFromInputType(event.detail.value.dataType);
        this.dispatchEvent(new PropertyChangedEvent("dataType", newFieldDataType, event.detail.error, this.field.guid, this.field.dataType));
    }

    handleDefaultValuePropertyChanged = (event) => {
        event.stopPropagation();

        // User is trying to set default value back to nothing.
        let newValue = '';
        if (event && event.detail && event.detail.guid) {
            // We get the display value from the event, which might be something
            // like {!choice1}, but we want the devName. Get the devName by using the GUID.
            newValue = event.detail.guid;
        }

        this.dispatchEvent(new PropertyChangedEvent(
            event.detail.propertyName,
            hydrateIfNecessary(newValue),
            event.detail.error,
            event.detail.guid ? event.detail.guid : null,
            hydrateIfNecessary(this.field.defaultValue)
        ));
    }

    handleChoiceChanged = (event) => {
        event.stopPropagation();

        // We get the display value from the event, which might be something
        // like {!choice1}, but we want the devName. Get the devName by using the GUID.
        if (event && event.detail) {
            this.dispatchEvent(createChoiceChangedEvent(this.field, {
                value: event.detail.guid,
                error: event.detail.error
            }, event.detail.listIndex));
        }
    }

    handleChoiceDeleted = (event) => {
        event.stopPropagation();
        this.dispatchEvent(createChoiceDeletedEvent(this.field, event.detail.index));
    }

    handleChoiceAdded = (event) => {
        event.stopPropagation();
        this.dispatchEvent(createChoiceAddedEvent(this.field, this.field.choiceReferences.length));
    }

    get fieldChoices() {
        return getFieldChoiceData(this.field);
    }

    get choiceResourcePickerConfig() {
        return {
            allowLiterals: false,
            collection: false,
            hideGlobalConstants: true,
            hideNewResource: false,
            elementConfig: {
                elementType: ELEMENT_TYPE.SCREEN,
                dataType: this.field.dataType,
                choices: true
            }
        };
    }

    get isFieldDisabled() {
        // Left like this for testing during development
        return !this.field.isNewField;
    }

    get dataTypePickerValue() {
        return this.field.dataType ? this.getInputTypeFromFieldDataType : { dataType: null };
    }

    get dataTypeList() {
        return FLOW_INPUT_FIELD_SUB_TYPES;
    }

    get showDelete() {
        return this.field.choiceReferences.length > 1;
    }

    // Convert the value selected from the data type drop down menu to the corresponding flow data type.
    get getInputTypeFromFieldDataType() {
        for (const key in this.inputFieldMap) {
            if (this.field.dataType === key) {
                return { dataType : this.inputFieldMap[key].value };
            }
        }
        throw new Error("Screen field data type is set, but unable to find corresponding flow data type: " + this.field.dataType);
    }


    get defaultValueDisabled() {
        // If the dataType isn't set yet, user should not be able to set default value.
        // Or, if the only choice associated with this field is the placeholder choice, then don't let them set default value yet.
        return this.field.dataType === null || (this.field.choiceReferences.length === 1 &&
            this.field.choiceReferences[0].choiceReference.value.trim() === '');
    }

    get choiceDisabled() {
        // If the dataType isn't set yet, user should not be able to set any choice values.
        return this.field.dataType === null;
    }

    // Convert flow data type to the value from the data type drop down list.
    getFlowDataTypeFromInputType(newValue) {
        for (const key in this.inputFieldMap) {
            if (this.inputFieldMap[key].value === newValue) {
                return key;
            }
        }
        throw new Error("Unable to find Flow data type for provided screen field input type: " + newValue);
    }

    // Used to figure out which choices are available as possible values for the default value setting.
    // The only options should be those that are associated with this field (not all choices in the flow).
    get defaultValueChoices() {
        const defaultChoice = {
            label: this.labels.select,
            value: ''
        };

        const choices = getFieldChoiceData((this.field));
        return choices.reduce((acc, {label, guid}) => {
            return [...acc, {
                label,
                value: guid
            }];
        }, [defaultChoice]);
    }
}