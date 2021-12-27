// @ts-nocheck
import {
    getParameterListWarnings,
    MERGE_WITH_PARAMETERS,
    REMOVE_UNSET_PARAMETERS
} from 'builder_platform_interaction/calloutEditorLib';
import { getErrorsFromHydratedElement, getValueFromHydratedItem } from 'builder_platform_interaction/dataMutationLib';
import {
    CannotRetrieveCalloutParametersEvent,
    ClosePropertyEditorEvent,
    SetPropertyEditorTitleEvent,
    UpdateNodeEvent
} from 'builder_platform_interaction/events';
import { fetchOnce, SERVER_ACTION_TYPE } from 'builder_platform_interaction/serverDataLib';
import { commonUtils } from 'builder_platform_interaction/sharedUtils';
import { VALIDATE_ALL } from 'builder_platform_interaction/validationRules';
import { api, LightningElement, track } from 'lwc';
import { LABELS } from './apexPluginEditorLabels';
import { apexPluginReducer } from './apexPluginReducer';
const { format } = commonUtils;
export default class ApexPluginEditor extends LightningElement {
    /**
     * Internal state for the editor
     */
    @track apexPluginNode = {};

    @track displaySpinner = true;
    @track apexPluginDescriptor;
    @track apexPluginParametersDescriptor;

    labels = LABELS;
    connected = false;

    connectedCallback() {
        this.connected = true;
        this.updatePropertyEditorTitle();
        if (this.node) {
            this.fetchApexPluginDescriptor();
            this.fetchApexPluginParameters();
        }
    }

    disconnectedCallback() {
        this.connected = false;
    }

    @api
    editorParams;

    @api
    get node() {
        return this.apexPluginNode;
    }

    set node(newValue) {
        this.apexPluginNode = newValue || {};
        if (this.connected) {
            this.fetchApexPluginDescriptor();
            this.fetchApexPluginParameters();
        }
    }

    /**
     * public api function to return the node
     *
     * @returns {object} node - node
     */
    @api getNode() {
        const event = new CustomEvent(REMOVE_UNSET_PARAMETERS);
        return apexPluginReducer(this.apexPluginNode, event);
    }

    /**
     * public api function to run the rules from apex plugin validation library
     *
     * @returns {Object[]} list of errors
     */
    @api validate() {
        const event = { type: VALIDATE_ALL };
        this.apexPluginNode = apexPluginReducer(this.apexPluginNode, event);
        return getErrorsFromHydratedElement(this.apexPluginNode);
    }

    get elementType() {
        return this.apexPluginNode && this.apexPluginNode.elementType ? this.apexPluginNode.elementType : undefined;
    }

    // used to keep track of whether this is an existing apex plugin
    @api
    isNewMode = false;

    get subtitle() {
        if (!this.apexPluginNode) {
            return '';
        }
        const name =
            this.apexPluginDescriptor != null
                ? this.apexPluginDescriptor.name
                : getValueFromHydratedItem(this.apexPluginNode.apexClass);
        return format(this.labels.subtitle, name, this.labels.apexPluginTypeLabel);
    }

    get parameterListConfig() {
        const inputs = this.apexPluginParametersDescriptor ? this.apexPluginNode.inputParameters : [];
        const outputs = this.apexPluginParametersDescriptor ? this.apexPluginNode.outputParameters : [];
        const warnings = getParameterListWarnings(inputs, outputs, this.labels);
        return {
            inputHeader: this.labels.inputHeader,
            outputHeader: this.labels.outputHeader,
            emptyInputsTitle: this.labels.emptyInputsTitle,
            emptyInputsBody: this.labels.thisActionHasNoInputBody,
            sortInputs: true,
            sortOutputs: true,
            inputs,
            outputs,
            warnings,
            storeOutputAutomatically: false, // automatic output handling are not supported for apex plugin
            automaticOutputHandlingSupported: false, // automatic output handling are not supported for apex plugin
            emptyInputsOutputsBody: this.labels.thisActionHasNoInputOutputBody,
            emptyInputsOutputsTitle: this.labels.emptyInputsOutputsTitle
        };
    }

    fetchApexPluginDescriptor() {
        this.apexPluginDescriptor = undefined;
        const options = { disableErrorModal: true };
        fetchOnce(SERVER_ACTION_TYPE.GET_APEX_PLUGINS, {}, undefined, options)
            .then((apexPlugins) => {
                if (this.connected) {
                    this.apexPluginDescriptor = apexPlugins.find(
                        (apexPlugin) => apexPlugin.apexClass === getValueFromHydratedItem(this.apexPluginNode.apexClass)
                    );
                    this.updatePropertyEditorTitle();
                }
            })
            .catch(() => {
                // ignore the error : we won't use the apexPluginDescriptor in this case
            });
    }

    fetchApexPluginParameters() {
        this.apexPluginParametersDescriptor = undefined;
        const apexParams = {
            apexClass: getValueFromHydratedItem(this.apexPluginNode.apexClass)
        };
        this.displaySpinner = true;
        fetchOnce(SERVER_ACTION_TYPE.GET_APEX_PLUGIN_PARAMETERS, apexParams)
            .then((parameters) => {
                if (this.connected) {
                    this.displaySpinner = false;
                    this.apexPluginParametersDescriptor = parameters;
                    const event = new CustomEvent(MERGE_WITH_PARAMETERS, {
                        detail: parameters
                    });
                    this.apexPluginNode = apexPluginReducer(this.apexPluginNode, event);
                }
            })
            .catch(() => {
                if (this.connected) {
                    this.displaySpniner = false;
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

    updateNodeForFieldLevelCommit() {
        const removeUnsetParamsEvent = new CustomEvent(REMOVE_UNSET_PARAMETERS);
        const apexPluginNodeForFieldLevelCommit = apexPluginReducer(this.apexPluginNode, removeUnsetParamsEvent);
        this.dispatchEvent(new UpdateNodeEvent(apexPluginNodeForFieldLevelCommit));
    }

    /**
     * @param {object} event - property changed event coming from label-description and parameter-item component
     */
    handlePropertyChangedEvent(event) {
        event.stopPropagation();
        this.apexPluginNode = apexPluginReducer(this.apexPluginNode, event);
        this.updateNodeForFieldLevelCommit();
    }

    updatePropertyEditorTitle() {
        if (this.isNewMode || !this.apexPluginNode) {
            return;
        }
        const name =
            this.apexPluginDescriptor != null
                ? this.apexPluginDescriptor.name
                : getValueFromHydratedItem(this.apexPluginNode.apexClass);
        const title = format(this.labels.editPropertyEditorTitle, name);
        const setPropertyEditorTitleEvent = new SetPropertyEditorTitleEvent(title);
        this.dispatchEvent(setPropertyEditorTitleEvent);
    }
}
