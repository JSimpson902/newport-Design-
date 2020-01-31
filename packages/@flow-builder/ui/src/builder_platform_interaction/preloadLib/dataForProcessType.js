import { fetchOnce, SERVER_ACTION_TYPE } from 'builder_platform_interaction/serverDataLib';

import { setRules, setOperators } from 'builder_platform_interaction/ruleLib';
import { setResourceTypes } from 'builder_platform_interaction/dataTypeLib';
import { setEntities, setEventTypes, setWorkflowEnabledEntities } from 'builder_platform_interaction/sobjectLib';
import { setGlobalVariables, setSystemVariables } from 'builder_platform_interaction/systemLib';
import {
    getFlowSystemVariableComboboxItem,
    getGlobalVariableTypeComboboxItems
} from 'builder_platform_interaction/expressionUtils';
import { addToParentElementCache } from 'builder_platform_interaction/comboboxCache';
import { setInvocableActions } from 'builder_platform_interaction/invocableActionLib';
import { setProcessTypeFeature } from 'builder_platform_interaction/systemLib';
import { setSubflows } from 'builder_platform_interaction/subflowsLib';

export const loadActions = flowProcessType =>
    fetchOnce(SERVER_ACTION_TYPE.GET_INVOCABLE_ACTIONS, { flowProcessType }, { background: true }).then(
        setInvocableActions
    );

export const loadApexPlugins = () => fetchOnce(SERVER_ACTION_TYPE.GET_APEX_PLUGINS, {}, { background: true });

export const loadSubflows = flowProcessType =>
    fetchOnce(SERVER_ACTION_TYPE.GET_SUBFLOWS, { flowProcessType }, { background: true }).then(setSubflows);

export const loadRules = () => fetchOnce(SERVER_ACTION_TYPE.GET_RULES, {}, { disableErrorModal: true }).then(setRules);

export const loadOperators = () =>
    fetchOnce(SERVER_ACTION_TYPE.GET_OPERATORS, {}, { disableErrorModal: true }).then(setOperators);

export const loadEventTypes = () =>
    fetchOnce(SERVER_ACTION_TYPE.GET_EVENT_TYPES, {}, { disableErrorModal: true }).then(setEventTypes);

export const loadEntities = crudType =>
    fetchOnce(SERVER_ACTION_TYPE.GET_ENTITIES, { crudType }, { disableErrorModal: true }).then(setEntities);

export const loadWorkflowEnabledEntities = () =>
    fetchOnce(SERVER_ACTION_TYPE.GET_WORKFLOW_ENABLED_ENTITIES, {}, { disableErrorModal: true }).then(
        setWorkflowEnabledEntities
    );

export const loadResourceTypes = flowProcessType =>
    fetchOnce(SERVER_ACTION_TYPE.GET_RESOURCE_TYPES, { flowProcessType }, { disableErrorModal: true }).then(
        setResourceTypes
    );

export const loadGlobalVariables = flowProcessType =>
    fetchOnce(SERVER_ACTION_TYPE.GET_ALL_GLOBAL_VARIABLES, { flowProcessType }, { disableErrorModal: true }).then(
        data => {
            setGlobalVariables(data);
            getGlobalVariableTypeComboboxItems().forEach(item => addToParentElementCache(item.displayText, item));
        }
    );

export const loadSystemVariables = flowProcessType =>
    fetchOnce(
        SERVER_ACTION_TYPE.GET_SYSTEM_VARIABLES,
        {
            flowProcessType
        },
        { disableErrorModal: true }
    ).then(data => {
        const item = getFlowSystemVariableComboboxItem();
        // system variables are treated like sobjects in the menu data so this category is a "parent element" as well
        addToParentElementCache(item.displayText, item);
        setSystemVariables(data);
    });

export const loadProcessTypeFeatures = flowProcessType =>
    fetchOnce(SERVER_ACTION_TYPE.GET_PROCESS_TYPE_FEATURES, {
        flowProcessType
    }).then(data => {
        setProcessTypeFeature(flowProcessType, data);
    });
