import { Element, api, track, unwrap } from 'engine';
import { actionCallReducer } from './actioncall-reducer';
import inputs from '@label/DesignerLabels.actioncall_inputs_label';
import outputs from '@label/DesignerLabels.actioncall_outputs_label';
import { createAction } from 'builder_platform_interaction-actions';
import { PROPERTY_EDITOR_ACTION } from 'builder_platform_interaction-constant';
import { getInvocableActionParameters } from 'builder_platform_interaction-actioncall-lib';
import { ELEMENT_TYPE } from 'builder_platform_interaction-element-config';

/**
 * @constant UPDATE_PROPERTY
 * @type {string}
 */
const UPDATE_PROPERTY = 'UPDATE_PROPERTY';

const ACTIVETABID_DEFAULT = "tabitem-inputs";

export default class ActionCallEditor extends Element {
    /**
     * Internal state for the editor
     */
    @track actionCallNode = {};
    @track activetabid = ACTIVETABID_DEFAULT;

    @track inputs = [];
    @track outputs = [];

    labels = {
        inputs,
        outputs
    };

    static UPDATE_PROPERTY = UPDATE_PROPERTY;

    @api
    get node() {
        return this.actionCallNode;
    }

    @api
    set node(newValue) {
        this.actionCallNode = newValue || {};
        // init inputs, outputs
        if (this.elementType !== ELEMENT_TYPE.SUBFLOW && this.elementType !== ELEMENT_TYPE.APEX_PLUGIN_CALL) {
            getInvocableActionParameters(this.node.actionName.value, this.node.actionType.value, actionParameters => this.updateInputOutputParameters(actionParameters));
        }
    }

    /**
     * public api function to return the unwrapped node
     * @returns {object} node - unwrapped node
     */
    @api getNode() {
        return unwrap(this.node);
    }

    /**
     * public api function to run the rules from actionCall validation library
     * @returns {object} list of errors
     */
    @api validate() {
        return [];
    }

    /**
     * @returns {object} label, eg : {value: "xyz", error: null}
     */
    get label() {
        return (this.node && this.node.label) ? this.node.label : undefined;
    }

    /**
     * @returns {object} description
     */
    get description() {
        return (this.node && this.node.description) ? this.node.description : undefined;
    }

    /**
     * @returns {object} devName
     */
    get devName() {
        return (this.node && this.node.name) ? this.node.name : undefined;
    }

    get elementType() {
        return (this.node && this.node.elementType) ? this.node.elementType : undefined;
    }

    get selectedAction() {
        if (this.node.elementType === ELEMENT_TYPE.APEX_PLUGIN_CALL) {
            return {
                elementType :  this.node.elementType,
                apexClass : this.node.apexClass.value
            };
        } else if (this.node.elementType === ELEMENT_TYPE.SUBFLOW) {
            return {
                elementType :  this.node.elementType,
                flowName : this.node.flowName.value
            };
        }
        return {
            elementType :  this.node.elementType,
            actionType : this.node.actionType.value,
            actionName : this.node.actionName.value,
        };
    }

    /**
     * @param {object} event - property changed event coming from label-description component
     */
    handlePropertyChanged(event) {
        event.stopPropagation();
        const propertyName = event.propertyName;
        const value = event.value;
        const error = event.error;
        const action = createAction(PROPERTY_EDITOR_ACTION.UPDATE_ELEMENT_PROPERTY, { propertyName, value, error});
        this.actionCallNode = actionCallReducer(this.node, action);
    }

    @api
    get activeTabId() {
        return this.activetabid;
    }

    handleTabChanged(event) {
        this.activetabid = event.detail.tabId;
    }

