import { LightningElement, api, track } from 'lwc';
import { CONDITION_LOGIC } from 'builder_platform_interaction/flowMetadata';
import { UpdateCollectionProcessorEvent, PropertyChangedEvent } from 'builder_platform_interaction/events';
import { filterReducer } from './filterReducer';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { getElementByDevName } from 'builder_platform_interaction/storeUtils';
import { getVariableOrField } from 'builder_platform_interaction/referenceToVariableUtil';
import { getErrorsFromHydratedElement } from 'builder_platform_interaction/dataMutationLib';

import { LABELS } from './filterEditorLabels';
import { Store } from 'builder_platform_interaction/storeLib';
import { SObjectOrApexReference } from 'builder_platform_interaction/sortEditorLib';
import { VALIDATE_ALL } from 'builder_platform_interaction/validationRules';
import {
    SORTABLE_FILTER,
    DEFAULT_CURRENT_ITEM_VARIABLE_PREFIX,
    ASSIGN_NEXT_VALUE_TO_REFERENCE,
    generateVariable,
    getVariable,
    getNodeName,
    deleteOrRestoreVariable,
    updateVariable
} from 'builder_platform_interaction/collectionProcessorLib';
import { getUniqueDuplicateElementName } from 'builder_platform_interaction/storeUtils';

const SUBTYPE = 'subtype';
const DATA_TYPE = 'dataType';

export default class FilterEditor extends LightningElement {
    @track
    filterElement = {
        collectionReference: { value: '', error: null },
        assignNextValueToReference: { value: '', error: null },
        conditions: [],
        conditionLogic: { value: CONDITION_LOGIC.AND, error: null },
        formula: { value: '', error: null }
    };

    @track
    sObjectOrApexReference: SObjectOrApexReference = { value: null };

    @track
    inputCollectionType = {
        subtype: null,
        dataType: null
    };

    @track
    showFilter = false;

    @track
    currentItemVariable;

    @track
    collectionReferenceDisplayText = '';

    @track
    shouldRestoreVariable = true;

    @track
    shouldDeleteVariable = false;

    @api
    get elementInfo() {
        return this.filterElement;
    }

    set elementInfo(element) {
        if (element) {
            this.filterElement = element;
        }
        if (this.filterElement.collectionReference.value) {
            this.collectionVariable = getVariableOrField(
                this.filterElement.collectionReference.value,
                Store.getStore().getCurrentState().elements
            );
            this.showFilter = this.collectionVariable !== null;
            this.setInputCollectionType();
            this.setSObjectOrApexReference(this.collectionVariable);
        }

        if (this.filterElement.assignNextValueToReference.value) {
            this.currentItemVariable = getVariable(this.filterElement.assignNextValueToReference.value);
        }
    }

    @api
    get inputVariables() {
        return this._inputVariables;
    }

    /**
     * Set the input variables from parent editor (collectionProcessorEditor)
     *
     */
    set inputVariables(value) {
        if (value) {
            this._inputVariables = value;
        }
    }

    /**
     * public api function to run the rules from decision validation library
     *
     * @returns {object} list of errors
     */
    @api validate() {
        const event = { type: VALIDATE_ALL };
        this.filterElement = filterReducer(this.filterElement, event);
        const error = getErrorsFromHydratedElement(this.filterElement);
        this.shouldRestoreVariable = !!error.length;
        if (!error.length) {
            const nodeName = getNodeName(this.inputVariables);

            if (nodeName) {
                const varName = DEFAULT_CURRENT_ITEM_VARIABLE_PREFIX + nodeName;
                if (this.currentItemVariable !== varName) {
                    this.updateCurrentItemVariable('name', getUniqueDuplicateElementName(varName));
                }
            }
        }
        return error;
    }

    get labels() {
        return LABELS;
    }

    // input collection filter is the same as in sort editor: sObject, primitive, and apex type
    get collectionProcessorFilter() {
        return SORTABLE_FILTER;
    }

    connectedCallback() {
        this.createCurrentItemVariableAndUpdateFilterElemement();
    }

