// @ts-nocheck
import {
    getParameterListWarnings,
    MERGE_WITH_PARAMETERS,
    REMOVE_UNSET_PARAMETERS
} from 'builder_platform_interaction/calloutEditorLib';
import {
    getActionCallTypeMappings,
    getAutomaticOutputVariables,
    getBuilderContext,
    getElementInfo,
    getInputVariables,
    useConfigurationEditor
} from 'builder_platform_interaction/customPropertyEditorLib';
import { getErrorsFromHydratedElement, getValueFromHydratedItem } from 'builder_platform_interaction/dataMutationLib';
import {
    CannotRetrieveCalloutParametersEvent,
    ClosePropertyEditorEvent,
    PropertyChangedEvent,
    SetPropertyEditorTitleEvent,
    UpdateNodeEvent
} from 'builder_platform_interaction/events';
import { FLOW_PROCESS_TYPE, FLOW_TRANSACTION_MODEL } from 'builder_platform_interaction/flowMetadata';
import {
    applyDynamicTypeMappings,
    fetchDetailsForInvocableAction,
    getParametersForInvocableAction,
    isAutomaticOutputHandlingSupported
} from 'builder_platform_interaction/invocableActionLib';
import { getProcessTypeTransactionControlledActionsSupport } from 'builder_platform_interaction/processTypeLib';
import { fetchOnce, SERVER_ACTION_TYPE } from 'builder_platform_interaction/serverDataLib';
import { commonUtils, loggingUtils } from 'builder_platform_interaction/sharedUtils';
import { Store } from 'builder_platform_interaction/storeLib';
import { VALIDATE_ALL } from 'builder_platform_interaction/validationRules';
import { api, LightningElement, track } from 'lwc';
import { ACTION_TYPE_LABEL, LABELS } from './invocableActionEditorLabels';
import { invocableActionReducer, MERGE_WITH_DATA_TYPE_MAPPINGS } from './invocableActionReducer';

const { format } = commonUtils;

const { logInteraction } = loggingUtils;

export default class InvocableActionEditor extends LightningElement {
    connected = false;
    labels = LABELS;
    processTypeValue = FLOW_PROCESS_TYPE.FLOW;

    @track
    actionCallNode = {};

    @track
    displaySpinner = true;

    @track
    invocableActionConfigurationEditorDescriptor;

    @track
    invocableActionDescriptor;

    @track
    invocableActionParametersDescriptor;

    @track
    invocableActionGenericTypesDescriptor;

    @api
    mode;

    @api
    editorParams;

    connectedCallback() {
        this.connected = true;
        this.updatePropertyEditorTitle();
        if (this.node) {
            this.fixNodeIfAutomaticOutputUnsupported();
            this.fetchInvocableActionDescriptor();
            this.fetchActionParameters();
        }
    }

    set node(newValue) {
        this.actionCallNode = newValue || {};
        if (this.connected) {
            this.fixNodeIfAutomaticOutputUnsupported();
            this.fetchInvocableActionDescriptor();
            this.fetchActionParameters();
        }
    }

    fixNodeIfAutomaticOutputUnsupported() {
        if (!isAutomaticOutputHandlingSupported(this.processTypeValue)) {
            // If the process type does not support automatic output handling we need to set storeOutputAutomatically to false.
            this.actionCallNode = {
                ...this.actionCallNode,
                storeOutputAutomatically: false
            };
        }
    }

    updateFlowTransactionModel() {
        const propName = 'flowTransactionModel';
        let transactionModel = getValueFromHydratedItem(this.actionCallNode.flowTransactionModel);
        // if process type and actions allow transaction control setting and if transaction model isn't set
        // Scenario 1: if it is new action, set it to automatic by default
        // Scenario 2: if it existing action, set it to current by default
        if (!transactionModel && this.showTransactionControlPicker) {
            transactionModel = this.isNewMode
                ? FLOW_TRANSACTION_MODEL.AUTOMATIC
                : FLOW_TRANSACTION_MODEL.CURRENT_TRANSACTION;
            const event = new PropertyChangedEvent(propName, transactionModel, null);
            this.actionCallNode = invocableActionReducer(this.actionCallNode, event);
        }
    }

    disconnectedCallback() {
        this.connected = false;
    }

    @api
    get node() {
        return this.actionCallNode;
    }

    /**
     * public api function to return the node
     *
     * @returns {object} node - node
     */
    @api getNode() {
        const event = new CustomEvent(REMOVE_UNSET_PARAMETERS);
        return invocableActionReducer(this.actionCallNode, event);
    }

