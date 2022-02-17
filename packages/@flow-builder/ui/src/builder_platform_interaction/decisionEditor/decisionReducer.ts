// @ts-nocheck
import { PROPERTY_EDITOR_ACTION } from 'builder_platform_interaction/actions';
import { conditionListReducer } from 'builder_platform_interaction/conditionListReducer';
import { addItem, hydrateWithErrors, updateProperties } from 'builder_platform_interaction/dataMutationLib';
import { createOutcome } from 'builder_platform_interaction/elementFactory';
import {
    AddConditionEvent,
    DeleteConditionEvent,
    DeleteOutcomeEvent,
    ExecuteWhenOptionChangedEvent,
    PropertyChangedEvent,
    ReorderListEvent,
    UpdateConditionEvent
} from 'builder_platform_interaction/events';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { isExecuteOnlyWhenChangeMatchesConditionsPossible } from 'builder_platform_interaction/storeUtils';
import { invokeUsedByAlertModal, usedByStoreAndElementState } from 'builder_platform_interaction/usedByLib';
import { VALIDATE_ALL } from 'builder_platform_interaction/validationRules';
import { LABELS } from './decisionEditorLabels';
import { decisionValidation } from './decisionValidation';

let deletedOutcomeGuids;

export const resetDeletedGuids = () => {
    deletedOutcomeGuids = new Map();
};

const addOutcome = (state) => {
    let newOutcome = createOutcome();
    newOutcome.showOutcomeExecutionOptions = isExecuteOnlyWhenChangeMatchesConditionsPossible();
    newOutcome = hydrateWithErrors(newOutcome);

    const outcomes = addItem(state.outcomes, newOutcome);

    return updateProperties(state, { outcomes });
};

const changeExecuteWhenOption = (state, event) => {
    const outcomes = state.outcomes.map((outcome) => {
        return outcome.guid === event.detail.guid
            ? updateProperties(outcome, {
                  doesRequireRecordChangedToMeetCriteria: event.detail.doesRequireRecordChangedToMeetCriteria
              })
            : outcome;
    });
    return updateProperties(state, { outcomes });
};

const deleteOutcome = (state, event) => {
    const usedElements = usedByStoreAndElementState(event.detail.guid, state.guid, state.outcomes);
    if (usedElements && usedElements.length > 0) {
        invokeUsedByAlertModal(usedElements, [event.detail.guid], ELEMENT_TYPE.OUTCOME);
    } else {
        const outcomes = state.outcomes.filter((outcome) => {
            return outcome.guid !== event.detail.guid;
        });

        // store guids that have been removed
        // TODO: W-5507691 handle addition/removal of store elements inside editors more cleanly
        deletedOutcomeGuids.set(event.detail.guid, true);

        return updateProperties(state, { outcomes });
    }
    return state;
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
    return updateProperties(state, { outcomes });
};

const addDeleteConditionHelper = (state, event) => {
    const outcomes = state.outcomes.map((outcome) => {
        return outcome.guid === event.detail.parentGUID ? conditionListReducer(outcome, event) : outcome;
    });

    return updateProperties(state, { outcomes });
};

const addCondition = (state, event) => addDeleteConditionHelper(state, event);
const deleteCondition = (state, event) => addDeleteConditionHelper(state, event);

const updateCondition = (state, event) => {
    const outcomes = state.outcomes.map((outcome) => {
        return outcome.guid === event.detail.parentGUID
            ? conditionListReducer(outcome, event, deletedOutcomeGuids, LABELS.decisionSingularLabel)
            : outcome;
    });

    return updateProperties(state, { outcomes });
};

const validateProperty = (state, event) => {
    event.detail.error =
        event.detail.error === null
            ? decisionValidation.validateProperty(event.detail.propertyName, event.detail.value)
            : event.detail.error;
    if (event.detail.error === null && event.detail.propertyName === 'name') {
        // we need to run the outcome api name uniqueness validation within the current session of property editor
        event.detail.error = decisionValidation.validateOutcomeNameUniquenessLocally(
            state,
            event.detail.value,
            event.detail.guid
        );
    }
};

const outcomePropertyChanged = (state, event) => {
    validateProperty(state, event);
    const outcomes = state.outcomes.map((outcome) => {
        return event.detail.guid !== outcome.guid
            ? outcome
            : updateProperties(outcome, {
                  [event.detail.propertyName]: {
                      error: event.detail.error,
                      value: event.detail.value
                  }
              });
    });

    return updateProperties(state, { outcomes });
};

const decisionPropertyChanged = (state, event) => {
    // TODO: W-5553931 Guid should already be present in the event.
    event.detail.guid = state.guid;
    validateProperty(state, event);
    return updateProperties(state, {
        [event.detail.propertyName]: {
            error: event.detail.error,
            value: event.detail.value
        }
    });
};

/**
 * decision reducer function runs validation rules and returns back the updated element state
 *
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
        case ExecuteWhenOptionChangedEvent.EVENT_NAME:
            return changeExecuteWhenOption(state, event);
        case VALIDATE_ALL:
            return decisionValidation.validateAll(state);
        default:
            return state;
    }
};
