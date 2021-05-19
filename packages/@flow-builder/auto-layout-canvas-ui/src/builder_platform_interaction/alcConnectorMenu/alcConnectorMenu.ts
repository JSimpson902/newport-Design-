import { Guid, ElementMetadata } from 'builder_platform_interaction/autoLayoutCanvas';

import { api } from 'lwc';
import { AddElementEvent } from 'builder_platform_interaction/events';
import {
    CloseMenuEvent,
    PasteOnCanvasEvent,
    MoveFocusToConnectorEvent,
    GoToPathEvent,
    DeleteGoToConnectionEvent
} from 'builder_platform_interaction/alcEvents';
import Menu from 'builder_platform_interaction/menu';
import {
    configureMenu,
    PASTE_ACTION,
    GOTO_ACTION,
    GOTO_DELETE_ACTION,
    GOTO_REROUTE_ACTION
} from './alcConnectorMenuConfig';
import { LABELS } from './alcConnectorMenuLabels';
import { commands, keyboardInteractionUtils } from 'builder_platform_interaction/sharedUtils';
import {
    moveFocusInMenuOnArrowKeyDown,
    setupKeyboardShortcutUtil,
    setupKeyboardShortcutWithShiftKey
} from 'builder_platform_interaction/contextualMenuUtils';

const { ArrowDown, ArrowUp, EnterCommand, SpaceCommand, EscapeCommand, TabCommand } = commands;
const { KeyboardInteractions } = keyboardInteractionUtils;

const selectors = {
    menuItem: 'div[role="option"]',
    alcMenu: 'builder_platform_interaction-alc-menu'
};

enum TabFocusRingItems {
    Icon = 0,
    FirstItem = 1,
    OtherItems = 2
}

/**
 * The connector menu overlay. It is displayed when clicking on a connector.
 */
export default class AlcConnectorMenu extends Menu {
    @api
    childIndex!: number;

    @api
    elementsMetadata: ElementMetadata[] = [];

    /* true if this branch can be merged, false otherwise*/
    @api
    canMergeEndedBranch!: boolean;

    @api
    next!: Guid;

    @api
    parent!: Guid;

    @api
    prev!: Guid;

    @api
    isPasteAvailable!: boolean;

    /* whether the end element should be shown in the menu */
    @api
    hasEndElement!: boolean;

    @api
    canAddGoto!: boolean;

    @api
    isGoToConnector!: boolean;

    // Used for testing purposes
    @api
    keyboardInteractions;

    @api
    moveFocus = () => {
        this.tabFocusRingIndex = TabFocusRingItems.Icon;
        this.handleTabCommand(false);
    };

    get menuConfiguration() {
        return configureMenu(
            this.elementsMetadata,
            this.hasEndElement,
            this.isPasteAvailable,
            this.canAddGoto,
            this.isGoToConnector
        );
    }

    get labels(): Labels {
        return LABELS;
    }

    constructor() {
        super();
        this.keyboardInteractions = new KeyboardInteractions();
        this.tabFocusRingIndex = TabFocusRingItems.Icon;
    }

    /**
     * Menu item action behaviour dependent on yjr attributes of the selected element
     * @param currentTarget
     */
    doSelectMenuItem(currentTarget: HTMLElement) {
        this.dispatchEvent(new CloseMenuEvent());
        const action = currentTarget.getAttribute('data-value');

        switch (action) {
            case PASTE_ACTION:
                this.dispatchEvent(new PasteOnCanvasEvent(this.prev!, this.next!, this.parent!, this.childIndex!));
                this.dispatchEvent(new MoveFocusToConnectorEvent(this.prev || this.parent, this.childIndex));
                break;
            case GOTO_ACTION:
                this.dispatchEvent(
                    new GoToPathEvent(this.next!, this.prev, this.parent, this.childIndex, this.canMergeEndedBranch)
                );
                break;
            case GOTO_DELETE_ACTION:
                this.dispatchEvent(new DeleteGoToConnectionEvent(this.prev || this.parent, this.childIndex));
                break;
            case GOTO_REROUTE_ACTION:
                this.dispatchEvent(
                    new GoToPathEvent(
                        this.next!,
                        this.prev,
                        this.parent,
                        this.childIndex,
                        this.canMergeEndedBranch,
                        true
                    )
                );
                break;
            default: {
                const { prev, parent, childIndex } = this;
                const alcInsertAt = prev ? { prev } : { parent, childIndex };

                this.dispatchEvent(
                    // @ts-ignore
                    new AddElementEvent({
                        elementType: currentTarget.getAttribute('data-value')!,
                        elementSubtype: currentTarget.getAttribute('data-sub-type')!,
                        locationX: 0,
                        locationY: 0,
                        alcInsertAt
                    })
                );
            }
        }
    }

