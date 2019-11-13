import { getElementByDevName } from 'builder_platform_interaction/storeUtils';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import {
    FLOW_DATA_TYPE,
    isComplexType
} from 'builder_platform_interaction/dataTypeLib';
import * as sobjectLib from 'builder_platform_interaction/sobjectLib';
import {
    GLOBAL_CONSTANT_PREFIX,
    SYSTEM_VARIABLE_PREFIX,
    SYSTEM_VARIABLE_CLIENT_PREFIX,
    getGlobalConstantOrSystemVariable
} from 'builder_platform_interaction/systemLib';
import { splitStringBySeparator } from 'builder_platform_interaction/commonUtils';
import {
    isElementAllowed,
    getScreenElement
} from 'builder_platform_interaction/expressionUtils';
import {
    elementToParam,
    getDataType
} from 'builder_platform_interaction/ruleLib';
import {
    getPropertiesForClass,
    getApexClasses,
    getApexPropertyWithName
} from 'builder_platform_interaction/apexTypeLib';
import { getCachedExtension } from 'builder_platform_interaction/flowExtensionLib';
import { getExtensionParamDescriptionAsComplexTypeFieldDescription } from 'builder_platform_interaction/complexTypeLib';
import * as validationErrors from './mergeFieldValidationErrors';
import {
    getEntityFieldWithRelationshipName,
    getPolymorphicRelationShipName,
    getReferenceToName
} from './mergeField';

const MERGE_FIELD_START_CHARS = '{!';
const MERGE_FIELD_END_CHARS = '}';

const MERGEFIELD_REGEX = /\{!(\$\w+\.\w+|\w+(\.[A-Za-z0-9_:]+)*|\$Record)\}/g;

const MAXIMUM_NUMBER_OF_LEVELS = 10;

/**
 * Validate merge fields.
 *
 * Validation is best-effort only : no false negatives but there can be false positives. This is because some validations
 * are not yet supported and because validateMergeField is synchronous which means data (field descriptions ...) must
 * already have been retrieved from server for validation.
 *
 */
export class MergeFieldsValidation {
    allowGlobalConstants = true;
    allowCollectionVariables = false;

    // The allowed param types for merge field based on rule service.
    // If present, this is used to validate the element merge field.
    allowedParamTypes = null;

    /**
     * @typedef {Object} ValidationError
     *
     * @property {String} errorType the error type
     * @property {String} message the validation error message
     * @property {Number} startIndex start index in the text where the error occurred
     * @property {Number} endIndex end index in the text where the error occurred
     */

    /**
     * Validate a merge field
     *
     * @param {string}
     *            mergeField the merge field (ex : {!variable1.Name})
     * @returns {ValidationError[]} The validation errors
     */
    validateMergeField(mergeField) {
        try {
            const match = MERGEFIELD_REGEX.exec(mergeField);
            if (match === null || match[0] !== mergeField) {
                return [
                    validationErrors.invalidMergeField(
                        mergeField,
                        0,
                        mergeField.length - 1
                    )
                ];
            }
            return this._validateMergeFieldReferenceValue(match[1], 2);
        } finally {
            MERGEFIELD_REGEX.lastIndex = 0;
        }
    }

    /**
     * Checks if input text is text with merge field(s).
     * ex: {!variable1.Name} - false
     *     test input - false
     *     Hi {!variable1.Name} - true
     * @param {string} text
     *          input text
     * @return {boolean} true if input is text with merge field
     */
    static isTextWithMergeFields(text) {
        if (typeof text !== 'string') {
            return false;
        }

        try {
            const match = MERGEFIELD_REGEX.exec(text);
            return match !== null && match[0] !== text;
        } finally {
            MERGEFIELD_REGEX.lastIndex = 0;
        }
    }

    _getReferenceValue(mergeFieldReference) {
        return mergeFieldReference.substring(
            MERGE_FIELD_START_CHARS.length,
            mergeFieldReference.length - MERGE_FIELD_END_CHARS.length
        );
    }

    _isGlobalConstantMergeField(mergeFieldReferenceValue) {
        return mergeFieldReferenceValue.startsWith(GLOBAL_CONSTANT_PREFIX);
    }

    _isSystemVariableMergeField(mergeFieldReferenceValue) {
        return mergeFieldReferenceValue.startsWith(
            SYSTEM_VARIABLE_PREFIX + '.'
        );
    }

