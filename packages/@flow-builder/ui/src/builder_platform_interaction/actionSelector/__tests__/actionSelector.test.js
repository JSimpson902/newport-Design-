import { createElement } from 'lwc';
import { getShadowRoot } from 'lwc-test-utils';
import ActionSelector from "../actionSelector";
import { ELEMENT_TYPE } from "builder_platform_interaction/flowMetadata";
import { ValueChangedEvent, ComboboxStateChangedEvent, ActionsLoadedEvent } from "builder_platform_interaction/events";
import { mockActions, mockApexPlugins, mockSubflows } from "mock/calloutData";
import { LABELS } from "../actionSelectorLabels";

const createComponentUnderTest = () => {
    const el = createElement('builder_platform_interaction-action-selector', { is: ActionSelector });
    document.body.appendChild(el);
    return el;
};

const selectors = {
    lightningGroupedCombobox: 'lightning-grouped-combobox',
    lightningInteractionCombobox: 'builder_platform_interaction-combobox'
};

const mockError = [{
    message: "Event fired" // 'This is the message currently returned when an error occurs ...'
}];

let mockActionsPromise = Promise.resolve(mockActions);
let mockApexPluginsPromise = Promise.resolve(mockApexPlugins);
let mockSubflowsPromise = Promise.resolve(mockSubflows);

jest.mock('builder_platform_interaction/serverDataLib', () => {
    const actual = require.requireActual('../../serverDataLib/serverDataLib.js');
    const SERVER_ACTION_TYPE = actual.SERVER_ACTION_TYPE;
    return {
        SERVER_ACTION_TYPE,
        fetchOnce: (serverActionType) => {
            switch (serverActionType) {
                case SERVER_ACTION_TYPE.GET_INVOCABLE_ACTIONS:
                    return mockActionsPromise;
                case SERVER_ACTION_TYPE.GET_APEX_PLUGINS:
                    return mockApexPluginsPromise;
                case SERVER_ACTION_TYPE.GET_SUBFLOWS:
                    return mockSubflowsPromise;
                default:
                    return Promise.reject();
            }
        }
    };
});