    /**
     * public api function to run the rules from actionCall validation library
     *
     * @returns {Object[]} list of errors
     */
    @api validate() {
        const event = { type: VALIDATE_ALL };
        this.actionCallNode = invocableActionReducer(this.actionCallNode, event);
        this.updateDataTypeMappings();
        let errors = getErrorsFromHydratedElement(this.actionCallNode);
        if (this.configurationEditor) {
            const baseCalloutEditor = this.template.querySelector('builder_platform_interaction-base-callout-editor');
            if (baseCalloutEditor) {
                const baseCalloutEditorErrors = baseCalloutEditor.validate();
                errors = [...errors, ...baseCalloutEditorErrors];
                if (errors.length === 0) {
                    logInteraction(
                        'invocable-action-configuratior-editor-done',
                        'modal',
                        {
                            actionName: getValueFromHydratedItem(this.node.actionName),
                            actionType: getValueFromHydratedItem(this.node.actionType),
                            configurationEditor: this.configurationEditor.name
                        },
                        'click'
                    );
                }
                return errors;
            }
        }
        return errors;
    }

    /**
     * @returns {FLOW_PROCESS_TYPE} Flow process Type supports automatic output handling
     */
    @api
    get processType() {
        return this.processTypeValue;
    }

    set processType(newValue) {
        this.processTypeValue = newValue;
    }

    /**
     * @returns {FLOW_TRIGGER_TYPE}
     */
    @api
    get triggerType() {
        return this.triggerTypeValue;
    }

    set triggerType(newValue) {
        this.triggerTypeValue = newValue;
    }

    get elementType() {
        return this.actionCallNode && this.actionCallNode.elementType ? this.actionCallNode.elementType : undefined;
    }

    get dataTypeMappings() {
        return this.invocableActionDescriptor && this.invocableActionGenericTypesDescriptor
            ? this.actionCallNode.dataTypeMappings
            : [];
    }

    get hasConfigurationEditor() {
        return this.invocableActionDescriptor ? !!this.invocableActionDescriptor.configurationEditor : false;
    }

    get hasUnboundDataTypeMappings() {
        return (
            this.actionCallNode.dataTypeMappings &&
            this.actionCallNode.dataTypeMappings.find(
                (dataTypeMapping) =>
                    !dataTypeMapping.typeValue || !dataTypeMapping.typeValue.value || dataTypeMapping.typeValue.error
            )
        );
    }

    get hideParameters() {
        return this.isNewMode && this.hasUnboundDataTypeMappings && !this._shouldCreateConfigurationEditor();
    }

    get showTransactionControlPicker() {
        const processTypeSupportsTransactionControl = getProcessTypeTransactionControlledActionsSupport(
            this.processTypeValue
        );
        const supportsTransactionControl = this.invocableActionDescriptor
            ? this.invocableActionDescriptor.allowsTransactionControl
            : false;
        return processTypeSupportsTransactionControl && supportsTransactionControl;
    }

    fetchActionParameters() {
        if (!this.hideParameters) {
            const actionParams = {
                actionName: getValueFromHydratedItem(this.node.actionName),
                actionType: getValueFromHydratedItem(this.node.actionType)
            };
            this.displaySpinner = true;
            this.invocableActionParametersDescriptor = undefined;
            // Needed to unrender the existing configuration editor
            this.invocableActionConfigurationEditorDescriptor = undefined;
            fetchDetailsForInvocableAction(actionParams)
                .then(({ configurationEditor, genericTypes, parameters }) => {
                    if (this.connected) {
                        if (this.actionCallNode.dataTypeMappings && this.actionCallNode.dataTypeMappings.length > 0) {
                            parameters = applyDynamicTypeMappings(parameters, this.actionCallNode.dataTypeMappings);
                        }
                        this.displaySpinner = false;
                        this.invocableActionParametersDescriptor = parameters;
                        this.invocableActionConfigurationEditorDescriptor = configurationEditor;
                        this.invocableActionGenericTypesDescriptor = genericTypes;
                        this.updateDataTypeMappings();
                        const event = new CustomEvent(MERGE_WITH_PARAMETERS, {
                            detail: parameters
                        });
                        this.actionCallNode = invocableActionReducer(this.actionCallNode, event);
                    }
                })
                .catch(() => {
                    if (this.connected) {
                        this.displaySpinner = false;
                        this.cannotRetrieveParameters();
                    }
                });
        } else {
            this.displaySpinner = false;
        }
    }

