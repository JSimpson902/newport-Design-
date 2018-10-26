import { createElement } from 'lwc';
import { getShadowRoot } from 'lwc-test-utils';
import InvocableActionEditor from "../invocableActionEditor";
import { mockActionParameters, mockActions } from "mock/calloutData";
import { ClosePropertyEditorEvent, CannotRetrieveCalloutParametersEvent } from 'builder_platform_interaction/events';

const defaultNode = {
        actionName: {value: 'chatterPost', error: null},
        actionType: {value: 'chatterPost', error: null},
        description : {value: 'This is a description', error: null},
        elementType : 'ACTION_CALL',
        guid : '66b95c2c-468d-466b-baaf-5ad964be585e',
        isCanvasElemen : true,
        label : {value: 'Post to Chatter', error: null},
        locationX : 358,
        locationY : 227,
        name : {value: 'Post_to_Chatter', error: null},
        inputParameters : [
            {
                rowIndex: '58d8bd82-1977-4cf3-a5a7-f629347fa0e8',
                name: {
                  value: 'subjectNameOrId',
                  error: null
                },
                value: {
                  value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f',
                  error: null
                },
                valueDataType: 'reference',
              },
              {
                  rowIndex: '84b6d19d-718f-452d-9803-fe97a263f76c',
                  name: {
                    value: 'text',
                    error: null
                  },
                  value: {
                    value: 'This is a message',
                    error: null
                  },
                  valueDataType: 'String',
              }
        ],
        outputParameters: [
            {
                rowIndex: 'a27f10fb-5858-474c-8f87-0fc38a5c7ebf',
                name: {
                  value: 'feedItemId',
                  error: null
                },
                value: {
                  value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f',
                  error: null
                },
                valueDataType: 'reference',
            }
        ]
    };

const commonUtils = require.requireActual('builder_platform_interaction/commonUtils');
commonUtils.format = jest.fn().mockImplementation((formatString, ...args) => formatString + '(' + args.toString() + ')');

const createComponentUnderTest = (node, { isNewMode = false} = {}) => {
    const el = createElement('builder_platform_interaction-invocable-action-editor', { is: InvocableActionEditor });
    Object.assign(el, {node, isNewMode});
    document.body.appendChild(el);
    return el;
};

const selectors = {
    baseCalloutEditor: 'builder_platform_interaction-base-callout-editor',
};

let mockActionParametersPromise = Promise.resolve(mockActionParameters);
let mockActionsPromise = Promise.resolve(mockActions);

jest.mock('builder_platform_interaction/serverDataLib', () => {
    const actual = require.requireActual('builder_platform_interaction/serverDataLib');
    const SERVER_ACTION_TYPE = actual.SERVER_ACTION_TYPE;
    return {
        SERVER_ACTION_TYPE,
        fetchOnce : (serverActionType) => {
            switch (serverActionType) {
            case SERVER_ACTION_TYPE.GET_INVOCABLE_ACTIONS:
                return mockActionsPromise;
            case SERVER_ACTION_TYPE.GET_INVOCABLE_ACTION_PARAMETERS:
                return mockActionParametersPromise;
            default:
                return Promise.reject();
            }
        }
    };
});

const getBaseCalloutEditor = (actionEditor) => {
    return getShadowRoot(actionEditor).querySelector(selectors.baseCalloutEditor);
};

describe('Invocable Action editor', () => {
    let actionEditorCmp, baseCalloutEditorCmp;
    beforeEach(() => {
        actionEditorCmp = createComponentUnderTest(defaultNode);
        baseCalloutEditorCmp = getBaseCalloutEditor(actionEditorCmp);
    });
    afterEach(() => {
        mockActionParametersPromise = Promise.resolve(mockActionParameters);
        mockActionsPromise = Promise.resolve(mockActions);
    });
    it('should display a subtitle including the action call label', async () => {
        actionEditorCmp = createComponentUnderTest(defaultNode);
        baseCalloutEditorCmp = getBaseCalloutEditor(actionEditorCmp);
        await mockActionsPromise;
        await mockActionParametersPromise;
        expect(baseCalloutEditorCmp.subtitle).toBe('FlowBuilderInvocableActionEditor.subtitle(Post to Chatter)');
    });
    it('contains base callout editor', () => {
        actionEditorCmp = createComponentUnderTest(defaultNode);
        baseCalloutEditorCmp = getBaseCalloutEditor(actionEditorCmp);
        expect(baseCalloutEditorCmp).not.toBeNull();
    });
    it('should not display a subtitle if call to GET_INVOCABLE_ACTIONS failed', async () => {
        mockActionsPromise = Promise.reject();
        actionEditorCmp = createComponentUnderTest(defaultNode, {isNewMode:false});
        baseCalloutEditorCmp = getBaseCalloutEditor(actionEditorCmp);
        await mockActionsPromise.catch(() => {
            expect(baseCalloutEditorCmp.subtitle).toBe('');
        });
    });
    describe('Edit existing invocable action', () => {
        it('should dispatch a ClosePropertyEditorEvent if call to GET_INVOCABLE_ACTION_PARAMETERS failed', async () => {
            mockActionParametersPromise = Promise.reject();
            actionEditorCmp = createComponentUnderTest(defaultNode, {isNewMode:false});
            const eventCallback = jest.fn();
            document.addEventListener(ClosePropertyEditorEvent.EVENT_NAME, eventCallback);
            await mockActionsPromise;
            await mockActionParametersPromise.catch(() => {
                document.removeEventListener(ClosePropertyEditorEvent.EVENT_NAME, eventCallback);
                expect(eventCallback).toHaveBeenCalled();
            });
        });
    });
    describe('New invocable action node', () => {
        it('should dispatch a CannotRetrieveCalloutParametersEvent if call to GET_INVOCABLE_ACTION_PARAMETERS failed', async () => {
            mockActionParametersPromise = Promise.reject();
            actionEditorCmp = createComponentUnderTest(defaultNode, {isNewMode:true});
            const eventCallback = jest.fn();
            document.addEventListener(CannotRetrieveCalloutParametersEvent.EVENT_NAME, eventCallback);
            await mockActionsPromise;
            await mockActionParametersPromise.catch(() => {
                document.removeEventListener(CannotRetrieveCalloutParametersEvent.EVENT_NAME, eventCallback);
                expect(eventCallback).toHaveBeenCalled();
            });
        });
    });
});