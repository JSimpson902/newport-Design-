import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { createActionCall } from './actionCall';

const elementType = ELEMENT_TYPE.APEX_CALL;

/**
 * Either creates a new apex call or create a new copy of existing apex call
 * @param {Object} apexCall existing apex call which needs to be copied
 * @return {Object} newApexCall new apex call which is created
 */
export function createApexCall(apexCall = {}) {
    return  createActionCall(apexCall, elementType);
}