describe('Action selector', () => {
    let actionSelectorComponent;
    const interactionCombobox = () => getShadowRoot(actionSelectorComponent).querySelector(selectors.lightningInteractionCombobox);
    const groupedCombobox = () => getShadowRoot(interactionCombobox()).querySelector(selectors.lightningGroupedCombobox);
    afterEach(() => {
        mockActionsPromise = Promise.resolve(mockActions);
        mockApexPluginsPromise = Promise.resolve(mockApexPlugins);
        mockSubflowsPromise = Promise.resolve(mockSubflows);
    });
    describe('By default', () => {
        beforeEach(() => {
            actionSelectorComponent = createComponentUnderTest();
            actionSelectorComponent.invocableActions = mockActions;
            actionSelectorComponent.invocableActionsFetched = true;
        });
        test('Combobox should contain all ACTION_CALL items : standard actions, quick actions and local actions', () => {
            const standardActionText = 'Post to Chatter';
            const quickActionText = 'Add Member';
            const localActionText = 'successLocalAction';
            expect(groupedCombobox().items.map(item => item.text)).toEqual(expect.arrayContaining([standardActionText, quickActionText, localActionText]));
        });
        test('Combobox placeholder should be : Find an Action...', () => {
            expect(groupedCombobox().placeholder).toBe('FlowBuilderActionSelector.actionComboboxPlaceholder');
        });
    });

    describe('When action list is resolved', () => {
        let actionsChangedEventCallback;
        const expectActionsChangedEventCallbackCalledWithElementType = (elementType, numberActions) => {
            expect(actionsChangedEventCallback).toHaveBeenCalled();
            expect(actionsChangedEventCallback.mock.calls[1][0].detail).toEqual({ value: { elementType }, number: numberActions });
        };
        beforeEach(() => {
            mockApexPluginsPromise = Promise.resolve([]);
            actionSelectorComponent = createComponentUnderTest();
            actionsChangedEventCallback = jest.fn();
            document.addEventListener(ActionsLoadedEvent.EVENT_NAME, actionsChangedEventCallback);
        });
        afterEach(() => {
            document.removeEventListener(ActionsLoadedEvent.EVENT_NAME, actionsChangedEventCallback);
        });
        it('should fire ActionsChangedEvent when actions are updated', async () => {
            const expectedNumber = 0;
            actionSelectorComponent.selectedFilterBy = LABELS.filterByTypeOption;
            actionSelectorComponent.selectedCategory = ELEMENT_TYPE.APEX_PLUGIN_CALL;
            interactionCombobox().dispatchEvent(new CustomEvent('change', { detail: { value: ELEMENT_TYPE.APEX_PLUGIN_CALL, number: expectedNumber } }));
            expectActionsChangedEventCallbackCalledWithElementType(ELEMENT_TYPE.APEX_PLUGIN_CALL, expectedNumber);
        });
    });
    describe('When action type changes', () => {
        beforeEach(() => {
            actionSelectorComponent = createComponentUnderTest();
            actionSelectorComponent.invocableActions = mockActions;
            actionSelectorComponent.selectedAction = {};
        });
        it('should update the items of the second combobox', async () => {
            actionSelectorComponent.selectedFilterBy = LABELS.filterByTypeOption;
            actionSelectorComponent.selectedCategory = ELEMENT_TYPE.APEX_CALL;
            await Promise.resolve();
            expect(groupedCombobox().items.map(item => item.text)).toEqual(['Action Test']);
        });
        it('should update the Action combobox placeholder', async () => {
            actionSelectorComponent.selectedAction = { elementType: ELEMENT_TYPE.APEX_CALL };
            await Promise.resolve();
            expect(groupedCombobox().placeholder).toBe('FlowBuilderActionSelector.apexComboboxPlaceholder');
        });
        it('should display no value for the Action combobox', async () => {
            actionSelectorComponent.selectedAction = {
                actionName: 'emailSimple',
                actionType: 'emailSimple',
                elementType: ELEMENT_TYPE.ACTION_CALL
            };
            await Promise.resolve();
            expect(interactionCombobox().value.displayText).toBe('Send Email');
            actionSelectorComponent.selectedAction = { elementType: ELEMENT_TYPE.APEX_CALL };
            await Promise.resolve();
            expect(interactionCombobox().value).toBe('');
        });
        it('api should return the selected element', async () => {
            actionSelectorComponent.selectedAction = { elementType: ELEMENT_TYPE.APEX_CALL };
            expect(actionSelectorComponent.selectedAction).toEqual({ elementType: ELEMENT_TYPE.APEX_CALL });
        });
    });
    describe('When there are no actions for a given action type', () => {
        beforeEach(() => {
            mockApexPluginsPromise = Promise.resolve([]);
            actionSelectorComponent = createComponentUnderTest();
        });
        it('the second combobox should be disabled', async () => {
            actionSelectorComponent.selectedAction = { elementType: ELEMENT_TYPE.APEX_PLUGIN_CALL };
            await Promise.resolve();
            expect(interactionCombobox().disabled).toBe(true);
        });
    });
    describe('When error occurs when retrieving data from server', () => {
        beforeEach(() => {
            mockApexPluginsPromise = Promise.reject(mockError);
            mockActionsPromise = Promise.reject(mockError);
            mockSubflowsPromise = Promise.reject(mockError);
            actionSelectorComponent = createComponentUnderTest();
        });
        test('Second combobox should be disabled', () => {
            expect(interactionCombobox().disabled).toBe(true);
        });
    });
    describe('When the user selects or type something in the second combobox', () => {
        const dispatchActionChangeEvent = async (actionDurableId, displayText = null, error = null) => {
            const item = actionDurableId ? { value: actionDurableId } : null;
            interactionCombobox().dispatchEvent(new ComboboxStateChangedEvent(item, displayText, error));
            await Promise.resolve();
        };
        let eventCallback;
        const expectEventCallbackCalledWithValue = value => {
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0].detail.value).toEqual(value);
        };
        beforeEach(() => {
            actionSelectorComponent = createComponentUnderTest();
            actionSelectorComponent.invocableActions = mockActions;
            eventCallback = jest.fn();
            document.addEventListener(ValueChangedEvent.EVENT_NAME, eventCallback);
        });
        afterEach(() => {
            document.removeEventListener(ValueChangedEvent.EVENT_NAME, eventCallback);
        });
        it('should fire ValueChangedEvent with action name and action type when a standard invocable action is selected', () => {
            dispatchActionChangeEvent('emailSimple-emailSimple');
            expectEventCallbackCalledWithValue({ actionName: 'emailSimple', actionType: 'emailSimple', 'elementType': 'ACTION_CALL' });
        });
        it('should fire ValueChangedEvent with action name and action type when quick action is selected', () => {
            dispatchActionChangeEvent('quickAction-CollaborationGroup.mynamespace__NewGroupMember');
            expectEventCallbackCalledWithValue({ actionName: 'CollaborationGroup.mynamespace__NewGroupMember', actionType: 'quickAction', 'elementType': 'ACTION_CALL' });
        });
        it('should fire ValueChangedEvent with action name and action type when an apex action is selected', () => {
            actionSelectorComponent.selectedAction = { elementType: ELEMENT_TYPE.APEX_CALL };
            dispatchActionChangeEvent('apex-mynamespace__ActionTest');
            expectEventCallbackCalledWithValue({ actionName: 'mynamespace__ActionTest', actionType: 'apex', 'elementType': 'APEX_CALL' });
        });
        it('should fire ValueChangedEvent with action name and action type when an apex plugin is selected', () => {
            actionSelectorComponent.selectedAction = { elementType: ELEMENT_TYPE.APEX_PLUGIN_CALL };
            dispatchActionChangeEvent('mynamespace__lookUpAccountPlugin');
            expectEventCallbackCalledWithValue({ apexClass: 'mynamespace__lookUpAccountPlugin', 'elementType': 'APEX_PLUGIN_CALL' });
        });
        it('should fire ValueChangedEvent with action name and action type when an email alert is selected', () => {
            actionSelectorComponent.selectedAction = { elementType: ELEMENT_TYPE.EMAIL_ALERT };
            dispatchActionChangeEvent('emailAlert-mynamespace__img_src_http_foo_bar_foo_jpg__c.mynamespace__My_Email_Alert');
            expectEventCallbackCalledWithValue({ actionName: 'mynamespace__img_src_http_foo_bar_foo_jpg__c.mynamespace__My_Email_Alert', actionType: 'emailAlert', 'elementType': 'EMAIL_ALERT' });
        });
        it('should fire ValueChangedEvent with flowName when a subflow is selected', () => {
            actionSelectorComponent.selectedAction = { elementType: ELEMENT_TYPE.SUBFLOW };
            dispatchActionChangeEvent('mynamespace__LFB_Sample_01');
            expectEventCallbackCalledWithValue({ flowName: 'mynamespace__LFB_Sample_01', 'elementType': 'SUBFLOW' });
        });
        it('should not fire ValueChangedEvent if this was already the selected action', async () => {
            actionSelectorComponent.selectedAction = {
                actionName: 'emailSimple',
                actionType: 'emailSimple',
                elementType: ELEMENT_TYPE.ACTION_CALL
            };
            await Promise.resolve();
            dispatchActionChangeEvent('emailSimple-emailSimple');
            expect(eventCallback).not.toHaveBeenCalled();
        });
        it('should fire ValueChangedEvent with just the elementType and an error when user types text that does not match an action', () => {
            dispatchActionChangeEvent(null, 'not an existing action');
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0].detail).toEqual({ error: "FlowBuilderCombobox.genericErrorMessage", value: { 'elementType': 'ACTION_CALL' } });
        });
        it('should fire ValueChangedEvent with just the elementType and an error when user focus out with no action selected', () => {
            dispatchActionChangeEvent(null, '');
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0].detail).toEqual({ error: "FlowBuilderValidation.cannotBeBlank", value: { 'elementType': 'ACTION_CALL' } });
        });
        it('should remove errors after they are corrected', () => {
            // set an error
            dispatchActionChangeEvent(null, '');
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0].detail).toEqual({ error: "FlowBuilderValidation.cannotBeBlank", value: { 'elementType': 'ACTION_CALL' } });
            // fiddle with the event listener to get it to rest
            document.removeEventListener(ValueChangedEvent.EVENT_NAME, eventCallback);
            eventCallback = jest.fn();
            document.addEventListener(ValueChangedEvent.EVENT_NAME, eventCallback);
            // now remove it
            dispatchActionChangeEvent('emailSimple-emailSimple');
            expectEventCallbackCalledWithValue({ actionName: 'emailSimple', actionType: 'emailSimple', 'elementType': 'ACTION_CALL' });
        });
    });
    describe('When action changes', () => {
        beforeEach(() => {
            actionSelectorComponent = createComponentUnderTest();
            actionSelectorComponent.invocableActions = mockActions;
            actionSelectorComponent.selectedAction = {
                actionName: 'emailSimple',
                actionType: 'emailSimple',
                elementType: ELEMENT_TYPE.ACTION_CALL
            };
        });
        it('should display the corresponding action label in the Action combobox', () => {
            expect(interactionCombobox().value.displayText).toBe('Send Email');
        });
    });
    describe('Action subtext', () => {
        const groupedComboboxItemWithValue = value => groupedCombobox().items.find(option => option.value === value);
        beforeEach(() => {
            actionSelectorComponent = createComponentUnderTest();
            actionSelectorComponent.invocableActions = mockActions;
            actionSelectorComponent.invocableActionsFetched = true;
        });
        it('should be "{UniqueName}" for global quick actions', () => {
            return Promise.resolve().then(() => {
                const item = groupedComboboxItemWithValue('quickAction-mynamespace__LogACall');
                expect(item.subText).toBe('quickAction-mynamespace__LogACall');
            });
        });
        it('should be "{Uniquename}" for object quick actions', () => {
            return Promise.resolve().then(() => {
                const item = groupedComboboxItemWithValue('quickAction-Case.mynamespace__LogACall');
                expect(item.subText).toBe('quickAction-Case.mynamespace__LogACall');
            });
        });
        it('should be "{Unique Name}" for subflows', async () => {
            actionSelectorComponent.selectedAction = { elementType: ELEMENT_TYPE.SUBFLOW };
            return Promise.resolve().then(() => {
                const item = groupedComboboxItemWithValue('mynamespace__LFB_Sample_Huge_Flow');
                expect(item.subText).toBe('mynamespace__LFB_Sample_Huge_Flow');
            });
        });
        it('should be "{Unique Name}" for apex plugins', async () => {
            actionSelectorComponent.selectedFilterBy = LABELS.filterByTypeOption;
            actionSelectorComponent.selectedCategory = ELEMENT_TYPE.APEX_PLUGIN_CALL;
            return Promise.resolve().then(() => {
                const item = groupedComboboxItemWithValue('mynamespace__lookUpAccountPlugin');
                expect(item.subText).toBe('mynamespace__lookUpAccountPlugin');
            });
        });
    });
});