    cannotRetrieveParameters() {
        if (!this.isNewMode) {
            const closePropertyEditorEvent = new ClosePropertyEditorEvent();
            this.dispatchEvent(closePropertyEditorEvent);
        } else {
            // let the parent property editor decide what to do
            const cannotRetrieveParametersEvent = new CannotRetrieveCalloutParametersEvent();
            this.dispatchEvent(cannotRetrieveParametersEvent);
        }
    }

    fetchInvocableActionDescriptor() {
        this.invocableActionDescriptor = undefined;
        const actionParams = {
            actionName: getValueFromHydratedItem(this.node.actionName),
            actionType: getValueFromHydratedItem(this.node.actionType)
        };
        const options = { disableErrorModal: true };
        const { processType: flowProcessType, triggerType: flowTriggerType } =
            Store.getStore().getCurrentState().properties;
        fetchOnce(
            SERVER_ACTION_TYPE.GET_INVOCABLE_ACTIONS,
            {
                flowProcessType,
                flowTriggerType
            },
            options
        )
            .then((invocableActions) => {
                if (this.connected) {
                    this.invocableActionDescriptor = invocableActions.find(
                        (action) => action.name === actionParams.actionName && action.type === actionParams.actionType
                    );
                    this.updatePropertyEditorTitle();
                    this.updateFlowTransactionModel();
                }
            })
            .catch(() => {
                // ignore the error : we won't use the invocableActionDescriptor in this case
            });
    }

    // used to keep track of whether this is an existing invocable action
    @api
    isNewMode = false;

    get subtitle() {
        if (!this.actionCallNode || this.invocableActionConfigurationEditorDescriptor) {
            return '';
        }
        const actionName =
            this.invocableActionDescriptor != null
                ? this.invocableActionDescriptor.label
                : getValueFromHydratedItem(this.actionCallNode.actionName);
        return format(this.labels.subtitle, actionName, ACTION_TYPE_LABEL[this.elementType]);
    }

    get parameterListConfig() {
        const inputs = this.invocableActionParametersDescriptor ? this.actionCallNode.inputParameters : [];
        const outputs = this.invocableActionParametersDescriptor ? this.actionCallNode.outputParameters : [];
        const warnings = getParameterListWarnings(inputs, outputs, this.labels);
        const storeOutputAutomatically = this.actionCallNode.storeOutputAutomatically;
        const automaticOutputHandlingSupported = isAutomaticOutputHandlingSupported(this.processTypeValue);
        const flowTransactionModel = getValueFromHydratedItem(this.actionCallNode.flowTransactionModel);
        return {
            inputHeader: this.labels.inputHeader,
            outputHeader: this.labels.outputHeader,
            emptyInputsTitle: this.labels.emptyInputsTitle,
            emptyInputsBody: this.labels.thisActionHasNoInputBody,
            sortInputs: true,
            sortOutputs: true,
            flowTransactionModel,
            inputs,
            outputs,
            warnings,
            storeOutputAutomatically,
            automaticOutputHandlingSupported,
            emptyInputsOutputsBody: this.labels.thisActionHasNoInputOutputBody,
            emptyInputsOutputsTitle: this.labels.emptyInputsOutputsTitle
        };
    }

    get showAdvancedCheckboxInAccordion() {
        const outputs = this.actionCallNode ? this.actionCallNode.outputParameters : [];
        const automaticOutputHandlingSupported = isAutomaticOutputHandlingSupported(this.processTypeValue);
        return automaticOutputHandlingSupported && !(outputs.length === 0);
    }

    get showAccordion() {
        return this.showAdvancedCheckboxInAccordion || this.showTransactionControlPicker;
    }

    /**
     * This helper method will help to determine if we need to display output paramters from parameterList component
     * in case of invocable action editor.
     *
     * @returns whether or not output parameters should be displayed
     */
    get displayOutputParams() {
        const outputs = this.actionCallNode ? this.actionCallNode.outputParameters : [];
        return !isAutomaticOutputHandlingSupported(this.processTypeValue) && !(outputs.length === 0);
    }

    /**
     * @returns the configuration editor associated with action if there is one
     * @readonly
     * @memberof InvocableActionEditor
     */
    get configurationEditor() {
        return this.invocableActionConfigurationEditorDescriptor;
    }

    _shouldCreateConfigurationEditor() {
        return useConfigurationEditor(this.configurationEditor);
    }

    /**
     * @returns list of dynamic type mappings for configuration editor
     */
    get configurationEditorTypeMappings() {
        return getActionCallTypeMappings(this.configurationEditor, this.node);
    }

    /**
     * @returns the current flow state. Shape is same as flow metadata.
     */
    get builderContext() {
        return getBuilderContext(this.configurationEditor, Store.getStore().getCurrentState());
    }