    _isSystemVariableClientMergeField(mergeFieldReferenceValue) {
        return mergeFieldReferenceValue.startsWith(
            SYSTEM_VARIABLE_CLIENT_PREFIX + '.'
        );
    }

    _isSystemVariableRecordMergeField(mergeFieldReferenceValue) {
        return /^\$Record/i.test(mergeFieldReferenceValue);
    }

    _isGlobalVariableMergeField(mergeFieldReferenceValue) {
        return (
            mergeFieldReferenceValue.startsWith('$') &&
            !this._isGlobalConstantMergeField(mergeFieldReferenceValue) &&
            !this._isSystemVariableMergeField(mergeFieldReferenceValue) &&
            !this._isSystemVariableClientMergeField(mergeFieldReferenceValue) &&
            !this._isSystemVariableRecordMergeField(mergeFieldReferenceValue)
        );
    }

    _validateMergeFieldReferenceValue(mergeFieldReferenceValue, index) {
        if (this._isGlobalConstantMergeField(mergeFieldReferenceValue)) {
            return this._validateGlobalConstant(
                mergeFieldReferenceValue,
                index
            );
        }
        if (this._isGlobalVariableMergeField(mergeFieldReferenceValue)) {
            return this._validateGlobalVariable(
                mergeFieldReferenceValue,
                index
            );
        }
        if (this._isSystemVariableMergeField(mergeFieldReferenceValue)) {
            return this._validateSystemVariable(
                mergeFieldReferenceValue,
                index
            );
        }
        if (this._isSystemVariableClientMergeField(mergeFieldReferenceValue)) {
            return this._validateSystemVariable(
                mergeFieldReferenceValue,
                index
            );
        }
        if (mergeFieldReferenceValue.indexOf('.') !== -1) {
            return this._validateComplexTypeFieldMergeField(
                mergeFieldReferenceValue,
                index
            );
        }
        return this._validateElementMergeField(mergeFieldReferenceValue, index);
    }

    _validateGlobalConstant(mergeFieldReferenceValue, index) {
        const endIndex = index + mergeFieldReferenceValue.length - 1;
        const globalConstant = getGlobalConstantOrSystemVariable(
            mergeFieldReferenceValue
        );
        if (!this.allowGlobalConstants) {
            return [
                validationErrors.globalConstantsNotAllowed(index, endIndex)
            ];
        }
        if (!globalConstant) {
            return [
                validationErrors.invalidGlobalConstant(
                    MERGE_FIELD_START_CHARS +
                        mergeFieldReferenceValue +
                        MERGE_FIELD_END_CHARS,
                    index,
                    endIndex
                )
            ];
        }
        if (!this._isElementValidForAllowedParamTypes(globalConstant)) {
            return [validationErrors.invalidDataType(index, endIndex)];
        }
        return [];
    }

    _validateSystemVariable(mergeFieldReferenceValue, index) {
        const endIndex = index + mergeFieldReferenceValue.length - 1;
        const systemVariable = getGlobalConstantOrSystemVariable(
            mergeFieldReferenceValue
        );
        if (!systemVariable) {
            return [
                validationErrors.invalidGlobalVariable(
                    MERGE_FIELD_START_CHARS +
                        mergeFieldReferenceValue +
                        MERGE_FIELD_END_CHARS,
                    index,
                    endIndex
                )
            ];
        }
        if (!this._isElementValidForAllowedParamTypes(systemVariable)) {
            return [validationErrors.invalidDataType(index, endIndex)];
        }
        return [];
    }

    _validateGlobalVariable() {
        // TODO : validate global variables
        return [];
    }

    _isElementValidForAllowedParamTypes(element) {
        if (!this.allowedParamTypes) {
            return true;
        }
        return isElementAllowed(
            this.allowedParamTypes,
            elementToParam(element)
        );
    }

