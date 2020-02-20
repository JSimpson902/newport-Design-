import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { baseCanvasElement } from './base/baseElement';

/**
 * Creates a end element object in the shape expected by the store
 * @param {Object} endElement end element object used to construct the new object
 * @returns {Object} endElement the new end element object
 */
export function createEndElement(prev) {
    const elementType = ELEMENT_TYPE.END_ELEMENT;

    return {
        ...baseCanvasElement({ prev }),
        elementType,
        label: elementType,
        value: elementType,
        text: elementType,
        name: elementType
    };
}
