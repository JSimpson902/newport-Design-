import { LightningElement, api, track } from 'lwc';
import { LABELS } from "./subflowEditorLabels";
import { fetchOnce, SERVER_ACTION_TYPE } from "builder_platform_interaction/serverDataLib";
import { getValueFromHydratedItem, getErrorsFromHydratedElement } from 'builder_platform_interaction/dataMutationLib';
import { format } from 'builder_platform_interaction/commonUtils';
import { subflowReducer, MERGE_WITH_VARIABLES, REMOVE_UNSET_ASSIGNMENTS } from "./subflowReducer";
import { VALIDATE_ALL } from "builder_platform_interaction/validationRules";
import { FLOW_PROCESS_TYPE } from "builder_platform_interaction/flowMetadata";
import { getParameterListWarnings } from 'builder_platform_interaction/calloutEditorLib';
import { ClosePropertyEditorEvent, CannotRetrieveCalloutParametersEvent } from 'builder_platform_interaction/events';

export default class SubflowEditor extends LightningElement {
    @track subflowNode = {};

    @track displaySpinner = true;

    @track subflowDescriptor;

    labels = LABELS;
    connected = false

    // true if we are creating a new subflow element, false if editing an existing subflow element
    @api
    isNewMode = false;

    @api
    flowProcessType = FLOW_PROCESS_TYPE.FLOW;

    connectedCallback() {
        this.connected = true;
        if (this.subflowNode) {
            this.fetchSubflowDescriptor();
            this.fetchFlowInputOutputVariables();
        }
    }

    disconnectedCallback() {
        this.connected = false;
    }

    fetchFlowInputOutputVariables() {
        this.displaySpinner = true;
        const flowName = getValueFromHydratedItem(this.subflowNode.flowName);
        const serverActionParams = { flowName };
        const keyProvider = (params) => params.flowName;
        fetchOnce(SERVER_ACTION_TYPE.GET_FLOW_INPUT_OUTPUT_VARIABLES, serverActionParams, keyProvider).then((inputOutputVariables) => {
            if (this.connected) {
                this.displaySpinner = false;
                const event = new CustomEvent(MERGE_WITH_VARIABLES, { detail : inputOutputVariables });
                this.subflowNode = subflowReducer(this.subflowNode, event);
            }
        }).catch(() => {
            if (this.connected) {
                this.displaySpinner = false;
                this.cannotRetrieveParameters();
            }
        });
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

    fetchSubflowDescriptor() {
        this.subflowDescriptor = undefined;
        const flowName = getValueFromHydratedItem(this.subflowNode.flowName);
        const keyProvider = (params) => params.flowName;
        fetchOnce(SERVER_ACTION_TYPE.GET_SUBFLOWS, {
            flowProcessType : this.flowProcessType
        }, keyProvider).then((subflows) => {
            if (this.connected) {
                this.subflowDescriptor = subflows.find(f => f.fullName === flowName);
            }
        }).catch(() => {
            // ignore the error : we won't use the subflowDescriptor in this case
        });
    }

    @api
    get node() {
        return this.subflowNode;
    }

    set node(newValue) {
        this.subflowNode = newValue || {};
        if (this.connected) {
            this.fetchSubflowDescriptor();
            this.fetchFlowInputOutputVariables();
        }
    }

    /**
     * public api function to return the node
     * @returns {object} node - node
     */
    @api getNode() {
        const event = new CustomEvent(REMOVE_UNSET_ASSIGNMENTS);
        return subflowReducer(this.subflowNode, event);
    }

    /**
     * public api function to run the rules from actionCall validation library
     * @returns {Object[]} list of errors
     */
    @api validate() {
        const event = new CustomEvent(VALIDATE_ALL);
        this.subflowNode = subflowReducer(this.subflowNode, event);
        return getErrorsFromHydratedElement(this.subflowNode);
    }

    get elementType() {
        return (this.subflowNode && this.subflowNode.elementType) ? this.subflowNode.elementType : undefined;
    }

    get subtitle() {
        if (this.subflowDescriptor == null) {
            return '';
        }
        return format(this.labels.subtitle, getValueFromHydratedItem(this.subflowDescriptor.masterLabel));
    }

    get parameterListConfig() {
        return {
            inputTabHeader: this.labels.inputTabHeader,
            outputTabHeader: this.labels.outputTabHeader,
            emptyInputsMessage: this.labels.emptyInputs,
            emptyOutputsMessage: this.labels.emptyOutputs,
            inputsNeedToBeSorted: true,
            outputsNeedToBeSorted: true,
            inputs: this.subflowNode.inputAssignments,
            outputs: this.subflowNode.outputAssignments,
            warnings: getParameterListWarnings(this.subflowNode.inputAssignments, this.subflowNode.outputAssignments, this.labels)
        };
    }

    /**
     * @param {object} event - property changed event coming from label-description component and parameter-item component
     */
    handleEvent(event) {
        event.stopPropagation();
        this.subflowNode = subflowReducer(this.subflowNode, event);
    }
}