    _validateElementMergeField(mergeFieldReferenceValue, index) {
        const endIndex = index + mergeFieldReferenceValue.length - 1;
        // fetch element from store using the devName
        // if element is not present in store get element from screen variable as it may have been
        // just created and not yet committed to store (user hasn't pressed 'Done' yet)
        const element =
            getElementByDevName(mergeFieldReferenceValue) ||
            this._getUncommittedElement(mergeFieldReferenceValue);

        if (!element) {
            return [
                validationErrors.unknownResource(
                    mergeFieldReferenceValue,
                    index,
                    endIndex
                )
            ];
        }

        if (this.allowedParamTypes) {
            if (!this._isElementValidForAllowedParamTypes(element)) {
                return [validationErrors.invalidDataType(index, endIndex)];
            }
        } else {
            const elementType = this._getElementType(element);
            if (
                elementType.dataType === null ||
                (!this.allowCollectionVariables && elementType.isCollection)
            ) {
                return [
                    validationErrors.resourceCannotBeUsedAsMergeField(
                        mergeFieldReferenceValue,
                        index,
                        endIndex
                    )
                ];
            }
        }
        return [];
    }

    _getUncommittedElement(referenceValue) {
        const screen = getScreenElement();
        if (screen && screen.fields) {
            return screen.fields.find(field => {
                return field.name.value === referenceValue;
            });
        }
        return null;
    }

    _getElementType(element) {
        let dataType = getDataType(element) || null;
        const isCollection = element.isCollection || false;
        const subtype = element.subtype;
        if (element.elementType === ELEMENT_TYPE.STAGE) {
            dataType = FLOW_DATA_TYPE.STRING.value;
        }
        return {
            dataType,
            isCollection,
            subtype
        };
    }

    _validateApexMergeField(apexClassName, fieldNames, index, endIndex) {
        const [fieldName, ...remainingFieldNames] = fieldNames;
        if (getApexClasses() === null) {
            // apex classes not yet set
            return {
                field: undefined // we don't know if it is valid or not
            };
        }
        const properties = getPropertiesForClass(apexClassName);
        const property =
            properties && getApexPropertyWithName(properties, fieldName);
        if (!property) {
            return {
                error: validationErrors.unknownRecordField(
                    apexClassName,
                    fieldName,
                    index,
                    endIndex
                )
            };
        }
        if (remainingFieldNames.length > 0) {
            if (property.dataType === FLOW_DATA_TYPE.APEX.value) {
                return this._validateApexMergeField(
                    property.subtype,
                    remainingFieldNames,
                    index,
                    endIndex
                );
            } else if (property.dataType === FLOW_DATA_TYPE.SOBJECT.value) {
                return this._validateSObjectMergeField(
                    property.subtype,
                    remainingFieldNames,
                    index,
                    endIndex
                );
            }
            return {
                error: validationErrors.unknownRecordField(
                    apexClassName,
                    fieldName,
                    index,
                    endIndex
                )
            };
        }
        return { field: property };
    }

    _validateSObjectMergeField(entityName, fieldNames, index, endIndex) {
        const [fieldName, ...remainingFieldNames] = fieldNames;
        let field;
        const fields = sobjectLib.getFieldsForEntity(entityName);
        if (!fields) {
            // entity not cached or no entity with this name ...
            return {
                field: undefined // we don't know if it is valid or not
            };
        }
        if (remainingFieldNames.length > 0) {
            const {
                relationshipName,
                specificEntityName
            } = getPolymorphicRelationShipName(fieldName);
            field = getEntityFieldWithRelationshipName(
                fields,
                relationshipName
            );
            if (!field) {
                return {
                    error: validationErrors.unknownRecordField(
                        entityName,
                        relationshipName,
                        index,
                        endIndex
                    )
                };
            }
            const referenceToName = getReferenceToName(
                field,
                relationshipName,
                specificEntityName
            );
            if (!referenceToName) {
                return {
                    error: validationErrors.invalidPolymorphicRecordFieldReference(
                        entityName,
                        fieldName,
                        index,
                        endIndex
                    )
                };
            }
            return this._validateSObjectMergeField(
                referenceToName,
                remainingFieldNames,
                index,
                endIndex
            );
        }
        field = sobjectLib.getEntityFieldWithApiName(fields, fieldName);
        if (!field) {
            return {
                error: validationErrors.unknownRecordField(
                    entityName,
                    fieldName,
                    index,
                    endIndex
                )
            };
        }
        return { field };
    }

