import { getResourceByUniqueIdentifier } from 'builder_platform_interaction/expressionUtils';
import { sanitizeGuid } from 'builder_platform_interaction/dataMutationLib';
import {
    getPropertiesForClass,
    getApexPropertyWithName
} from 'builder_platform_interaction/apexTypeLib';
import { describeExtension } from 'builder_platform_interaction/flowExtensionLib';
import { getExtensionParamDescriptionAsComplexTypeFieldDescription } from 'builder_platform_interaction/complexTypeLib';
import {
    isComplexType,
    FLOW_DATA_TYPE
} from 'builder_platform_interaction/dataTypeLib';
import {
    fetchFieldsForEntity,
    getEntityFieldWithApiName
} from 'builder_platform_interaction/sobjectLib';
import { isLookupTraversalSupported as isLookupTraversalSupportedByProcessType } from 'builder_platform_interaction/processTypeLib';
import { isLookupTraversalSupported as isLookupTraversalSupportedByTriggerType } from 'builder_platform_interaction/triggerTypeLib';

/**
 * Whether or not lookup traversal is supported in this flow
 * @param {String} processType the current process type
 * @param {String} triggerType the current trigger type
 * @returns {Boolean} true if lookup traversal is supported, false otherwise
 */
export const isLookupTraversalSupported = (processType, triggerType) => {
    return (
        isLookupTraversalSupportedByProcessType(processType) &&
        isLookupTraversalSupportedByTriggerType(triggerType)
    );
};

/**
 * Resolve the reference given its identifier.
 * The identifier can be a resource/element guid ('a4451815-988d-4f17-883d-64b6ad9fab7e'), a global constant identifier ('$GlobalConstant.EmptyString'), a system variable identifier or
 * a field reference identifier ('a4451815-988d-4f17-883d-64b6ad9fab7e.Account.User.Name')
 *
 * @returns {Promise<Object[]|undefined>} Array with first item being the element (resource/global constant ...) and next items being the fields. Returns undefined if not a valid reference
 */
export function resolveReferenceFromIdentifier(identifier) {
    const elementOrResource = getResourceByUniqueIdentifier(identifier);
    if (!elementOrResource) {
        return Promise.resolve();
    }
    if (isComplexType(elementOrResource.dataType)) {
        const { fieldNames } = sanitizeGuid(identifier);
        return resolveComplexTypeReference(elementOrResource, fieldNames);
    }
    return Promise.resolve([elementOrResource]);
}

function resolveComplexTypeReference(flowResource, fieldNames) {
    if (!fieldNames || fieldNames.length === 0) {
        return Promise.resolve([flowResource]);
    }
    if (flowResource.dataType === FLOW_DATA_TYPE.SOBJECT.value) {
        return resolveEntityFieldReference(
            flowResource.subtype,
            fieldNames
        ).then(fields => {
            return fields ? [flowResource, ...fields] : undefined;
        });
    } else if (flowResource.dataType === FLOW_DATA_TYPE.APEX.value) {
        return resolveApexPropertyReference(
            flowResource.subtype,
            fieldNames
        ).then(fields => {
            return fields ? [flowResource, ...fields] : undefined;
        });
    } else if (
        flowResource.dataType ===
        FLOW_DATA_TYPE.LIGHTNING_COMPONENT_OUTPUT.value
    ) {
        return resolveLightningComponentOutputReference(
            flowResource.extensionName,
            fieldNames
        ).then(fields => {
            return fields ? [flowResource, ...fields] : undefined;
        });
    }
    return Promise.resolve(undefined);
}

function resolveApexPropertyReference(clazz, fieldNames) {
    if (fieldNames.length === 0) {
        return Promise.resolve([]);
    }
    const [fieldName, ...remainingFieldNames] = fieldNames;
    return Promise.resolve(getPropertiesForClass(clazz)).then(properties => {
        const property = getApexPropertyWithName(properties, fieldName);
        if (!property) {
            return undefined;
        }
        if (remainingFieldNames.length > 0) {
            if (property.dataType === FLOW_DATA_TYPE.APEX.value) {
                return resolveApexPropertyReference(
                    property.subtype,
                    remainingFieldNames
                ).then(fields => {
                    return fields ? [property, ...fields] : undefined;
                });
            } else if (property.dataType === FLOW_DATA_TYPE.SOBJECT.value) {
                return resolveEntityFieldReference(
                    property.subtype,
                    remainingFieldNames
                ).then(fields => {
                    return fields ? [property, ...fields] : undefined;
                });
            }
            return undefined;
        }
        return [property];
    });
}

