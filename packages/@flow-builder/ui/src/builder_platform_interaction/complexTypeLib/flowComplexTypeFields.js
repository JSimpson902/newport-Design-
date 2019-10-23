import { fetchDetailsForInvocableAction } from 'builder_platform_interaction/invocableActionLib';
import { describeExtensions } from 'builder_platform_interaction/flowExtensionLib';
import { fetchFieldsForEntity } from 'builder_platform_interaction/sobjectLib';
import {
    getSObjectOrSObjectCollectionByEntityElements,
    componentInstanceScreenFieldsSelector,
    byElementTypeElementsSelector
} from 'builder_platform_interaction/selectors';
import {
    ELEMENT_TYPE,
    ACTION_TYPE
} from 'builder_platform_interaction/flowMetadata';

/**
 * This is called once the flow has been loaded, so that complex types in the flow have their fields loaded and cached.
 */
export function loadFieldsForComplexTypesInFlow(state) {
    return Promise.all([
        loadFieldsForSobjectsInFlow(state),
        loadFieldsForExtensionsInFlow(state),
        loadParametersForInvocableActionsInFlow(state)
    ]);
}

export function loadFieldsForSobjectsInFlow(state) {
    // Only gets elements with sObject datatype (no collections)
    const sobjects = getSObjectOrSObjectCollectionByEntityElements(
        state.elements
    );
    const promises = [];
    for (let i = 0; i < sobjects.length; i++) {
        // fetch fields and cache them
        promises.push(
            fetchFieldsForEntity(sobjects[i].subtype, {
                disableErrorModal: true
            }).catch(() => {})
        );
    }
    return Promise.all(promises);
}

export function loadFieldsForExtensionsInFlow(state) {
    const extensionNames = componentInstanceScreenFieldsSelector(state)
        .filter(screenField => screenField.storeOutputAutomatically === true)
        .map(screenField => screenField.extensionName);
    return describeExtensions(extensionNames, {
        disableErrorModal: true,
        background: true
    }).catch(() => {});
}

export function loadParametersForInvocableApexActionsInFlowFromMetadata(
    actionCalls
) {
    const actionCallNamesAndTypes = actionCalls
        .filter(
            actionCall =>
                actionCall.storeOutputAutomatically === true &&
                actionCall.actionType === ACTION_TYPE.APEX
        )
        .map(actionCall => ({
            actionName: actionCall.actionName,
            actionType: actionCall.actionType
        }));
    const promises = [];
    actionCallNamesAndTypes.forEach(actionCallNameAndType =>
        promises.push(
            fetchDetailsForInvocableAction(actionCallNameAndType, {
                disableErrorModal: true,
                background: true
            }).catch(() => {})
        )
    );
    return Promise.all(promises);
}

export function loadParametersForInvocableActionsInFlow(state) {
    // we only get the action that have outputs. (e.g. EMAIL_ALERT is excluded)
    const actionCallsSelector = byElementTypeElementsSelector(
        ELEMENT_TYPE.ACTION_CALL,
        ELEMENT_TYPE.APEX_CALL,
        ELEMENT_TYPE.EXTERNAL_SERVICE
    );
    const actionCallNamesAndTypes = actionCallsSelector(state)
        .filter(actionCall => actionCall.storeOutputAutomatically === true)
        .map(actionCall => ({
            actionName: actionCall.actionName,
            actionType: actionCall.actionType
        }));
    const promises = [];
    actionCallNamesAndTypes.forEach(actionCallNameAndType =>
        promises.push(
            fetchDetailsForInvocableAction(actionCallNameAndType, {
                disableErrorModal: true,
                background: true
            }).catch(() => {})
        )
    );
    return Promise.all(promises);
}
