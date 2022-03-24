// @ts-nocheck
import {
    ClearHighlightedPathEvent,
    CloseMenuEvent,
    DeleteBranchElementEvent,
    HighlightPathsToDeleteEvent
} from 'builder_platform_interaction/alcEvents';
import { NodeType } from 'builder_platform_interaction/autoLayoutCanvas';
import { createComponent, ticks } from 'builder_platform_interaction/builderTestUtils/commonTestUtils';
import { keydownEvent } from 'builder_platform_interaction/builderTestUtils/events';
import {
    CopySingleElementEvent,
    DeleteElementEvent,
    EditElementEvent,
    OpenSubflowEvent
} from 'builder_platform_interaction/events';
import { commands, Keys } from 'builder_platform_interaction/sharedUtils';
import type { LightningElement } from 'lwc';
import { ELEMENT_ACTION_CONFIG } from '../alcNodeMenuConfig';
import { LABELS } from '../alcNodeMenuLabels';
const { ArrowDown, EscapeCommand, SpaceCommand, EnterCommand } = commands;

jest.mock('builder_platform_interaction/sharedUtils', () => require('builder_platform_interaction_mocks/sharedUtils'));

const dummySimpleElement = {
    guid: 'simpleElementGuid',
    section: 'Dummy_Section',
    icon: 'standard:lightning_component',
    description: 'Dummy Description',
    label: 'Dummy_Label',
    value: 'Dummy_Value',
    elementType: 'Dummy_ElementType',
    type: NodeType.DEFAULT
};
const dummyLoopElement = {
    guid: 'loopElementGuid',
    section: 'Dummy_Section',
    icon: 'standard:lightning_component',
    description: 'Dummy Description',
    label: 'Dummy_Label',
    value: 'Dummy_Value',
    elementType: 'Dummy_ElementType',
    type: NodeType.LOOP
};

const dummyBranchElement = {
    guid: 'branchElementGuid',
    section: 'Dummy_Section',
    icon: 'standard:lightning_component',
    description: 'Dummy Description',
    label: 'Dummy_Label',
    value: 'Dummy_Value',
    elementType: 'Decision',
    type: NodeType.BRANCH
};

const conditionOptions = [
    {
        label: 'outcome1',
        value: 'outcome1Guid'
    },
    {
        label: 'Default Outcome',
        value: 'DEFAULT_PATH'
    },
    {
        label: 'None: Delete All Outcomes',
        value: 'NO_PATH'
    }
];

const dummySubflowElement = {
    guid: 'subflowElementGuid',
    section: 'Dummy_Section',
    icon: 'standard:lightning_component',
    description: 'Dummy Description',
    label: 'Dummy_Label',
    value: 'Dummy_Value',
    elementType: 'Subflow',
    type: NodeType.DEFAULT
};

const selectors = {
    header: '[slot="header"]',
    headerLabel: '.test-header-label',
    headerDescription: '.test-header-description',
    menuActionList: '.slds-dropdown__divst',
    menuActionRow: '.slds-dropdown__item',
    menuActionRowMenuItem: 'a[role="menuitem"]',
    menuActionRowIcon: 'lightning-icon',
    menuActionRowLabel: '.slds-media__body',
    backButton: '.back-button',
    conditionPicker: 'lightning-combobox',
    footer: '[slot="footer"]',
    footerButton: 'lightning-button'
};

const createComponentUnderTest = async (
    elementMetadata: {
        guid: UI.Guid;
        section?: string;
        icon?: string;
        description?: string;
        label?: string;
        value?: string;
        elementType?: string;
        type?: NodeType;
    },
    conditionOptions?: { label: string; value: string }[]
) => {
    const overrideOptions = {
        flowModel: { [elementMetadata.guid]: elementMetadata },
        conditionOptions,
        elementMetadata,
        guid: elementMetadata.guid
    };
    return createComponent('builder_platform_interaction-alc-node-menu', overrideOptions);
};

function assertArrowDown(cmp: LightningElement, fromIndex: number) {
    const listItems = cmp.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);
    cmp.getListKeyboardInteraction().setActiveElement(listItems[fromIndex]);

    const callback = jest.fn();
    listItems[(fromIndex + 1) % listItems.length].addEventListener('focus', callback);

    cmp.keyboardInteractions.execute(ArrowDown.COMMAND_NAME);
    expect(callback).toHaveBeenCalled();
}