    /**
     * @returns the automatic output variables in the flow.
     */
    get automaticOutputVariables() {
        return getAutomaticOutputVariables(this.configurationEditor, Store.getStore().getCurrentState());
    }

    /**
     * @returns the information about the action element in which the configurationEditor is defined
     */
    get elementInfo() {
        return getElementInfo(this.actionCallNode?.name, 'Action');
    }

    /**
     * @returns the input variables for configuration editor
     * filter the input parameters with value from actioncall node and create a new copy
     * Dehydrate the new copy of input parameter and swap the guids with dev names
     * then convert it into desired shape
     */
    get configurationEditorInputVariables() {
        return getInputVariables(this.configurationEditor, this.actionCallNode, Store.getStore().getCurrentState());
    }

    /**
     * Return list of all input parameters defined on the CPE action
     *
     * @returns list of action call input parameters
     */
    get configurationEditorAllInputVariables() {
        if (
            this.invocableActionParametersDescriptor &&
            this.actionCallNode &&
            this._shouldCreateConfigurationEditor()
        ) {
            return this.actionCallNode.inputParameters.map(({ label, name, dataType, isRequired, maxOccurs }) => ({
                label,
                name,
                dataType,
                isRequired,
                maxOccurs
            }));
        }

        return [];
    }

    updateNodeForFieldLevelCommit() {
        const removeUnsetParamsEvent = new CustomEvent(REMOVE_UNSET_PARAMETERS);
        const actionNodeForFieldLevelCommit = invocableActionReducer(this.actionCallNode, removeUnsetParamsEvent);
        this.dispatchEvent(new UpdateNodeEvent(actionNodeForFieldLevelCommit));
    }

    /**
     * @param {object} event - property changed event coming from label-description component or parameter-item component
     */
    handlePropertyChangedEvent(event) {
        event.stopPropagation();
        const elements = Store.getStore().getCurrentState().elements;
        this.actionCallNode = invocableActionReducer(this.actionCallNode, event, elements);
        this.updateNodeForFieldLevelCommit();
    }

    updateDataTypeMappings() {
        if (this.invocableActionGenericTypesDescriptor) {
            const event = new CustomEvent(MERGE_WITH_DATA_TYPE_MAPPINGS, {
                detail: {
                    genericTypes: this.invocableActionGenericTypesDescriptor,
                    isNewMode: this.isNewMode
                }
            });
            this.actionCallNode = invocableActionReducer(this.actionCallNode, event);
        }
    }

    updatePropertyEditorTitle() {
        if (this.isNewMode || !this.actionCallNode) {
            return;
        }
        const actionName =
            this.invocableActionDescriptor != null
                ? this.invocableActionDescriptor.label
                : getValueFromHydratedItem(this.actionCallNode.actionName);
        const title = format(this.labels.editPropertyEditorTitle, actionName, ACTION_TYPE_LABEL[this.elementType]);
        const setPropertyEditorTitleEvent = new SetPropertyEditorTitleEvent(title);
        this.dispatchEvent(setPropertyEditorTitleEvent);
    }

    /**
     * Handles selection/deselection of 'Manually Assign Variables' checkbox
     *
     * @param {Object} event - event
     */
    handleManuallyAssignVariablesChanged(event) {
        event.stopPropagation();
        this.actionCallNode = invocableActionReducer(this.actionCallNode, event);
        this.updateNodeForFieldLevelCommit();
    }

    /**
     * Handles dynamic type mapping change event
     *
     * @param {Object} event - event
     */
    handleDataTypeMappingChanged(event) {
        event.stopPropagation();
        this.updateActionParamsAndTypeMappings(event);
    }

    updateActionParamsAndTypeMappings(event) {
        this.actionCallNode = invocableActionReducer(this.actionCallNode, event);
        this.updateNodeForFieldLevelCommit();
        this.updateDataTypeMappings();
        if (!this.hideParameters) {
            if (this.actionCallNode.dataTypeMappings && this.actionCallNode.dataTypeMappings.length > 0) {
                const { actionName, actionType, dataTypeMappings } = this.actionCallNode;
                this.invocableActionParametersDescriptor = getParametersForInvocableAction({
                    actionName: getValueFromHydratedItem(actionName),
                    actionType: getValueFromHydratedItem(actionType),
                    dataTypeMappings
                });
                this.actionCallNode = invocableActionReducer(
                    this.actionCallNode,
                    new CustomEvent(MERGE_WITH_PARAMETERS, {
                        detail: this.invocableActionParametersDescriptor
                    })
                );
            }
        }
    }
}
