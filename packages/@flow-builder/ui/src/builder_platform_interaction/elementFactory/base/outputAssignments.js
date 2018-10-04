import { createExpressionListRowItemWithoutOperator } from "./baseList";
/**
 * Facotry function for creating output assignment used in record lookup and recordChoiceSet
 * @param {Object} outputAssignment
 * @param {String} sObject - eg: Account
 */
export const createOutputAssignment = (outputAssignment, sObject) => {
    let newOuputAssignment = {};
    if (outputAssignment.hasOwnProperty('field') && outputAssignment.hasOwnProperty('assignToReference')) {
        const leftHandSide = sObject + '.' + outputAssignment.field;
        const rightHandSide = outputAssignment.assignToReference;
        newOuputAssignment = createExpressionListRowItemWithoutOperator({leftHandSide, rightHandSide});
    } else {
        newOuputAssignment = createExpressionListRowItemWithoutOperator();
    }
    return newOuputAssignment;
};
/**
 * Facotry function for creating output assignment metadata object used in record lookup and recordChoiceSet
 * @param {Object} outputAssignment
 * @param {String} sObject
 */
export const createOutputAssignmentMetadataObject = (outputAssignment) => {
    if (!outputAssignment) {
        throw new Error('outputAssignment is required to create the outputAssignmentMetadataObject');
    }
    const field = outputAssignment.leftHandSide.substring(outputAssignment.leftHandSide.indexOf('.') + 1); // TODO refactor this
    const assignToReference = outputAssignment.rightHandSide;
    return {
        field,
        assignToReference
    };
};