    _validateComplexTypeFieldMergeField(mergeFieldReferenceValue, index) {
        const endIndex = index + mergeFieldReferenceValue.length - 1;
        const parts = splitStringBySeparator(mergeFieldReferenceValue);
        const [elementName, ...fieldNames] = parts;
        if (fieldNames.length >= MAXIMUM_NUMBER_OF_LEVELS) {
            return [
                validationErrors.maximumNumberOfLevelsReached(index, endIndex)
            ];
        }
        const element =
            getElementByDevName(elementName) ||
            this._getUncommittedElement(elementName);

        if (!element) {
            return [
                validationErrors.unknownResource(elementName, index, endIndex)
            ];
        }
        if (!element.dataType) {
            return [
                validationErrors.invalidMergeField(
                    MERGE_FIELD_START_CHARS +
                        mergeFieldReferenceValue +
                        MERGE_FIELD_END_CHARS,
                    index,
                    endIndex
                )
            ];
        }
        if (
            !isComplexType(element.dataType) ||
            (!this.allowCollectionVariables && element.isCollection)
        ) {
            return [
                validationErrors.resourceCannotBeUsedAsMergeField(
                    mergeFieldReferenceValue,
                    index,
                    endIndex
                )
            ];
        }
        let field;
        if (element.dataType === FLOW_DATA_TYPE.SOBJECT.value) {
            const {
                field: sobjectField,
                error
            } = this._validateSObjectMergeField(
                element.subtype,
                fieldNames,
                index,
                endIndex
            );
            if (error) {
                return [error];
            }
            field = sobjectField;
        } else if (element.dataType === FLOW_DATA_TYPE.APEX.value) {
            const { field: apexField, error } = this._validateApexMergeField(
                element.subtype,
                fieldNames,
                index,
                endIndex
            );
            if (error) {
                return [error];
            }
            field = apexField;
        } else if (
            element.dataType === FLOW_DATA_TYPE.LIGHTNING_COMPONENT_OUTPUT.value
        ) {
            const fieldName = fieldNames.join('.');
            // this lib is synchronous, we check the field only if already cached.
            const extension = getCachedExtension(
                element.extensionName,
                element.dynamicTypeMappings
            );
            if (extension) {
                field = this._getOutputParameterForExtension(
                    extension,
                    fieldName
                );
                if (!field) {
                    return [
                        validationErrors.unknownRecordField(
                            element.extensionName,
                            fieldName,
                            index,
                            endIndex
                        )
                    ];
                }
            }
        }
        if (field && !this._isElementValidForAllowedParamTypes(field)) {
            return [validationErrors.invalidDataType(index, endIndex)];
        }
        return [];
    }

    _getOutputParameterForExtension(extension, parameterName) {
        parameterName = parameterName.toLowerCase();
        const outputParam = extension.outputParameters.find(
            param => parameterName === param.apiName.toLowerCase()
        );
        return (
            outputParam &&
            getExtensionParamDescriptionAsComplexTypeFieldDescription(
                outputParam
            )
        );
    }
}

/**
 * Validate text with merge fields
 *
 * @param {string}
 *            textWithMergeFields text with merge fields (ex :
 *            '{!variable1.Name} == {!variable2.Name}')
 * @returns {ValidationError[]} The validation errors
 */
export function validateTextWithMergeFields(
    textWithMergeFields,
    { allowGlobalConstants = true, allowCollectionVariables = false } = {}
) {
    const validation = new MergeFieldsValidation();
    validation.allowGlobalConstants = allowGlobalConstants;
    validation.allowCollectionVariables = allowCollectionVariables;

    const results = [];
    let match;
    try {
        while ((match = MERGEFIELD_REGEX.exec(textWithMergeFields)) !== null) {
            results.push(
                validation._validateMergeFieldReferenceValue(
                    match[1],
                    match.index + 2
                )
            );
        }
        return [].concat.apply([], results);
    } finally {
        MERGEFIELD_REGEX.lastIndex = 0;
    }
}

export function validateMergeField(
    mergeField,
    {
        allowGlobalConstants = true,
        allowedParamTypes = null,
        allowCollectionVariables = false
    } = {}
) {
    const validation = new MergeFieldsValidation();
    validation.allowGlobalConstants = allowGlobalConstants;
    validation.allowedParamTypes = allowedParamTypes;
    validation.allowCollectionVariables = allowCollectionVariables;
    return validation.validateMergeField(mergeField);
}

export function isTextWithMergeFields(text) {
    return MergeFieldsValidation.isTextWithMergeFields(text);
}
