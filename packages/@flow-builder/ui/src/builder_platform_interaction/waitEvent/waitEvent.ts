// @ts-nocheck
import { getConditionsWithPrefixes, showDeleteCondition } from 'builder_platform_interaction/conditionListUtils';
import { getErrorsFromHydratedElement } from 'builder_platform_interaction/dataMutationLib';
import {
    DeleteWaitEventEvent,
    WaitEventParameterChangedEvent,
    WaitEventPropertyChangedEvent
} from 'builder_platform_interaction/events';
import { CONDITION_LOGIC, ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { getRulesForElementType, RULE_OPERATOR, RULE_TYPES } from 'builder_platform_interaction/ruleLib';
import { api, LightningElement, track } from 'lwc';
import { LABELS } from './waitEventLabels';

const SELECTORS = {
    LABEL_DESCRIPTION: 'builder_platform_interaction-label-description'
};

export default class WaitEvent extends LightningElement {
    labels = LABELS;
    defaultOperator = RULE_OPERATOR.EQUAL_TO;

    conditionLogicOptions = [
        { value: CONDITION_LOGIC.NO_CONDITIONS, label: LABELS.alwaysWaitLabel },
        { value: CONDITION_LOGIC.AND, label: LABELS.andConditionLogicLabel },
        { value: CONDITION_LOGIC.OR, label: LABELS.orConditionLogicLabel },
        {
            value: CONDITION_LOGIC.CUSTOM_LOGIC,
            label: LABELS.customConditionLogicLabel
        }
    ];

    rulesForExpressionBuilder = getRulesForElementType(RULE_TYPES.COMPARISON, this.elementTypeForExpressionBuilder);

    @track element;

    @api get waitEvent() {
        return this.element;
    }

    set waitEvent(waitEvent) {
        this.element = waitEvent;
    }

    @api showDelete;

    /** Focus the label field of the label description component */
    @api focus() {
        this.template.querySelector(SELECTORS.LABEL_DESCRIPTION).focus();
    }

    handleDelete(event) {
        event.stopPropagation();

        const deleteWaitEventEvent = new DeleteWaitEventEvent(this.element.guid);
        this.dispatchEvent(deleteWaitEventEvent);
    }

    handlePropertyChanged(event) {
        event.stopPropagation();

        const { propertyName, value, error, oldValue } = event.detail;
        const guid = this.element.guid;

        const waitEventPropertyChangedEvent = new WaitEventPropertyChangedEvent(
            propertyName,
            value,
            error,
            guid,
            oldValue
        );
        this.dispatchEvent(waitEventPropertyChangedEvent);
    }

    handleParameterChanged(event) {
        event.stopPropagation();
        const waitEventParameterChanged = new WaitEventParameterChangedEvent(
            {
                value: event.detail.name,
                error: null
            },
            {
                value: event.detail.value,
                error: event.detail.error
            },
            {
                value: event.detail.valueDataType,
                error: null
            },
            event.detail.error,
            this.element.guid,
            event.detail.isInput
        );
        this.dispatchEvent(waitEventParameterChanged);
    }

    get upperCaseWaitConditionsTabText() {
        return LABELS.waitConditionsTabText.toUpperCase();
    }

    get upperCaseResumeConditionsTabText() {
        return LABELS.resumeConditionsTabText.toUpperCase();
    }

    get elementTypeForExpressionBuilder() {
        return ELEMENT_TYPE.WAIT;
    }

    get conditionsWithPrefixes() {
        return this.element.conditions && this.element.conditionLogic
            ? getConditionsWithPrefixes(this.element.conditionLogic, this.element.conditions)
            : [];
    }

    /**
     * Helper method needed for conditions list
     *
     * @returns {boolean} if delete should be shown for each condition
     */
    get showDeleteCondition() {
        return this.element.conditions && showDeleteCondition(this.element.conditions);
    }

    get showErrorIndicatorWaitConditions() {
        if (!this.element.conditions && !this.element.conditionLogic) {
            return false;
        }
        const conditions = this.element.conditions || [];
        const conditionLogic = this.element.conditionLogic ? { conditionLogic: this.element.conditionLogic } : {};

        return (
            getErrorsFromHydratedElement(conditions).length > 0 ||
            getErrorsFromHydratedElement(conditionLogic).length > 0
        );
    }

    get showErrorIndicatorResumeConditions() {
        if (!this.element.inputParameters && !this.element.outputParameters && !this.element.eventType) {
            return false;
        }
        const inputParams = this.element.inputParameters || [];
        const outputParams = this.element.outputParameters || {};
        const eventType = this.element.eventType ? { eventType: this.element.eventType } : {};

        return (
            getErrorsFromHydratedElement(inputParams).length > 0 ||
            getErrorsFromHydratedElement(outputParams).length > 0 ||
            getErrorsFromHydratedElement(eventType).length > 0
        );
    }
}
