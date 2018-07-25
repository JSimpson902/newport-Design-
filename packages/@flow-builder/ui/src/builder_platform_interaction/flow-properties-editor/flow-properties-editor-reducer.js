import { flowPropertiesEditorValidation } from './flow-properties-editor-validation';
import { updateProperties } from 'builder_platform_interaction-data-mutation-lib';
import { VALIDATE_ALL } from 'builder_platform_interaction-validation-rules';
import {
    PropertyChangedEvent
} from 'builder_platform_interaction-events';

const flowPropertiesPropertyChanged = (state, event) => {
    event.detail.error = event.detail.error === null ?
        flowPropertiesEditorValidation.validateProperty(event.detail.propertyName, event.detail.value) : event.detail.error;
    return updateProperties(state, {
        [event.detail.propertyName]: {error: event.detail.error, value: event.detail.value}
    });
};

/**
 * flow properties reducer function runs validation rules and returns back the updated flow properties object
 * @param {object} state - flow properties object
 * @param {object} event - object containing type and payload eg: {type:'xyz', payload: {propertyName: '', value: '' , error: ''}}
 * @returns {object} flowProperties - updated flow properties object
 */
export const flowPropertiesEditorReducer = (state, event) => {
    switch (event.type) {
        case PropertyChangedEvent.EVENT_NAME: {
            return flowPropertiesPropertyChanged(state, event);
        }
        case VALIDATE_ALL: {
            return flowPropertiesEditorValidation.validateAll(state);
        }
        default: return state;
    }
};