    /**
     * Item selected via mouse click.  Does not propagate
     * @param event
     */
    handleSelectMenuItem(event) {
        event.stopPropagation();
        this.doSelectMenuItem(event.currentTarget);
    }

    getItemFromItemList(index) {
        const listItems = Array.from(this.template.querySelectorAll(selectors.menuItem)) as any;
        return listItems && listItems[index];
    }

    moveFocusToFirstListItem() {
        const firstRowItem = this.getItemFromItemList(0);
        firstRowItem.focus();
    }

    /**
     * Helper function to move the focus correctly when using arrow keys in the contextual menu
     * @param key - the key pressed (arrowDown or arrowUp)
     */
    handleArrowKeyDown(key) {
        const currentItemInFocus = this.template.activeElement;
        if (currentItemInFocus) {
            const items = Array.from(this.template.querySelectorAll(selectors.menuItem)) as any;
            moveFocusInMenuOnArrowKeyDown(items, currentItemInFocus, key);
        }
        if (this.template.activeElement !== this.getItemFromItemList(0)) {
            this.tabFocusRingIndex = TabFocusRingItems.OtherItems;
        }
    }

    /**
     * Helper function used during keyboard commands
     */
    handleSpaceOrEnter() {
        const currentItemInFocus = this.template.activeElement;
        if (currentItemInFocus) {
            this.doSelectMenuItem(currentItemInFocus.parentElement);
        }
    }

    handleEscape() {
        this.dispatchEvent(new CloseMenuEvent());
        this.dispatchEvent(new MoveFocusToConnectorEvent(this.prev || this.parent, this.childIndex));
    }

    tabFocusRingCmds = [
        // focus on the connector icon
        () => this.dispatchEvent(new MoveFocusToConnectorEvent(this.prev || this.parent, this.childIndex)),
        // focus on the first item
        () => this.moveFocusToFirstListItem()
    ];

    calcaulateTabFocusRingIdx(shift, tabFocusRingIndex) {
        let newTabFocusRingIdx;
        if (tabFocusRingIndex === TabFocusRingItems.OtherItems) {
            newTabFocusRingIdx = shift ? tabFocusRingIndex % this.tabFocusRingCmds.length : tabFocusRingIndex - 1;
        } else {
            newTabFocusRingIdx = shift ? tabFocusRingIndex - 1 : (tabFocusRingIndex + 1) % this.tabFocusRingCmds.length;
            if (newTabFocusRingIdx === -1) {
                newTabFocusRingIdx = this.tabFocusRingCmds.length - 1;
            }
        }
        return newTabFocusRingIdx;
    }

    setupCommandsAndShortcuts() {
        const keyboardCommands = {
            Enter: new EnterCommand(() => this.handleSpaceOrEnter()),
            ' ': new SpaceCommand(() => this.handleSpaceOrEnter()),
            ArrowDown: new ArrowDown(() => this.handleArrowKeyDown(ArrowDown.COMMAND_NAME)),
            ArrowUp: new ArrowUp(() => this.handleArrowKeyDown(ArrowUp.COMMAND_NAME)),
            Escape: new EscapeCommand(() => this.handleEscape()),
            Tab: new TabCommand(() => this.handleTabCommand(false), false)
        };
        setupKeyboardShortcutUtil(this.keyboardInteractions, keyboardCommands);
        const shiftTabCommand = new TabCommand(() => this.handleTabCommand(true), true);
        setupKeyboardShortcutWithShiftKey(this.keyboardInteractions, shiftTabCommand, 'Tab');
    }

    connectedCallback() {
        this.keyboardInteractions.addKeyDownEventListener(this.template);
        this.setupCommandsAndShortcuts();
    }

    disconnectedCallback() {
        this.keyboardInteractions.removeKeyDownEventListener(this.template);
    }

    renderedCallback() {
        if (this.moveFocusToMenu) {
            const items = Array.from(this.template.querySelectorAll(selectors.menuItem)) as any;
            if (items.length > 0) {
                items[0].focus();
                this.tabFocusRingIndex = TabFocusRingItems.FirstItem;
            }
        }
    }
}
