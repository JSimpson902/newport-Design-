import {decisionValidation} from './decision-validation';
import {
    updateProperties,
    addItem,
    deleteItem,
    replaceItem,
    hydrateWithErrors,
    mutateOutcome
} from 'builder_platform_interaction-data-mutation-lib';
import {
    PropertyChangedEvent,
    DeleteOutcomeEvent,
    ReorderListEvent,
    AddConditionEvent,
    DeleteConditionEvent,
    UpdateConditionEvent
} from 'builder_platform_interaction-events';
import { generateGuid } from 'builder_platform_interaction-store-lib';
import { createFlowElement, ELEMENT_TYPE, SUB_ELEMENT_TYPE } from 'builder_platform_interaction-element-config';
import {PROPERTY_EDITOR_ACTION} from 'builder_platform_interaction-actions';
import { EXPRESSION_PROPERTY_TYPE } from 'builder_platform_interaction-expression-utils';
import { VALIDATE_ALL } from 'builder_platform_interaction-validation-rules';

const addOutcome = (state) => {
    let newOutcome = mutateOutcome(createFlowElement(ELEMENT_TYPE.OUTCOME, false));
    newOutcome = hydrateWithErrors(newOutcome);

    const outcomes = addItem(state.outcomes, newOutcome);

    return updateProperties(state, {outcomes});
};

const deleteOutcome = (state, event) => {
    const outcomes = state.outcomes.filter((outcome) => {
        return outcome.guid !== event.detail.guid;
    });

    return updateProperties(state, {outcomes});
};

const reorderOutcomes = (state, event) => {
    let outcomes = state.outcomes;
    const destinationIndex = state.outcomes.findIndex((element) => {
        return element.guid === event.detail.destinationGuid;
    });
    const movedOutcome = state.outcomes.find((outcome) => {
        return outcome.guid === event.detail.sourceGuid;
    });
    if (destinationIndex >= 0 && movedOutcome) {
        outcomes = state.outcomes.filter((outcome) => {
            return outcome.guid !== event.detail.sourceGuid;
        });
        outcomes.splice(destinationIndex, 0, movedOutcome);
    }
    return updateProperties(state, {outcomes});
};

const addCondition = (state, event) => {
    const outcomes = state.outcomes.map((outcome) => {
        const newCondition = {
            [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: { value: '', error: null },
            [EXPRESSION_PROPERTY_TYPE.OPERATOR]: { value: '', error: null},
            [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: { value: '', error: null},
            [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE_DATA_TYPE]: { value: '', error: null},
            rowIndex: generateGuid(SUB_ELEMENT_TYPE.CONDITION),
        };
        return outcome.guid === event.detail.parentGUID ? updateProperties(outcome, {
            conditions: addItem(outcome.conditions, newCondition),
        }) : outcome;
    });


    return updateProperties(state, {outcomes});
};

const deleteCondition = (state, event) => {
    const outcomes = state.outcomes.map((outcome) => {
        return outcome.guid === event.detail.parentGUID ? updateProperties(outcome, {
            conditions: deleteItem(outcome.conditions, event.detail.index)
        }) : outcome;
    });

    return updateProperties(state, {outcomes});
};

const updateCondition = (state, event) => {
    const outcomes = state.outcomes.map((outcome) => {
        if (outcome.guid === event.detail.parentGUID) {
            const newCondition = updateProperties(outcome.conditions[event.detail.index], event.detail.value);

            return updateProperties(outcome, {
                conditions: replaceItem(outcome.conditions, newCondition, event.detail.index)
            });
        }

        return outcome;
    });

    return updateProperties(state, {outcomes});
};

const outcomePropertyChanged = (state, event) => {
    event.detail.error = event.detail.error === null ?
        decisionValidation.validateProperty(event.detail.propertyName, event.detail.value) : event.detail.error;

    const outcomes = state.outcomes.map((outcome) => {
        return event.detail.guid !== outcome.guid ? outcome : updateProperties(outcome, {
            [event.detail.propertyName]: {error: event.detail.error, value: event.detail.value}
        });
    });

    return updateProperties(state, {outcomes});
};

const decisionPropertyChanged = (state, event) => {
    event.detail.error = event.detail.error === null ?
        decisionValidation.validateProperty(event.detail.propertyName, event.detail.value) : event.detail.error;
    return updateProperties(state, {[event.detail.propertyName]: {error: event.detail.error, value: event.detail.value}});
};

/**
 * decision reducer function runs validation rules and returns back the updated element state
 * @param {object} state - element / node state
 * @param {object} event - The event to be handled
 * @returns {object} state - updated state
 */
export const decisionReducer = (state, event) => {
    switch (event.type) {
        case PROPERTY_EDITOR_ACTION.ADD_DECISION_OUTCOME:
            return addOutcome(state);
        case PropertyChangedEvent.EVENT_NAME:
            if (event.detail.guid) {
                return outcomePropertyChanged(state, event);
            }

            return decisionPropertyChanged(state, event);
        case DeleteOutcomeEvent.EVENT_NAME:
            return deleteOutcome(state, event);
        case ReorderListEvent.EVENT_NAME:
            return reorderOutcomes(state, event);
        case AddConditionEvent.EVENT_NAME:
            return addCondition(state, event);
        case DeleteConditionEvent.EVENT_NAME:
            return deleteCondition(state, event);
        case UpdateConditionEvent.EVENT_NAME:
            return updateCondition(state, event);
        case VALIDATE_ALL:
            return decisionValidation.validateAll(state);
        default:
            return state;
    }
};

