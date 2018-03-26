import { ELEMENT_TYPE } from 'builder_platform_interaction-constant';
import { deepCopy } from 'builder_platform_interaction-store-lib';

/**
 * Add property editor mutation for decision
 *
 * @param {Object} decision Decision element to mutate
 * @param {Object} state State of the whole project
 */
export const mutateDecision = (decision, state) => {
    decision.outcomes = [];

    const outcomeReferences = decision.outcomeReferences || [];
    for (const outcomeReference of outcomeReferences) {
        decision.outcomes.push(deepCopy(state.elements[outcomeReference.outcomeReference]));
    }

    delete decision.outcomeReferences;
};

/**
 * Remove property editor mutation for decision
 *
 * 1. Update decision outcomeReferences
 * 2. capture new/modified outcomes
 * 3. capture deleted outcomes
 *
 * @param {Object} decision Decision element to de-mutate
 * @param {Object} state State of the whole project
 * @returns {{decision: Object, outcomes: Array, deletedOutcomes: Array}} Contains the decision and its outcomes as
 * well as deleted outcomes
 */
export const deMutateDecision = (decision, state) => {
    const decisionWithModifiedAndDeletedOutcomes = {
        elementType: ELEMENT_TYPE.DECISION_WITH_MODIFIED_AND_DELETED_OUTCOMES,
        decision,
        outcomes: [],
        deletedOutcomes: []
    };

    const originalOutcomeReferences = state.elements[decision.guid].outcomeReferences;

    const currentOutcomes = decision.outcomes || [];

    // Capture all current outcome guids for ease of determining which outcomes have been deleted
    const currentOutcomeGuids = [];

    // Update decision outcomeReferences
    decision.outcomeReferences = [];
    currentOutcomes.forEach((outcome) => {
        decision.outcomeReferences.push({
            outcomeReference: outcome.guid
        });
        currentOutcomeGuids.push(outcome.guid);
    });

    // Note which outcomes have been modified
    decisionWithModifiedAndDeletedOutcomes.outcomes.push(...currentOutcomes);

    // Note which outcomes have been deleted
    decisionWithModifiedAndDeletedOutcomes.deletedOutcomes = originalOutcomeReferences.map((outcomeReference) => {
        return state.elements[outcomeReference.outcomeReference];
    }).filter((outcome) => {
        return !currentOutcomeGuids.includes(outcome.guid);
    });

    delete decision.outcomes;

    return decisionWithModifiedAndDeletedOutcomes;
};
