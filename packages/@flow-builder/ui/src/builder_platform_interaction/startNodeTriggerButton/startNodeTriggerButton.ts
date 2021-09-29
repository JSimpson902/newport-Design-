import { LightningElement, api } from 'lwc';
import { FLOW_TRIGGER_TYPE, FLOW_TRIGGER_SAVE_TYPE } from 'builder_platform_interaction/flowMetadata';
import { EditElementEvent, ArrowKeyDownEvent } from 'builder_platform_interaction/events';
const { BEFORE_SAVE, BEFORE_DELETE, AFTER_SAVE, SCHEDULED, SCHEDULED_JOURNEY, PLATFORM_EVENT } = FLOW_TRIGGER_TYPE;
const { CREATE, UPDATE, CREATE_AND_UPDATE, DELETE } = FLOW_TRIGGER_SAVE_TYPE;
import { LABELS } from './startNodeTriggerButtonLabels';
import { getEventTypes, MANAGED_SETUP } from 'builder_platform_interaction/sobjectLib';
import { isRecordChangeTriggerType } from 'builder_platform_interaction/triggerTypeLib';
import { commands, keyboardInteractionUtils, lwcUtils } from 'builder_platform_interaction/sharedUtils';

const { ArrowDown, ArrowUp, EnterCommand, SpaceCommand } = commands;
const { KeyboardInteractions, createShortcut, Keys } = keyboardInteractionUtils;

const selectors = {
    button: '.button'
};

export default class StartNodeTriggerButton extends LightningElement {
    dom = lwcUtils.createDomProxy(this, selectors);

    @api
    node!: UI.Start;

    @api
    focus() {
        this.dom.button.focus();
    }

    get unsetStartButtonClasses() {
        return 'unset-start-button slds-p-vertical_x-small slds-p-horizontal_medium';
    }

    get startButtonClasses() {
        return 'start-button-trigger-context slds-p-vertical_x-small slds-p-horizontal_medium';
    }

    get chooseScheduleOrEvent() {
        switch (this.node.triggerType) {
            case SCHEDULED:
            case SCHEDULED_JOURNEY:
                return LABELS.startElementSetSchedule;
            case PLATFORM_EVENT:
                return LABELS.startElementAddEvent;
            default:
                return '';
        }
    }

    get isSetTrigger() {
        switch (this.node.triggerType) {
            case AFTER_SAVE:
            case BEFORE_DELETE:
            case BEFORE_SAVE:
                return true;
            case SCHEDULED:
            case SCHEDULED_JOURNEY:
                return !!this.node.startDate;
            case PLATFORM_EVENT:
                return !!this.node.object;
            default:
                return false;
        }
    }

    get editLabel() {
        return LABELS.startElementEdit;
    }

    get selectedTriggerLabel() {
        // Record Change
        if (isRecordChangeTriggerType(this.node.triggerType)) {
            switch (this.node.recordTriggerType) {
                case CREATE:
                    return LABELS.recordTriggerTypeCreated;
                case UPDATE:
                    return LABELS.recordTriggerTypeUpdated;
                case CREATE_AND_UPDATE:
                    return LABELS.recordTriggerTypeCreatedOrUpdated;
                case DELETE:
                    return LABELS.recordTriggerTypeDeleted;
                default:
                    return '';
            }
        }
        // Platform Event
        if (this.node.triggerType === PLATFORM_EVENT) {
            const item = getEventTypes(MANAGED_SETUP).find(
                (menuItem) => menuItem.qualifiedApiName === this.node.object
            );
            return item ? item.label : this.node.object;
        }
        // Scheduled Flow
        return this.node.label;
    }

    get triggerLabel() {
        return isRecordChangeTriggerType(this.node.triggerType)
            ? LABELS.startElementTrigger
            : this.node.triggerType === PLATFORM_EVENT
            ? LABELS.startElementEvent
            : LABELS.startElementFlowStarts;
    }

    get isPlatformEvent() {
        return this.node.triggerType === PLATFORM_EVENT;
    }

    get runFlowLabel() {
        switch (this.node.triggerType) {
            case BEFORE_SAVE:
            case BEFORE_DELETE:
            case AFTER_SAVE:
                return LABELS.startElementRunFlow;
            case SCHEDULED:
            case SCHEDULED_JOURNEY:
                return LABELS.startElementFrequency;
            default:
                return '';
        }
    }

    get selectedRunFlowLabel() {
        switch (this.node.triggerType) {
            case BEFORE_SAVE:
                return LABELS.triggerTypeBeforeSave;
            case AFTER_SAVE:
                return LABELS.triggerTypeAfterSave;
            case BEFORE_DELETE:
                return LABELS.triggerTypeBeforeDelete;
            case SCHEDULED:
            case SCHEDULED_JOURNEY:
                return this.node.frequency;
            default:
                return '';
        }
    }

    constructor() {
        super();
        this.keyboardInteractions = new KeyboardInteractions();
    }

    handleTriggerClick = (event?: Event) => {
        if (event) {
            event.stopPropagation();
        }

        const canvasElementGUID = this.node.guid;
        const editElementEvent = new EditElementEvent(canvasElementGUID, this.node.triggerType);
        this.dispatchEvent(editElementEvent);
    };

    /**
     * Helper function to dispatch the ArrowKeyDownEvent event that'll be handled
     * in alcStartMenu
     *
     * @param key - The arrow key pressed
     */
    handleArrowKeyDown(key) {
        const arrowKeyDownEvent = new ArrowKeyDownEvent(key);
        this.dispatchEvent(arrowKeyDownEvent);
    }

    /**
     * Helper function used during keyboard command
     */
    handleSpaceOrEnter() {
        this.handleTriggerClick();
    }

    setupCommandsAndShortcuts() {
        this.keyboardInteractions.registerShortcuts([
            createShortcut(Keys.Enter, new EnterCommand(() => this.handleSpaceOrEnter())),
            createShortcut(Keys.Space, new SpaceCommand(() => this.handleSpaceOrEnter())),
            createShortcut(Keys.ArrowDown, new ArrowDown(() => this.handleArrowKeyDown(ArrowDown.COMMAND_NAME))),
            createShortcut(Keys.ArrowUp, new ArrowUp(() => this.handleArrowKeyDown(ArrowUp.COMMAND_NAME)))
        ]);
    }

    connectedCallback() {
        this.keyboardInteractions.addKeyDownEventListener(this.template);
        this.setupCommandsAndShortcuts();
    }

    disconnectedCallback() {
        this.keyboardInteractions.removeKeyDownEventListener(this.template);
    }
}
