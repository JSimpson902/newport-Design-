import { LightningElement, api, track } from 'lwc';
import {
    PropertyChangedEvent,
    AddConditionEvent,
    DeleteConditionEvent,
    UpdateConditionEvent
} from 'builder_platform_interaction-events';
import { CONDITION_LOGIC} from 'builder_platform_interaction-flow-metadata';
import { LABELS } from './condition-list-labels';

const SELECTORS = {
    LABEL_DESCRIPTION: 'builder_platform_interaction-label-description',
    CUSTOM_LOGIC: '.customLogic'
};

/**
 * Usage: <builder_platform_interaction-logic-list></builder_platform_interaction-logic-list>
 */
export default class ConditionList extends LightningElement {
    @track state = {
        conditions: [],
        conditionLogicComboBoxValue: null,
        conditionLogic: null,
        showCustomLogicInput: false
    };

    labels = LABELS;

    @track conditionLogicOptions = [
        {value: CONDITION_LOGIC.AND, label: this.labels.andConditionLogicLabel},
        {value: CONDITION_LOGIC.OR, label: this.labels.orConditionLogicLabel},
        {value: CONDITION_LOGIC.CUSTOM_LOGIC, label: this.labels.customConditionLogicLabel},
    ];

    @track
    showErrorMessageIfBlank = this.labels.cannotBeBlankError;

    @api get conditions() {
        return this.state.conditions;
    }

    set conditions(conditions) {
        this.state.conditions = conditions;
    }

    @api get conditionLogic() {
        return this.state.conditionLogic;
    }

    set conditionLogic(conditionLogic) {
        this.state.conditionLogic = conditionLogic;

        this.processConditionLogic(this.state.conditionLogic.value);
    }

    @api
    parentGuid;

    @api
    logicComboboxLabel;

    @api
    containerElementType;

    processConditionLogic(value) {
        this.state.conditionLogicComboBoxValue = value;
        this.state.showCustomLogicInput = false;

        if (value !== CONDITION_LOGIC.AND && value !== CONDITION_LOGIC.OR) {
            // Select the custom logic option in the dropdown
            this.state.conditionLogicComboBoxValue = CONDITION_LOGIC.CUSTOM_LOGIC;
            // And show the custom logic input
            this.state.showCustomLogicInput = true;
        }
    }

    get showDeleteCondition() {
        return this.state.conditions.length > 1;
    }

    getPrefix(index) {
        // conditionLogic.value is either 'and' or 'or' or a custom logic string (e.g. '1 AND (2 or 3)'
        if (this.state.conditionLogic.value === CONDITION_LOGIC.AND || this.state.conditionLogic.value === CONDITION_LOGIC.OR) {
            return index > 0 ? this.state.conditionLogic.value : '';
        }
        // Convert to 1 based indexes
        return (index + 1).toString();
    }

    get conditionsWithPrefixes() {
        return this.state.conditions.map((condition, i) => {
            return {
                prefix: this.getPrefix(i).toUpperCase(),
                condition
            };
        });
    }

    /** Sets the CustomValidity if there is a valid error message.
     * @param {Object} element - the input component
     * @param {Object} error - the error
     */
    setInputErrorMessage(element, error) {
        if (element) {
            if (error) {
                element.setCustomValidity(error);
            } else {
                element.setCustomValidity('');
            }
            element.showHelpMessageIfInvalid();
        }
    }

    /** After rendering the condition logic component we are setting the error
     * via setCustomValidity, except initial rendering.
     */
    renderedCallback() {
        if (this.state.conditionLogic) {
            const conditionLogicInput = this.template.querySelector(SELECTORS.CUSTOM_LOGIC);
            this.setInputErrorMessage(conditionLogicInput, this.state.conditionLogic.error);
        }
    }

    /**
     * @param {string} logicalOperator the logical operator we will use to build the custom logic
     * (should be either 'and' or 'or')
     * @return {string} Default logic string which is all conditions separate by AND or OR.
     * E.g. For three conditions and logicalOperator AND, '1 AND 2 AND 3' is returned
     */
    getDefaultCustomLogicString(logicalOperator) {
        logicalOperator = logicalOperator.toUpperCase();

        let customLogic = '1';
        for (let i = 2; i <= this.state.conditions.length; i++) {
            customLogic += ` ${logicalOperator} ${i}`;
        }

        return customLogic;
    }

    handleConditionLogicChange(event) {
        let newLogicValue = event.detail.value;
        if (newLogicValue === CONDITION_LOGIC.CUSTOM_LOGIC) {
            newLogicValue = this.getDefaultCustomLogicString(this.state.conditionLogicComboBoxValue);
        }

        const propertyChangedEvent = new PropertyChangedEvent(
            'conditionLogic',
            newLogicValue, null, this.parentGuid);
        this.dispatchEvent(propertyChangedEvent);
    }

    handleCustomLogicFocusOut(event) {
        const value = event.target.value;

        const propertyChangedEvent = new PropertyChangedEvent('conditionLogic', value, null, this.parentGuid);
        this.dispatchEvent(propertyChangedEvent);
    }

    /**
     * @param {object} event - AddListItemEvent to add a condition at the end of the list
     */
    handleAddCondition(event) {
        event.stopPropagation();

        const addConditionEvent = new AddConditionEvent(this.parentGuid);

        this.dispatchEvent(addConditionEvent);
    }

    /**
     * @param {object} event - DeleteListItemEvent to delete a condition at the given index
     */
    handleDeleteCondition(event) {
        event.stopPropagation();

        const deleteConditionEvent = new DeleteConditionEvent(this.parentGuid, event.detail.index);

        this.dispatchEvent(deleteConditionEvent);
    }

    /**
     * @param {object} event - UpdateListItemEvent to update a property value in the condition at the given index
     */
    handleUpdateCondition(event) {
        event.stopPropagation();

        const updateConditionEvent = new UpdateConditionEvent(this.parentGuid,
            event.detail.index,
            event.detail.value,
            event.detail.error
        );

        this.dispatchEvent(updateConditionEvent);
    }
}