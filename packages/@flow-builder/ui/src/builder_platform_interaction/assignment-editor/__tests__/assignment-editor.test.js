import { createElement } from 'engine';
import AssignmentEditor from '../assignment-editor';
import { PropertyChangedEvent, AddListItemEvent, DeleteListItemEvent, UpdateListItemEvent} from 'builder_platform_interactioncommon-events';
import {deepCopy} from 'builder_platform_interaction-store-lib';

function createComponentForTest() {
    const el = createElement('builder_platform_interaction-assignment-editor', { is: AssignmentEditor });
    document.body.appendChild(el);
    return el;
}

const testObj = {
    assignmentItems : [{
        operator: {value: 'Assign', error: null},
        valueType: {value: '', error: null},
        leftHandSide: {value: '1bdec16ccb-1919d-1868a-1bb1b-1f2881327c187d0', error: null},
        rightHandSide: {value: 'xyz', error: null},
        inputDataType: {value:'', error: null}
    }],
    description : {value: '', error: null},
    elementType : 'ASSIGNMENT',
    guid : '141f916fee-1c6f3-108bf-1ca54-16c041fcba152a7',
    isCanvasElemen : true,
    label : {value: 'testAssignment', error: null},
    locationX : 358,
    locationY : 227,
    name : {value: 'testAssignment', error: null}
};

describe('assignment-editor', () => {
    it('handles the property changed event and updates the property', () => {
        const assignmentElement = createComponentForTest();
        assignmentElement.node = deepCopy(testObj);
        return Promise.resolve().then(() => {
            const event = new PropertyChangedEvent('description', 'new desc', null);
            assignmentElement.querySelector('builder_platform_interactioncommon-label-description').dispatchEvent(event);
            expect(assignmentElement.node.description.value).toBe('new desc');
        });
    });
    it('handles the add list item changed event and updates the assignmentItems array', () => {
        const assignmentElement = createComponentForTest();
        assignmentElement.node = deepCopy(testObj);
        return Promise.resolve().then(() => {
            const event = new AddListItemEvent();
            assignmentElement.querySelector('builder_platform_interactioncommon-list').dispatchEvent(event);
            expect(assignmentElement.node.assignmentItems.length).toBe(2);
        });
    });
    it('handles the delete list item changed event and updates the assignmentItems array', () => {
        const assignmentElement = createComponentForTest();
        assignmentElement.node = deepCopy(testObj);
        return Promise.resolve().then(() => {
            const event = new DeleteListItemEvent(0);
            assignmentElement.querySelector('builder_platform_interactioncommon-list').dispatchEvent(event);
            expect(assignmentElement.node.assignmentItems.length).toBe(0);
        });
    });
    it('delete list item at non existent index does nothing', () => {
        const assignmentElement = createComponentForTest();
        assignmentElement.node = deepCopy(testObj);
        return Promise.resolve().then(() => {
            const event = new DeleteListItemEvent(1);
            assignmentElement.querySelector('builder_platform_interactioncommon-list').dispatchEvent(event);
            expect(assignmentElement.node.assignmentItems.length).toBe(1);
        });
    });
    it('handles the update list item changed event and updates the assignmentItems array', () => {
        const assignmentElement = createComponentForTest();
        assignmentElement.node = deepCopy(testObj);
        return Promise.resolve().then(() => {
            const event = new UpdateListItemEvent(0, "leftHandSide", "test value", null);
            assignmentElement.querySelector('builder_platform_interactioncommon-list').dispatchEvent(event);
            expect(assignmentElement.node.assignmentItems[0].leftHandSide.value).toBe("test value");
        });
    });
    it('update list item at non existent index does nothing', () => {
        const assignmentElement = createComponentForTest();
        assignmentElement.node = deepCopy(testObj);
        return Promise.resolve().then(() => {
            const event = new UpdateListItemEvent(1, "leftHandSide", "test value", null);
            assignmentElement.querySelector('builder_platform_interactioncommon-list').dispatchEvent(event);
            expect(assignmentElement.node.assignmentItems.length).toBe(1);
        });
    });
});