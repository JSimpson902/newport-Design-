import { ELEMENT_TYPE } from 'builder_platform_interaction-flow-metadata';
import { baseResource, baseElementsArrayToMap } from './base/base-element';
import { baseResourceMetadataObject } from './base/base-metadata';
import { createFEROV, createFEROVMetadataObject } from './ferov';

const elementType = ELEMENT_TYPE.CONSTANT;
const DEFAULT_VALUE_PROPERTY = 'defaultValue';
const FEROV_DATA_TYPE_PROPERTY = 'ferovDataType';

export function createConstant(constant = {}) {
    const newConstant = baseResource(constant);
    const { dataType = null, value } = constant;
    let valueFerov;
    if (value) {
        valueFerov = createFEROV(value, DEFAULT_VALUE_PROPERTY, FEROV_DATA_TYPE_PROPERTY);
    }
    const { defaultValue = null, ferovDataType = null, defaultValueGuid = null } = valueFerov || constant;
    const constantObject = Object.assign(
        newConstant,
        {
            elementType,
            dataType,
            defaultValue,
            defaultValueGuid,
            ferovDataType
        }
    );

    return constantObject;
}

export function createConstantForStore(constant = {}) {
    const newConstant = createConstant(constant);

    return baseElementsArrayToMap([newConstant]);
}

export function createConstantMetadataObject(constant) {
    if (!constant) {
        throw new Error('constant is not defined');
    }
    const newConstant = baseResourceMetadataObject(constant);
    const { dataType } = constant;
    const valueFerov = createFEROVMetadataObject(
        constant,
        DEFAULT_VALUE_PROPERTY,
        FEROV_DATA_TYPE_PROPERTY
    );

    return Object.assign(newConstant, {
        dataType,
        value: valueFerov
    });
}