function assertArrowUp(cmp: LightningElement, fromIndex: number) {
    const listItems = cmp.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);
    cmp.getListKeyboardInteraction().setActiveElement(listItems[fromIndex]);

    const callback = jest.fn();
    const nextIndex = fromIndex === 0 ? listItems.length - 1 : fromIndex - 1;
    listItems[nextIndex].addEventListener('focus', callback);

    cmp.keyboardInteractions.execute(ArrowDown.COMMAND_NAME);
    expect(callback).toHaveBeenCalled();
}

describe('Node Menu', () => {
    describe('Base Node Menu', () => {
        let menu: LightningElement;
        beforeEach(async () => {
            menu = await createComponentUnderTest(dummySimpleElement);
        });

        it('renders the element action contextual menu', () => {
            expect(menu).toBeDefined();
        });

        it('Should have a label in the header', () => {
            const header = menu.shadowRoot.querySelector(selectors.header);
            const label = header.querySelector(selectors.headerLabel);
            expect(label.textContent).toEqual(dummySimpleElement.label);
        });

        it('Should have a description in the header', () => {
            const header = menu.shadowRoot.querySelector(selectors.header);
            const description = header.querySelector(selectors.headerDescription);
            expect(description.textContent).toEqual(dummySimpleElement.description);
        });

        it('Focus should move correctly to the next row on arrow down', () => {
            assertArrowDown(menu, 0);
        });

        it('Focus should move correctly to the previous row on arrow up', () => {
            assertArrowUp(menu, 1);
        });

        it('Focus should move correctly to the first row on arrow down on the last row', () => {
            const listItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);
            assertArrowDown(menu, listItems.length - 1);
        });

        it('Focus should move correctly to the last row on arrow up on the first row', () => {
            assertArrowUp(menu, 0);
        });

        it('Pressing escape while focus is on menu item fires the CloseMenuEvent', () => {
            const listItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);
            listItems[0].focus();
            const callback = jest.fn();
            menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
            menu.keyboardInteractions.execute(EscapeCommand.COMMAND_NAME);
            expect(callback).toHaveBeenCalled();
        });
    });

    describe('Element Action Node Menu for a Simple Element', () => {
        let menu: LightningElement;
        beforeEach(async () => {
            menu = await createComponentUnderTest(dummySimpleElement);
        });

        describe('Copy Row', () => {
            let copyRow: LightningElement;
            beforeEach(() => {
                copyRow = menu.shadowRoot.querySelectorAll(selectors.menuActionRow)[0];
            });
            describe('Clicking', () => {
                it('Clicking on the Copy Action dispatches the CopySingleElementEvent', () => {
                    const callback = jest.fn();
                    menu.addEventListener(CopySingleElementEvent.EVENT_NAME, callback);
                    copyRow.click();
                    expect(callback).toHaveBeenCalled();
                });

                it('Clicking on the Copy Action dispatches the close menu event', () => {
                    const callback = jest.fn();
                    menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
                    copyRow.click();
                    expect(callback).toHaveBeenCalled();
                });

                it('The copy row icon should have the right icon-name', () => {
                    const copyIcon = copyRow.querySelector(selectors.menuActionRowIcon);
                    expect(copyIcon.iconName).toBe(ELEMENT_ACTION_CONFIG.COPY_ACTION.icon);
                });

                it('The copy row icon should have the right variant', () => {
                    const copyIcon = copyRow.querySelector(selectors.menuActionRowIcon);
                    expect(copyIcon.variant).toBe(ELEMENT_ACTION_CONFIG.COPY_ACTION.iconVariant);
                });

                it('The copy row should have the right label', () => {
                    const copyRowLabel = copyRow.querySelector(selectors.menuActionRowLabel);
                    expect(copyRowLabel.textContent).toBe(ELEMENT_ACTION_CONFIG.COPY_ACTION.label);
                });
            });

            describe('Keyboard commands', () => {
                it('Pressing enter on the Copy Action dispatches the CopySingleElementEvent', () => {
                    const listItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);

                    const callback = jest.fn();
                    menu.addEventListener(CopySingleElementEvent.EVENT_NAME, callback);
                    listItems[0].focus();
                    menu.keyboardInteractions.execute(EnterCommand.COMMAND_NAME);
                    expect(callback).toHaveBeenCalled();
                });

                it('Pressing enter on the Copy Action dispatches the close menu event', () => {
                    const listItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);

                    const callback = jest.fn();
                    menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
                    listItems[0].focus();
                    menu.keyboardInteractions.execute(EnterCommand.COMMAND_NAME);
                    expect(callback).toHaveBeenCalled();
                });

                it('Pressing space on the Copy Action dispatches the CopySingleElementEvent', () => {
                    const listItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);
                    const callback = jest.fn();
                    menu.addEventListener(CopySingleElementEvent.EVENT_NAME, callback);
                    listItems[0].focus();
                    menu.keyboardInteractions.execute(SpaceCommand.COMMAND_NAME);
                    expect(callback).toHaveBeenCalled();
                });

                it('Pressing space on the Copy Action dispatches the close menu event', () => {
                    const listItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);
                    const callback = jest.fn();
                    menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
                    listItems[0].focus();
                    menu.keyboardInteractions.execute(SpaceCommand.COMMAND_NAME);
                    expect(callback).toHaveBeenCalled();
                });
            });
        });

        describe('Delete Row', () => {
            let deleteRow: LightningElement;
            beforeEach(() => {
                deleteRow = menu.shadowRoot.querySelectorAll(selectors.menuActionRow)[1];
            });

            describe('Clicking', () => {
                it('Clicking on the Delete Action dispatches the DeleteElementEvent', () => {
                    const callback = jest.fn();
                    menu.addEventListener(DeleteElementEvent.EVENT_NAME, callback);
                    deleteRow.click();
                    expect(callback).toHaveBeenCalled();
                });

                it('Clicking the Delete Action should dispatch DeleteElementEvent with right details', () => {
                    const callback = jest.fn();
                    menu.addEventListener(DeleteElementEvent.EVENT_NAME, callback);
                    deleteRow.click();
                    expect(callback.mock.calls[0][0].detail).toMatchObject({
                        selectedElementGUID: [dummySimpleElement.guid],
                        selectedElementType: dummySimpleElement.elementType
                    });
                });

                it('Clicking the Delete Action for Loop should dispatch DeleteElementEvent with right details', async () => {
                    menu = await createComponentUnderTest(dummyLoopElement);
                    deleteRow = menu.shadowRoot.querySelectorAll(selectors.menuActionRow)[1];
                    const callback = jest.fn();
                    menu.addEventListener(DeleteElementEvent.EVENT_NAME, callback);
                    deleteRow.click();
                    expect(callback.mock.calls[0][0].detail).toMatchObject({
                        selectedElementGUID: [dummyLoopElement.guid],
                        selectedElementType: dummyLoopElement.elementType,
                        childIndexToKeep: 0
                    });
                });

                it('Clicking on the Delete Action dispatches the close menu event', () => {
                    const callback = jest.fn();
                    menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
                    deleteRow.click();
                    expect(callback).toHaveBeenCalled();
                });

                it('The delete row icon should have the right icon-name', () => {
                    const deleteIcon = deleteRow.querySelector(selectors.menuActionRowIcon);
                    expect(deleteIcon.iconName).toBe(ELEMENT_ACTION_CONFIG.DELETE_ACTION.icon);
                });

                it('The delete row icon should have the right variant', () => {
                    const deleteIcon = deleteRow.querySelector(selectors.menuActionRowIcon);
                    expect(deleteIcon.variant).toBe(ELEMENT_ACTION_CONFIG.DELETE_ACTION.iconVariant);
                });

                it('The delete row should have the right label', () => {
                    const deleteRowLabel = deleteRow.querySelector(selectors.menuActionRowLabel);
                    expect(deleteRowLabel.textContent).toBe(ELEMENT_ACTION_CONFIG.DELETE_ACTION.label);
                });
            });

            describe('Keyboard Commands', () => {
                it('Pressing enter on the Delete Action dispatches the DeleteElementEvent', () => {
                    const listItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);
                    const callback = jest.fn();
                    menu.addEventListener(DeleteElementEvent.EVENT_NAME, callback);
                    listItems[1].focus();
                    menu.keyboardInteractions.execute(EnterCommand.COMMAND_NAME);
                    expect(callback).toHaveBeenCalled();
                });

                it('Pressing enter on the Delete Action should dispatch DeleteElementEvent with right details', () => {
                    const listItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);
                    const callback = jest.fn();
                    menu.addEventListener(DeleteElementEvent.EVENT_NAME, callback);
                    listItems[1].focus();
                    menu.keyboardInteractions.execute(EnterCommand.COMMAND_NAME);
                    expect(callback.mock.calls[0][0].detail).toMatchObject({
                        selectedElementGUID: [dummySimpleElement.guid],
                        selectedElementType: dummySimpleElement.elementType
                    });
                });

                it('Pressing enter on the Delete Action dispatches the close menu event', () => {
                    const listItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);
                    const callback = jest.fn();
                    menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
                    listItems[1].focus();
                    menu.keyboardInteractions.execute(EnterCommand.COMMAND_NAME);
                    expect(callback).toHaveBeenCalled();
                });

                it('Pressing space on the Delete Action dispatches the DeleteElementEvent', () => {
                    const listItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);
                    const callback = jest.fn();
                    menu.addEventListener(DeleteElementEvent.EVENT_NAME, callback);
                    listItems[1].focus();
                    menu.keyboardInteractions.execute(SpaceCommand.COMMAND_NAME);
                    expect(callback).toHaveBeenCalled();
                });

                it('Pressing space on the Delete Action should dispatch DeleteElementEvent with right details', () => {
                    const listItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);
                    const callback = jest.fn();
                    menu.addEventListener(DeleteElementEvent.EVENT_NAME, callback);
                    listItems[1].focus();
                    menu.keyboardInteractions.execute(SpaceCommand.COMMAND_NAME);
                    expect(callback.mock.calls[0][0].detail).toMatchObject({
                        selectedElementGUID: [dummySimpleElement.guid],
                        selectedElementType: dummySimpleElement.elementType
                    });
                });

                it('Pressing space on the Delete Action dispatches the close menu event', () => {
                    const listItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem);
                    const callback = jest.fn();
                    menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
                    listItems[1].focus();
                    menu.keyboardInteractions.execute(SpaceCommand.COMMAND_NAME);
                    expect(callback).toHaveBeenCalled();
                });
            });
        });

        describe('Footer area for Simple Element', () => {
            let footer: LightningElement;
            let editButton: LightningElement;

            beforeEach(() => {
                footer = menu.shadowRoot.querySelector(selectors.footer);
                editButton = footer.querySelector(selectors.footerButton);
            });

            it('Should have a Footer area', () => {
                expect(footer).not.toBeNull();
            });

            it('Should have edit button in the Footer', () => {
                expect(editButton).not.toBeNull();
            });

            it('Edit Button label should be as set in the config', () => {
                expect(editButton.label).toBe(ELEMENT_ACTION_CONFIG.EDIT_DETAILS_ACTION.buttonTextLabel);
            });

            it('Edit Button title should be as set in the config', () => {
                expect(editButton.title).toBe(ELEMENT_ACTION_CONFIG.EDIT_DETAILS_ACTION.buttonTextTitle);
            });

            it('Edit Button icon-name should be as set in the config', () => {
                expect(editButton.iconName).toBe(ELEMENT_ACTION_CONFIG.EDIT_DETAILS_ACTION.buttonIcon);
            });

            it('Edit Button icon-position should be as set in the config', () => {
                expect(editButton.iconPosition).toBe(ELEMENT_ACTION_CONFIG.EDIT_DETAILS_ACTION.buttonIconPosition);
            });

            it('Edit Button variant should be as set in the config', () => {
                expect(editButton.variant).toBe(ELEMENT_ACTION_CONFIG.EDIT_DETAILS_ACTION.buttonVariant);
            });

            it('Clicking the Edit Button should dispatch EditElementEvent', () => {
                const callback = jest.fn();
                menu.addEventListener(EditElementEvent.EVENT_NAME, callback);
                editButton.click();
                expect(callback).toHaveBeenCalled();
                expect(callback.mock.calls[0][0].detail).toEqual({
                    canvasElementGUID: dummySimpleElement.guid,
                    mode: EditElementEvent.EVENT_NAME,
                    designateFocus: true
                });
            });

            it('Clicking the Edit Button should dispatch CloseMenuEvent', () => {
                const callback = jest.fn();
                menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
                editButton.click();
                expect(callback).toHaveBeenCalled();
            });

            it('Pressing escape while focus is on the edit button fires the CloseMenuEvent', () => {
                const callback = jest.fn();
                menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
                editButton.focus();
                menu.keyboardInteractions.execute(EscapeCommand.COMMAND_NAME);
                expect(callback).toHaveBeenCalled();
            });

            it('Pressing escape while focus is on the edit button should not fire the EditElementEvent', () => {
                const callback = jest.fn();
                menu.addEventListener(EditElementEvent.EVENT_NAME, callback);
                editButton.focus();
                menu.keyboardInteractions.execute(EscapeCommand.COMMAND_NAME);
                expect(callback).not.toHaveBeenCalled();
            });

            test('once focus is set to the edit footer button, enter key down should dispatch "EditElementEvent" with proper arguments', () => {
                const callback = jest.fn();
                menu.addEventListener(EditElementEvent.EVENT_NAME, callback);
                menu.getListKeyboardInteraction().setActiveElement(editButton);
                editButton.dispatchEvent(keydownEvent(Keys.Enter));
                expect(callback.mock.calls[0][0].detail).toEqual({
                    canvasElementGUID: dummySimpleElement.guid,
                    mode: EditElementEvent.EVENT_NAME,
                    designateFocus: true
                });
            });
        });
    });

    describe('Element Action Node Menu for a Branch Element', () => {
        let menu: LightningElement;
        const highlightPathCallback = jest.fn();
        const closeMenuCallback = jest.fn();

        beforeEach(async () => {
            menu = await createComponentUnderTest(dummyBranchElement, conditionOptions);
            menu.addEventListener(HighlightPathsToDeleteEvent.EVENT_NAME, highlightPathCallback);
            menu.addEventListener(CloseMenuEvent.EVENT_NAME, closeMenuCallback);

            const mi = menu.shadowRoot.querySelectorAll(selectors.menuActionRowMenuItem)[1];
            menu.getListKeyboardInteraction().setActiveElement(mi);
            mi.click();
        });

        it('Clicking the Delete Action should dispatch HighlightPathsToDeleteEvent', () => {
            expect(highlightPathCallback).toHaveBeenCalled();
        });

        it('HighlightPathsToDeleteEvent should be dispatched with the right details', () => {
            expect(highlightPathCallback.mock.calls[0][0].detail).toMatchObject({
                childIndexToKeep: 0,
                elementGuidToDelete: dummyBranchElement.guid
            });
        });

        it('Clicking the Delete Action should not dispatch CloseMenuEvent', () => {
            expect(closeMenuCallback).not.toHaveBeenCalled();
        });

        it('Clicking on the Delete Action should reveal the back button', () => {
            const backButton = menu.shadowRoot.querySelector(selectors.backButton);
            expect(backButton).not.toBeNull();
        });

        it('Back button should have the right alternativeText', () => {
            const backButton = menu.shadowRoot.querySelector(selectors.backButton);
            expect(backButton.alternativeText).toBe(LABELS.backButtonAlternativeText);
        });

        it('Back button should have the right icon name', () => {
            const backButton = menu.shadowRoot.querySelector(selectors.backButton);
            expect(backButton.iconName).toBe('utility:back');
        });

        it('Back button should have the right title', () => {
            const backButton = menu.shadowRoot.querySelector(selectors.backButton);
            expect(backButton.title).toBe(LABELS.backButtonTitle);
        });

        it('Back button should have the right variant', () => {
            const backButton = menu.shadowRoot.querySelector(selectors.backButton);
            expect(backButton.variant).toBe('bare');
        });

        it('Clicking on the Back Button should dispatch ClearHighlightedPathEvent', () => {
            const backButton = menu.shadowRoot.querySelector(selectors.backButton);
            const clearHighlightedPathCallback = jest.fn();
            menu.addEventListener(ClearHighlightedPathEvent.EVENT_NAME, clearHighlightedPathCallback);
            backButton.click();
            expect(clearHighlightedPathCallback).toHaveBeenCalled();
        });

        it('Clicking on the Back Button should go back to base menu and reveal the list of action rows', async () => {
            const backButton = menu.shadowRoot.querySelector(selectors.backButton);
            backButton.click();
            await ticks(1);
            const actionList = menu.shadowRoot.querySelector(selectors.menuActionList);
            expect(actionList).not.toBeNull();
        });

        it('Clicking on the Back Button should go back to base footer', async () => {
            const backButton = menu.shadowRoot.querySelector(selectors.backButton);
            backButton.click();
            await ticks(1);
            const footer = menu.shadowRoot.querySelector(selectors.footer);
            const editButton = footer.querySelector(selectors.footerButton);
            expect(editButton.label).toBe(ELEMENT_ACTION_CONFIG.EDIT_DETAILS_ACTION.buttonTextLabel);
        });

        it('Pressing escape while focus is on the Back Button fires the CloseMenuEvent', async () => {
            const backButton = menu.shadowRoot.querySelector(selectors.backButton);
            const callback = jest.fn();
            menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
            backButton.focus();
            menu.keyboardInteractions.execute(EscapeCommand.COMMAND_NAME);
            expect(callback).toHaveBeenCalled();
        });

        it('Pressing escape while focus is on the combobox fires the CloseMenuEvent', async () => {
            const combobox = menu.shadowRoot.querySelector(selectors.conditionPicker);
            const callback = jest.fn();
            menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
            combobox.focus();
            menu.keyboardInteractions.execute(EscapeCommand.COMMAND_NAME);
            expect(callback).toHaveBeenCalled();
        });

        it('Clicking on the Delete Action should reveal the path picking combobox', () => {
            const connectorCombobox = menu.shadowRoot.querySelector(selectors.conditionPicker);
            expect(connectorCombobox).not.toBeNull();
        });

        it('Combobox label should be correctly set', () => {
            const connectorCombobox = menu.shadowRoot.querySelector(selectors.conditionPicker);
            expect(connectorCombobox.label).toEqual(LABELS.deleteBranchElementComboboxLabel);
        });

        it('Combobox options should be same as condition options', () => {
            const connectorCombobox = menu.shadowRoot.querySelector(selectors.conditionPicker);
            expect(connectorCombobox.options).toEqual(conditionOptions);
        });

        it('Combobox value should be same as first condition option value', () => {
            const connectorCombobox = menu.shadowRoot.querySelector(selectors.conditionPicker);
            expect(connectorCombobox.value).toEqual(conditionOptions[0].value);
        });

        describe('Footer area for Branch Element', () => {
            let footer: LightningElement;
            let deleteButton: LightningElement;

            beforeEach(() => {
                footer = menu.shadowRoot.querySelector(selectors.footer);
                deleteButton = footer.querySelector(selectors.footerButton);
            });

            it('Should have a Footer area', () => {
                expect(footer).not.toBeNull();
            });

            it('Should have delete button in the Footer', () => {
                expect(deleteButton).not.toBeNull();
            });

            it('Delete Button label should be as set in the config', () => {
                expect(deleteButton.label).toBe(ELEMENT_ACTION_CONFIG.DELETE_BRANCH_ELEMENT_ACTION.buttonTextLabel);
            });

            it('Delete Button Title should be as set in the config', () => {
                expect(deleteButton.title).toBe(ELEMENT_ACTION_CONFIG.DELETE_BRANCH_ELEMENT_ACTION.buttonTextTitle);
            });

            it('Delete Button icon-name should be as set in the config', () => {
                expect(deleteButton.iconName).toBe(ELEMENT_ACTION_CONFIG.DELETE_BRANCH_ELEMENT_ACTION.buttonIcon);
            });

            it('Delete Button icon-position should be as set in the config', () => {
                expect(deleteButton.iconPosition).toBe(
                    ELEMENT_ACTION_CONFIG.DELETE_BRANCH_ELEMENT_ACTION.buttonIconPosition
                );
            });

            it('Delete Button variant should be as set in the config', () => {
                expect(deleteButton.variant).toBe(ELEMENT_ACTION_CONFIG.DELETE_BRANCH_ELEMENT_ACTION.buttonVariant);
            });

            it('Clicking the Delete Button should dispatch DeleteBranchElementEvent', () => {
                const callback = jest.fn();
                menu.addEventListener(DeleteBranchElementEvent.EVENT_NAME, callback);
                deleteButton.click();
                expect(callback).toHaveBeenCalled();
            });

            it('Clicking the Delete Button should dispatch DeleteBranchElementEvent with right details', () => {
                const callback = jest.fn();
                menu.addEventListener(DeleteBranchElementEvent.EVENT_NAME, callback);
                deleteButton.click();
                expect(callback.mock.calls[0][0]).toMatchObject({
                    detail: {
                        selectedElementGUID: [dummyBranchElement.guid],
                        selectedElementType: dummyBranchElement.elementType,
                        childIndexToKeep: 0
                    }
                });
            });

            test('once focus is set to the delete footer button, enter key down should dispatch "DeleteBranchElementEvent" with proper arguments', () => {
                const callback = jest.fn();
                menu.addEventListener(DeleteBranchElementEvent.EVENT_NAME, callback);
                menu.getListKeyboardInteraction().setActiveElement(deleteButton);
                deleteButton.dispatchEvent(keydownEvent(Keys.Enter));
                expect(callback.mock.calls[0][0].detail).toEqual({
                    selectedElementGUID: [dummyBranchElement.guid],
                    selectedElementType: dummyBranchElement.elementType,
                    childIndexToKeep: 0
                });
            });

            it('Pressing escape while focus is on the Delete Button fires the CloseMenuEvent', () => {
                const callback = jest.fn();
                menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
                deleteButton.focus();
                menu.keyboardInteractions.execute(EscapeCommand.COMMAND_NAME);
                expect(callback).toHaveBeenCalled();
            });

            it('Pressing escape while focus is on the Delete Button does not fire the DeleteElementEvent', () => {
                const callback = jest.fn();
                menu.addEventListener(DeleteBranchElementEvent.EVENT_NAME, callback);
                deleteButton.focus();
                menu.keyboardInteractions.execute(EscapeCommand.COMMAND_NAME);
                expect(callback).not.toHaveBeenCalled();
            });

            it('Clicking the Delete Button should dispatch CloseMenuEvent', () => {
                const callback = jest.fn();
                menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
                deleteButton.click();
                expect(callback).toHaveBeenCalled();
            });
        });
    });

    describe('Subflow Node Menu', () => {
        let menu: LightningElement;
        let openFlowRow: LightningElement;
        beforeEach(async () => {
            menu = await createComponentUnderTest(dummySubflowElement);
            menu.flowModel = {
                subflowElementGuid: {
                    flowName: 'Dummy Subflow'
                }
            };
            openFlowRow = menu.shadowRoot.querySelectorAll(selectors.menuActionRow)[2];
        });

        it('Should have the open subflow row item', () => {
            expect(openFlowRow).toBeDefined();
        });

        it('Clicking on the Open Subflow row item should dispatch the OpenSubflowEvent', () => {
            const callback = jest.fn();
            menu.addEventListener(OpenSubflowEvent.EVENT_NAME, callback);
            openFlowRow.click();
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        flowName: menu.flowModel.subflowElementGuid.flowName
                    }
                })
            );
        });

        it('Clicking on the Open Subflow row dispatches the close menu event', () => {
            const callback = jest.fn();
            menu.addEventListener(CloseMenuEvent.EVENT_NAME, callback);
            openFlowRow.click();
            expect(callback).toHaveBeenCalled();
        });

        it('The Open Subflow row icon should have the right icon-name', () => {
            const openSubflowIcon = openFlowRow.querySelector(selectors.menuActionRowIcon);
            expect(openSubflowIcon.iconName).toBe(ELEMENT_ACTION_CONFIG.OPEN_SUBFLOW_ACTION.icon);
        });

        it('The Open Subflow row icon should have the right variant', () => {
            const openSubflowIcon = openFlowRow.querySelector(selectors.menuActionRowIcon);
            expect(openSubflowIcon.variant).toBe(ELEMENT_ACTION_CONFIG.OPEN_SUBFLOW_ACTION.iconVariant);
        });

        it('The Open Subflow row should have the right label', () => {
            const openSubflowLabel = openFlowRow.querySelector(selectors.menuActionRowLabel);
            expect(openSubflowLabel.textContent).toBe(ELEMENT_ACTION_CONFIG.OPEN_SUBFLOW_ACTION.label);
        });
    });
});
