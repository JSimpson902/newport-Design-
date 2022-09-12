import { MERGE_WITH_PARAMETERS, REMOVE_UNSET_PARAMETERS } from 'builder_platform_interaction/calloutEditorLib';
import {
    deleteItem,
    getValueFromHydratedItem,
    hydrateWithErrors,
    replaceItem,
    updateProperties
} from 'builder_platform_interaction/dataMutationLib';
import { createCondition, StageStep } from 'builder_platform_interaction/elementFactory';
import {
    ConfigurationEditorChangeEvent,
    CreateEntryConditionsEvent,
    DeleteAllConditionsEvent,
    DeleteConditionEvent,
    DeleteOrchestrationActionEvent,
    DeleteParameterItemEvent,
    ORCHESTRATED_ACTION_CATEGORY,
    OrchestrationActionValueChangedEvent,
    OrchestrationAssigneeChangedEvent,
    OrchestrationStageStepEditorValidateEvent,
    PropertyChangedEvent,
    RequiresAsyncProcessingChangedEvent,
    UpdateConditionEvent,
    UpdateEntryExitCriteriaEvent,
    UpdateParameterItemEvent
} from 'builder_platform_interaction/events';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { InvocableAction } from 'builder_platform_interaction/invocableActionLib';
import {
    deleteParameterItem,
    mergeActionErrorToActionName,
    mergeParameters,
    PARAMETER_PROPERTY,
    removeAllUnsetParameters,
    removeUnsetParameters,
    updateParameterItem,
    validateProperty
} from 'builder_platform_interaction/orchestratedStageAndStepReducerUtils';
import { commonUtils, invokeModal } from 'builder_platform_interaction/sharedUtils';
import { isPlainObject } from 'builder_platform_interaction/storeLib';
import { getElementByGuid } from 'builder_platform_interaction/storeUtils';
import { shouldCallSwapFunction } from 'builder_platform_interaction/translatorLib';
import { usedBy, UsedByElement } from 'builder_platform_interaction/usedByLib';
import { Validation } from 'builder_platform_interaction/validation';
import { LABELS } from './stageStepEditorLabels';
import { getRules } from './stageStepValidation';
const { format } = commonUtils;

const validation = new Validation();

const itemPropertyChanged = (state: StageStep, event: CustomEvent): StageStep => {
    event.detail.guid = state.guid;
    validateProperty(event, validation);
    return updateProperties(state, {
        [event.detail.propertyName]: {
            error: event.detail.error,
            value: event.detail.value
        }
    });
};

const hasOutputsReference = (object, guid: UI.Guid): boolean => {
    const outputsRE = new RegExp(`${guid}.Outputs`);

    if (Array.isArray(object)) {
        const objectLength = object && object.length;
        for (let index = 0; index < objectLength; index += 1) {
            if (hasOutputsReference(object[index], guid)) {
                return true;
            }
        }
    } else if (isPlainObject(object)) {
        const keys = Object.keys(object);
        const keysLength = keys && keys.length;
        for (let index = 0; index < keysLength; index += 1) {
            const key = keys[index];
            const value = getValueFromHydratedItem(object[key]);
            if (shouldCallSwapFunction(object, key, value)) {
                if (outputsRE.test(<string>value)) {
                    return true;
                }
            } else if (typeof value !== 'number') {
                if (hasOutputsReference(value, guid)) {
                    return true;
                }
            }
        }
    }

    return false;
};

/**
 * Helper method to invoke the alert modal regarding an action output being referenced
 *
 * @param usedByElements - List of elements which are referencing step.Outputs
 * @param actionName - Action's name
 */
function invokeUsedByAlertModal(usedByElements: UsedByElement[], actionName: string) {
    const listSectionHeader = LABELS.changeActionAlertListSectionHeader;
    const listSectionItems = usedByElements;
    const buttonVariant = 'Brand';
    const buttonLabel = LABELS.changeActionAlertOkayButtonLabel;

    const headerTitle = format(LABELS.changeActionAlertHeaderTitle, actionName);
    const bodyTextOne = format(LABELS.changeActionAlertBodyTextLabel, actionName);

    invokeModal({
        headerData: {
            headerTitle
        },
        bodyData: {
            bodyTextOne,
            listSectionHeader,
            listSectionItems
        },
        footerData: {
            buttonOne: {
                buttonVariant,
                buttonLabel
            }
        }
    });
}