    handleActionSelected(event) {
        const selectedAction = event.detail.value;
        if (selectedAction.elementType === ELEMENT_TYPE.APEX_PLUGIN_CALL) {
            // TODO : create an action instead and use reducer
            delete this.node.actionName;
            delete this.node.actionType;
            delete this.node.flowName;
            this.node.elementType = selectedAction.elementType;
            this.node.apexClass = {
                value : selectedAction.apexClass
            };
            // TODO : update input/output parameters
        } else if (selectedAction.elementType === ELEMENT_TYPE.SUBFLOW) {
            delete this.node.apexClass;
            delete this.node.actionName;
            delete this.node.actionType;
            this.node.elementType = selectedAction.elementType;
            this.node.flowName = {
                value : selectedAction.flowName
            };
        } else {
            // TODO : create an action instead and use reducer
            delete this.node.apexClass;
            delete this.node.flowName;
            this.node.elementType = selectedAction.elementType;
            this.node.actionType = {
                value : selectedAction.actionType
            };
            this.node.actionName = {
                value : selectedAction.actionName
            };
            getInvocableActionParameters(selectedAction.actionName, selectedAction.actionType, actionParameters => this.updateInputOutputParameters(actionParameters));
        }
    }

    updateInputOutputParameters(parameters) {
        let inputParams, outputParams;
        if (this.elementType !== ELEMENT_TYPE.SUBFLOW) {
            inputParams = parameters.filter(parameter => parameter.IsInput === true);
            outputParams = parameters.filter(parameter => parameter.IsOutput === true);
        }
        // merge with actionCallNode to get value
        if (this.node.inputParameters) {
            inputParams = this.mergeParameters(inputParams, this.node.inputParameters, 'value');
        }
        if (this.node.outputParameters) {
            outputParams = this.mergeParameters(outputParams, this.node.outputParameters, 'assignToReference');
        }
        // if there are any input parameters, assign to inputs
        if (inputParams) {
            this.inputs = inputParams;
        }
        // if there are any output parameters, assign to outputs
        if (outputParams) {
            this.outputs = outputParams;
        }
    }

    /**
     * @typedef {Object} ValueErrorObject
     * @property {String} value the value of the object
     * @property {String} error the error
     */

    /**
     * @typedef {Object} NodeParameter
     * @property {ValueErrorObject} name of the parameter
     * @property {InputParameterValue} value of the input parameter
     * @property {ValueErrorObject} assignToReference of the output parameter
     * @property {object} processMetadataValues
     */

    /**
     * @param {object} parameterInfos - array of ParameterItem (without values)
     * @param {object} nodeParameters - array of NodeParameter
     * @param {String} mergedKey - 'value' for input parameter, 'assignToReference' for output parameter
     * @return {object} an array of ParameterItem with values
     */
    mergeParameters(parameterInfos, nodeParameters, mergedKey) {
        const finalArray = [];
        parameterInfos.forEach(paramInfo => {
            // find paramInfo that has the same name as nodeParam
            const nodeParamsFound = nodeParameters.filter(nodeParam => nodeParam.name.value === paramInfo.Name);
            if (nodeParamsFound.length > 0) {
                nodeParamsFound.forEach(nodeParamFound => {
                    finalArray.push(Object.assign({}, paramInfo, {[mergedKey]: nodeParamFound[mergedKey]}));
                });
            } else {
                finalArray.push(Object.assign({}, paramInfo, {}));
            }
        });
        return finalArray;
    }

    /**
     * @param {object} event - update parameter item event coming from parameter-item component
     */
    handleUpdateParameterItem(event) {
        event.stopPropagation();
        if (!event.detail.error) {
            const value = event.detail.value;
            // TODO: should use reducer to update node
            if (event.detail.isInput) {
                this.updateParameter(this.inputs[event.detail.index], 'value', value);
            } else {
                this.updateParameter(this.outputs[event.detail.index], 'assignToReference', value);
            }
        }
        // TODO: show or hide error icon on tab
    }

    /**
     * @param {ParameterItem} param - the parameter item
     * @param {String} property - the property need to be updated
     * @param {object} value - the updated value
     */
    updateParameter(param, property, value) {
        if (!value) {
            delete param[property];
        } else {
            param[property] = value;
        }
    }
}