    disconnectedCallback() {
        // if the curent item variable was created when open the editor -> delete it
        // if curent item variable was updated -> restore to its original value
        deleteOrRestoreVariable(
            this.currentItemVariable,
            this.originalVariable,
            this.shouldRestoreVariable,
            this.shouldDeleteVariable
        );
    }

    /**
     * Create the current item variable
     *
     */
    createCurrentItemVariableAndUpdateFilterElemement() {
        if (!this.currentItemVariable) {
            this.currentItemVariable = generateVariable(FLOW_DATA_TYPE.SOBJECT.value, this.inputCollectionType.subtype);
            const event = new PropertyChangedEvent(ASSIGN_NEXT_VALUE_TO_REFERENCE, this.currentItemVariable, null);
            this.updateFilterElement(event);
            this.shouldDeleteVariable = true;
        } else if (!this.originalVariable) {
            this.originalVariable = getElementByDevName(this.currentItemVariable);
        }
    }

    setInputCollectionType() {
        if (this.collectionVariable) {
            this.inputCollectionType = this.collectionVariable;
        }
    }

    setSObjectOrApexReference(collectionVariable) {
        if (!collectionVariable) {
            return;
        }
        const isSObject = collectionVariable.dataType === FLOW_DATA_TYPE.SOBJECT.value;
        const isApexClass = collectionVariable.dataType === FLOW_DATA_TYPE.APEX.value;
        this.sObjectOrApexReference = { value: collectionVariable.subtype, isSObject, isApexClass };
        if (!isSObject && !isApexClass) {
            this.collectionReferenceDisplayText = collectionVariable.name || collectionVariable.apiName;
        }
    }

    /**
     * Update input object type
     *
     * @param collectionReferenceValue  the selected input collection
     */
    updateInputCollectionType(collectionReferenceValue: string | null) {
        if (collectionReferenceValue) {
            this.collectionVariable = getVariableOrField(
                collectionReferenceValue,
                Store.getStore().getCurrentState().elements
            );

            if (this.collectionVariable) {
                // primitive doesn't have subtype
                const newInputSubtype = this.collectionVariable.subtype;
                const newInputDataType = this.collectionVariable.dataType;

                if (this.inputCollectionType.dataType !== newInputDataType) {
                    this.updateCurrentItemVariable(DATA_TYPE, newInputDataType);
                }

                if (this.inputCollectionType.subtype !== newInputSubtype) {
                    this.updateCurrentItemVariable(SUBTYPE, newInputSubtype);
                }
            }
            this.setSObjectOrApexReference(this.collectionVariable);
        } else {
            this.inputCollectionType = { subtype: null, dataType: null };
        }
    }

    /**
     * Update filter element state
     * dispatch UpdateCollectionProcessorEvent to the parent collection processor editor
     *
     * @param event  the custome event
     */
    updateFilterElement(event: CustomEvent) {
        this.filterElement = filterReducer(this.filterElement, event);
        this.dispatchEvent(new UpdateCollectionProcessorEvent(this.filterElement));
    }

    /**
     * Update current item variable (subtype, name)
     *
     * @param property variable property
     * @param value new value
     */
    updateCurrentItemVariable(property, value) {
        const updated = updateVariable(this.currentItemVariable, property, value);
        if (updated && property === 'name') {
            this.currentItemVariable = value;
            const event = new PropertyChangedEvent(ASSIGN_NEXT_VALUE_TO_REFERENCE, this.currentItemVariable, null);
            this.updateFilterElement(event);
        }
    }

    // on input collection property change
    // update input collection type, collection reference, and entity fields
    handleCollectionVariablePropertyChange(event: CustomEvent) {
        event.stopPropagation();
        this.filterElement = filterReducer(this.filterElement, event);
        this.showFilter = this.filterElement.collectionReference.value !== null;
        this.updateInputCollectionType(this.filterElement.collectionReference.value);
        this.dispatchEvent(new UpdateCollectionProcessorEvent(this.filterElement));
    }

    handleFilterConditionChange(event: CustomEvent) {
        event.stopPropagation();
        this.updateFilterElement(event);
    }
}