const actionChanged = (state: StageStep, event: OrchestrationActionValueChangedEvent<InvocableAction>): StageStep => {
    const actionProperty: string = {
        [ORCHESTRATED_ACTION_CATEGORY.ENTRY]: 'entryAction',
        [ORCHESTRATED_ACTION_CATEGORY.EXIT]: 'exitAction',
        [ORCHESTRATED_ACTION_CATEGORY.STEP]: 'action'
    }[event.detail.actionCategory!];

    const actionErrorProperty: string = {
        [ORCHESTRATED_ACTION_CATEGORY.ENTRY]: 'entryActionError',
        [ORCHESTRATED_ACTION_CATEGORY.EXIT]: 'exitActionError',
        [ORCHESTRATED_ACTION_CATEGORY.STEP]: 'actionError'
    }[event.detail.actionCategory!];

    const actionInputParametersProperty: string = {
        [ORCHESTRATED_ACTION_CATEGORY.ENTRY]: PARAMETER_PROPERTY.ENTRY_INPUT,
        [ORCHESTRATED_ACTION_CATEGORY.EXIT]: PARAMETER_PROPERTY.EXIT_INPUT,
        [ORCHESTRATED_ACTION_CATEGORY.STEP]: PARAMETER_PROPERTY.INPUT
    }[event.detail.actionCategory!];

    let actionName: string | UI.HydratedValue = (<InvocableAction>event.detail.value).actionName;

    const actionProducer = (name) => {
        let hydratedAction = hydrateWithErrors({
            elementType: ELEMENT_TYPE.ACTION_CALL,
            actionType: event.detail.value?.actionType,
            actionName: name
        });

        if (event.detail.error) {
            hydratedAction = {
                ...hydratedAction,
                actionName: {
                    value: event.detail.value?.displayText,
                    error: event.detail.error
                }
            };
        }

        return hydratedAction;
    };

    let usedElements: UsedByElement[] = usedBy([state.guid]);
    // We only show this Alert Modal if a change happens to the Step Flow.
    // Entry/Exit Criteria Flows can be modified without raising concern.
    if (event.detail.actionCategory === ORCHESTRATED_ACTION_CATEGORY.STEP && usedElements && usedElements.length > 0) {
        usedElements = usedElements.filter((usingElement) => {
            return hasOutputsReference(getElementByGuid(usingElement.guid), state.guid);
        });

        if (usedElements.length > 0) {
            invokeUsedByAlertModal(usedElements, <string>actionName);
            actionName = <string>state.action.actionName?.value;

            return updateProperties(state, {
                [actionProperty]: actionProducer(actionName)
            });
        }
    }

    // if (event.detail.value?.actionName) {
    return updateProperties(state, {
        [actionProperty]: actionProducer(actionName),
        [actionErrorProperty]: event.detail.error,
        // Clear all parameters when changing action
        [actionInputParametersProperty]: [],
        [PARAMETER_PROPERTY.OUTPUT]: event.detail.actionCategory === ORCHESTRATED_ACTION_CATEGORY.STEP ? [] : undefined
    });
};

/**
 * Change assignee
 *
 * @param state The element state
 * @param event The event
 * @returns Updated state
 */
const assigneeChanged = (state: StageStep, event: OrchestrationAssigneeChangedEvent<any>): StageStep => {
    return updateProperties(state, {
        assignees: [
            {
                assignee: {
                    value: event.detail.value,
                    error: event.detail.error
                },
                assigneeType: event.detail.type,
                isReference: event.detail.isReference
            }
        ]
    });
};

/**
 * Updates an entry criteria
 *
 * @param state The flow model
 * @param event The event
 * @returns The updated criteria
 */
const updateEntryCriteria = (state: StageStep, event: UpdateConditionEvent): StageStep => {
    const newEntryCriteria = hydrateWithErrors(createCondition(event.detail.value));

    if (state.entryConditions && state.entryConditions.length > 0) {
        return updateProperties(state, {
            entryConditions: replaceItem(state.entryConditions, newEntryCriteria, event.detail.index)
        });
    }

    return updateProperties(state, {
        entryConditions: [newEntryCriteria]
    });
};

/**
 * delete entry criteria
 *
 * @param state The flow model
 * @param event The event
 * @returns new object with updated properties
 */
const deleteEntryCriteria = (state: StageStep, event: DeleteConditionEvent): StageStep => {
    return updateProperties(state, {
        entryConditions: deleteItem(state.entryConditions, event.detail.index)
    });
};

const createEntryConditions = (state: StageStep): StageStep => {
    return updateProperties(state, {
        entryConditions: []
    });
};

/**
 * Update the entryCriteria or exitCriteria field on the flow model
 *
 * @param state The flow model
 * @param event The event
 * @returns new object with updated properties
 */
const updateEntryExitCriteria = (state: StageStep, event: UpdateEntryExitCriteriaEvent) => {
    if (event.detail.actionCategory === ORCHESTRATED_ACTION_CATEGORY.ENTRY) {
        return updateProperties(state, {
            entryCriteria: {
                value: event.detail.criteria,
                error: null
            }
        });
    } else if (event.detail.actionCategory === ORCHESTRATED_ACTION_CATEGORY.EXIT) {
        return updateProperties(state, {
            exitCriteria: {
                value: event.detail.criteria,
                error: null
            }
        });
    }
    return state;
};

/**
 * delete entry criteria
 *
 * @param state The flow model
 * @returns new object with updated properties
 */
