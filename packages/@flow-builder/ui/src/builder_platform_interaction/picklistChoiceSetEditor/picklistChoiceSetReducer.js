import { PROPERTY_EDITOR_ACTION } from 'builder_platform_interaction/actions';
import { picklistChoiceSetValidation, getRules } from './picklistChoiceSetValidation';
import { VALIDATE_ALL } from 'builder_platform_interaction/validationRules';

export const picklistChoiceSetReducer = (picklistChoice, action) => {
    switch (action.type) {
        case PROPERTY_EDITOR_ACTION.UPDATE_ELEMENT_PROPERTY: {
            let propertyValue;
            if (typeof (action.payload.value) === 'string' || action.payload.value === null) {
                if (!action.payload.doValidateProperty) {
                    action.payload.error = null;
                } else {
                    action.payload.error = (action.payload.error === null) ?
                        picklistChoiceSetValidation.validateProperty(action.payload.propertyName, action.payload.value) : action.payload.error;
                }
                propertyValue = {error: action.payload.error, value: action.payload.value};
            } else {
                propertyValue = action.payload.value;
            }

            return Object.assign({}, picklistChoice, {[action.payload.propertyName]: propertyValue});
        }
        case VALIDATE_ALL:
            return picklistChoiceSetValidation.validateAll(picklistChoice, getRules(picklistChoice));
        default: return picklistChoice;
    }
};