function resolveEntityFieldReference(entityName, fieldNames) {
    if (fieldNames.length === 0) {
        return Promise.resolve([]);
    }
    const [fieldName, ...remainingFieldNames] = fieldNames;
    return fetchFieldsForEntity(entityName, { disableErrorModal: true }).then(
        fields => {
            if (remainingFieldNames.length > 0) {
                const {
                    relationshipName,
                    specificEntityName
                } = getPolymorphicRelationShipName(fieldName);
                const field = getEntityFieldWithRelationshipName(
                    fields,
                    relationshipName
                );
                if (!field) {
                    return undefined;
                }
                const referenceToName = getReferenceToName(
                    field,
                    relationshipName,
                    specificEntityName
                );
                return resolveEntityFieldReference(
                    referenceToName,
                    remainingFieldNames
                ).then(remainingFields => {
                    return remainingFields
                        ? [field, ...remainingFields]
                        : undefined;
                });
            }
            const field = getEntityFieldWithApiName(fields, fieldName);
            if (!field) {
                return undefined;
            }
            return [field];
        }
    );
}

function resolveLightningComponentOutputReference(extensionName, fieldNames) {
    if (fieldNames.length === 0) {
        return Promise.resolve([]);
    }
    const [fieldName, ...remainingFieldNames] = fieldNames;
    return fetchExtensionOutputParameters(extensionName).then(
        outputParameters => {
            const outputParameter = outputParameters[fieldName];
            if (!outputParameter) {
                return undefined;
            }
            const field = getExtensionParamDescriptionAsComplexTypeFieldDescription(
                outputParameter
            );
            if (remainingFieldNames.length > 0) {
                if (field.dataType === FLOW_DATA_TYPE.APEX.value) {
                    return resolveApexPropertyReference(
                        field.subtype,
                        remainingFieldNames
                    ).then(remainingFields => {
                        return remainingFields
                            ? [field, ...remainingFields]
                            : undefined;
                    });
                } else if (field.dataType === FLOW_DATA_TYPE.SOBJECT.value) {
                    return resolveEntityFieldReference(
                        field.subtype,
                        remainingFieldNames
                    ).then(remainingFields => {
                        return remainingFields
                            ? [field, ...remainingFields]
                            : undefined;
                    });
                }
                return undefined;
            }
            return [field];
        }
    );
}

export function getReferenceToName(
    field,
    relationshipName,
    specificEntityName
) {
    let referenceToName;
    if (specificEntityName) {
        if (
            !field.isPolymorphic ||
            !entityFieldIncludesReferenceToName(field, specificEntityName)
        ) {
            return undefined;
        }
        referenceToName = specificEntityName;
    } else {
        if (field.isPolymorphic) {
            return undefined;
        }
        referenceToName = field.referenceToNames[0];
    }
    return referenceToName;
}

function entityFieldIncludesReferenceToName(entityField, referenceToName) {
    referenceToName = referenceToName.toLowerCase();
    return entityField.referenceToNames.some(
        fieldReferenceToName =>
            fieldReferenceToName.toLowerCase() === referenceToName
    );
}

export function getPolymorphicRelationShipName(fieldName) {
    const index = fieldName.indexOf(':');
    if (index < 0) {
        return { relationshipName: fieldName };
    }
    return {
        relationshipName: fieldName.substr(0, index),
        specificEntityName: fieldName.substr(index + 1)
    };
}

export function getEntityFieldWithRelationshipName(fields, relationshipName) {
    relationshipName = relationshipName.toLowerCase();
    for (const apiName in fields) {
        if (fields.hasOwnProperty(apiName)) {
            const field = fields[apiName];
            if (field.isSpanningAllowed) {
                if (
                    field.relationshipName &&
                    relationshipName === field.relationshipName.toLowerCase()
                ) {
                    return fields[apiName];
                } else if (
                    relationshipName === field.apiName.toLowerCase() &&
                    field.isCustom
                ) {
                    return fields[apiName];
                }
            }
        }
    }
    return undefined;
}

function getExtensionOutputParamDescriptions(extension) {
    return extension.outputParameters.reduce((acc, parameter) => {
        acc[
            parameter.apiName
        ] = getExtensionParamDescriptionAsComplexTypeFieldDescription(
            parameter
        );
        return acc;
    }, {});
}

function fetchExtensionOutputParameters(extensionName) {
    return describeExtension(extensionName, { disableErrorModal: true }).then(
        extension => {
            return getExtensionOutputParamDescriptions(extension);
        }
    );
}