const deleteAllEntryConditions = (state: StageStep): StageStep => {
    return updateProperties(state, {
        entryConditions: null
    });
};

/**
 * delete an entry/exit determination action
 *
 * @param state The flow model
 * @param event The Event
 * @returns new object with updated properties
 */
const deleteDeterminationAction = (state: StageStep, event: DeleteOrchestrationActionEvent): StageStep => {
    const src = event.detail.actionCategory;
    if (src === ORCHESTRATED_ACTION_CATEGORY.ENTRY) {
        return updateProperties(state, {
            entryAction: null,
            entryActionError: null,
            entryActionName: null,
            entryActionType: null,
            entryActionInputParameters: []
        });
    } else if (src === ORCHESTRATED_ACTION_CATEGORY.EXIT) {
        return updateProperties(state, {
            exitAction: null,
            exitActionEror: null,
            exitActionName: null,
            exitActionType: null,
            exitActionInputParameters: []
        });
    }
    return state;
};

/**
 * Update the requiresAsyncProcessing field on the flow model
 *
 * @param state The flow model
 * @param event The event
 * @returns new object with updated properties
 */
const updateRequiresAsyncProcessingField = (state: StageStep, event: RequiresAsyncProcessingChangedEvent) => {
    return updateProperties(state, {
        requiresAsyncProcessing: event.detail.checked
    });
};

/**
 *
 * Updates any property on the StageStep directly from the value passed in the CPE
 * NOTE: no validation will be done here as it is assumed that the child CPE will perform any
 * necessary validation
 *
 * @param state the StageStep UI model
 * @param event the ConfigurationEditorChangeEvent from the CPE
 * @returns new StageStep with updated properties
 */
const updateFromConfigurationEditorChange = (state: StageStep, event: ConfigurationEditorChangeEvent) => {
    return updateProperties(state, {
        [event.detail.name]: event.detail.newValue
    });
};

/**
 * orchestratedStage reducer function runs validation rules and returns back the updated element state
 *
 * @param state The flow model
 * @param event The Event
 * @returns new object with updated properties
 */
export const stageStepReducer = (state: StageStep, event: CustomEvent): StageStep => {
    let newState: StageStep = state;

    switch (event.type) {
        case UpdateConditionEvent.EVENT_NAME:
            newState = updateEntryCriteria(state, event);
            break;
        case DeleteConditionEvent.EVENT_NAME:
            newState = deleteEntryCriteria(state, event);
            break;
        case OrchestrationActionValueChangedEvent.EVENT_NAME:
            newState = actionChanged(state, event);
            break;
        case OrchestrationAssigneeChangedEvent.EVENT_NAME:
            newState = assigneeChanged(state, event);
            break;
        case PropertyChangedEvent.EVENT_NAME:
            newState = itemPropertyChanged(state, event);
            break;
        case REMOVE_UNSET_PARAMETERS:
            newState = removeUnsetParameters(state, event.detail.rowIndex);
            break;
        case UpdateParameterItemEvent.EVENT_NAME:
            newState = updateParameterItem(state, event.detail);
            break;
        case DeleteParameterItemEvent.EVENT_NAME:
            newState = deleteParameterItem(state, event.detail);
            break;
        case DeleteOrchestrationActionEvent.EVENT_NAME:
            newState = deleteDeterminationAction(state, event);
            break;
        case DeleteAllConditionsEvent.EVENT_NAME:
            newState = deleteAllEntryConditions(state);
            break;
        case CreateEntryConditionsEvent.EVENT_NAME:
            newState = createEntryConditions(state);
            break;
        case RequiresAsyncProcessingChangedEvent.EVENT_NAME:
            newState = updateRequiresAsyncProcessingField(state, event);
            break;
        case UpdateEntryExitCriteriaEvent.EVENT_NAME:
            newState = updateEntryExitCriteria(state, event);
            break;
        case ConfigurationEditorChangeEvent.EVENT_NAME:
            newState = updateFromConfigurationEditorChange(state, event);
            break;
        case OrchestrationStageStepEditorValidateEvent.EVENT_NAME: {
            const typedEvent = event as OrchestrationStageStepEditorValidateEvent;
            const { relatedRecordPickerGuid, assigneePickerGuid } = typedEvent.detail;
            state = updateProperties(state, { action: mergeActionErrorToActionName(state.action, state.actionError) });
            state = updateProperties(state, {
                entryAction: mergeActionErrorToActionName(state.entryAction, state.entryActionError)
            });
            state = updateProperties(state, {
                exitAction: mergeActionErrorToActionName(state.exitAction, state.exitActionError)
            });

            return validation.validateAll(state, getRules(state, assigneePickerGuid, relatedRecordPickerGuid));
        }
        case MERGE_WITH_PARAMETERS:
            return mergeParameters(state, event.detail.parameters, event.detail.actionCategory);
        default:
            return state;
    }

    // Remove all "not included" input parameters from state before returning it for the store
    return removeAllUnsetParameters(newState);
};
