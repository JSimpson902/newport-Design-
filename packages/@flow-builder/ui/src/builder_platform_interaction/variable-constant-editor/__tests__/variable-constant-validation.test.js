import { createElement } from "lwc";
import VariableEditor from '../variable-constant-editor';
import { variableValidation } from '../variable-constant-validation.js';
import * as mockStoreData from 'mock-store-data';
import { deepCopy } from 'builder_platform_interaction-store-lib';
import { getErrorsFromHydratedElement } from 'builder_platform_interaction-data-mutation-lib';

const setupComponentUnderTest = (props) => {
    const element = createElement('builder_platform_interaction-variable-constant-editor', {
        is: VariableEditor,
    });
    element.node = props;
    document.body.appendChild(element);
    return element;
};

describe('Variable Validation', () => {
    let stringVar;

    const validate = (node) => {
        return getErrorsFromHydratedElement(variableValidation.validateAll(node));
    };

    it('returns error for variable with no dataType', () => {
        stringVar = deepCopy(mockStoreData.mutatedVariables[mockStoreData.stringVariableGuid]);
        stringVar.dataType.value = undefined;
        const variable = setupComponentUnderTest(stringVar);
        const node = variable.node;
        const errors = validate(node);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toHaveProperty('key', 'dataType');
    });

    it('returns error for sobject variable with no sobject type', () => {
        const sobjectVar = deepCopy(mockStoreData.mutatedVariables[mockStoreData.accountSObjectVariableGuid]);
        sobjectVar.objectType.value = undefined;
        const variable = setupComponentUnderTest(sobjectVar);
        const errors = validate(variable.node);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toHaveProperty('key', 'objectType');
    });
});