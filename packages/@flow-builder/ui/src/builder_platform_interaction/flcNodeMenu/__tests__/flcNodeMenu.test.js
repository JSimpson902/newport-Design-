// @ts-nocheck
import { createElement } from 'lwc';
import FlcNodeMenu from 'builder_platform_interaction/flcNodeMenu';
import {
    CopySingleElementEvent,
    DeleteElementEvent,
    HighlightPathsToDeleteEvent,
    EditElementEvent,
    ToggleMenuEvent
} from 'builder_platform_interaction/events';
import { ELEMENT_ACTION_CONFIG } from '../flcNodeMenuConfig';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { LABELS } from '../flcNodeMenuLabels';

const dummySimpleElement = {
    guid: 'simpleElementGuid',
    section: 'Dummy_Section',
    icon: 'standard:lightning_component',
    description: 'Dummy Description',
    label: 'Dummy_Label',
    value: 'Dummy_Value',
    elementType: 'Dummy_ElementType',
    type: 'default'
};

const dummyBranchElement = {
    guid: 'branchElementGuid',
    section: 'Dummy_Section',
    icon: 'standard:lightning_component',
    description: 'Dummy Description',
    label: 'Dummy_Label',
    value: 'Dummy_Value',
    elementType: ELEMENT_TYPE.DECISION,
    type: 'default'
};

const dummyEndElement = {
    guid: 'endElementGuid',
    section: 'Logic',
    icon: 'standard:first_non_empty',
    description: 'End Description',
    label: 'End',
    value: 'END_ELEMENT',
    elementType: 'END_ELEMENT',
    type: 'end'
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

const selectors = {
    header: '.node-menu-header',
    cancelButton: '.test-cancel-button',
    headerLabel: '.test-header-label',
    headerDescription: '.test-header-description',
    menuActionRow: '.slds-dropdown__item',
    menuActionRowIcon: 'lightning-icon',
    menuActionRowLabel: '.slds-media__body',
    conditionPicker: 'lightning-combobox',
    footer: '.test-footer',
    footerButton: 'lightning-button'
};

const createComponentUnderTest = (metaData, passedConditionOptions) => {
    const el = createElement('builder_platform_interaction-flc-node-menu', {
        is: FlcNodeMenu
    });
    el.conditionOptions = passedConditionOptions;
    el.elementMetadata = metaData;
    el.guid = metaData.guid;
    document.body.appendChild(el);
    return el;
};

describe('Node Menu', () => {
    describe('Base Node Menu', () => {
        let menu;
        beforeEach(() => {
            menu = createComponentUnderTest(dummySimpleElement);
        });

        it('renders the element action contextual menu', () => {
            expect(menu).toBeDefined();
        });

        it('Should have a cancel button in the header', () => {
            const header = menu.shadowRoot.querySelector(selectors.header);
            const cancelButton = header.querySelector(selectors.cancelButton);
            expect(cancelButton).not.toBeNull();
        });

        it('Should use a label for the Cancel button text', () => {
            const header = menu.shadowRoot.querySelector(selectors.header);
            const cancelButton = header.querySelector(selectors.cancelButton);
            expect(cancelButton.label).toBe(LABELS.cancelLabel);
        });

        it('Should use a title for the Cancel button text', () => {
            const header = menu.shadowRoot.querySelector(selectors.header);
            const cancelButton = header.querySelector(selectors.cancelButton);
            expect(cancelButton.title).toBe(LABELS.cancelTitle);
        });

        it('Clicking on the Cancel Button should dispatch ToggleMenuEvent', () => {
            const callback = jest.fn();
            menu.addEventListener(ToggleMenuEvent.EVENT_NAME, callback);
            const header = menu.shadowRoot.querySelector(selectors.header);
            header.querySelector(selectors.cancelButton).click();
            expect(callback).toHaveBeenCalled();
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
    });

    describe('Element Action Node Menu for a Simple Element', () => {
        let menu;
        beforeEach(() => {
            menu = createComponentUnderTest(dummySimpleElement);
        });

        describe('Copy Row', () => {
            let copyRow;
            beforeEach(() => {
                copyRow = menu.shadowRoot.querySelectorAll(selectors.menuActionRow)[0];
            });

            it('Clicking on the Copy Action dispatches the CopySingleElementEvent', () => {
                const callback = jest.fn();
                menu.addEventListener(CopySingleElementEvent.EVENT_NAME, callback);
                copyRow.click();
                expect(callback).toHaveBeenCalled();
            });

            it('Clicking on the Copy Action dispatches the toggle menu event ', () => {
                const callback = jest.fn();
                menu.addEventListener(ToggleMenuEvent.EVENT_NAME, callback);
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

        describe('Delete Row', () => {
            let deleteRow;
            beforeEach(() => {
                deleteRow = menu.shadowRoot.querySelectorAll(selectors.menuActionRow)[1];
            });

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

            it('Clicking on the Delete Action dispatches the toggle menu event ', () => {
                const callback = jest.fn();
                menu.addEventListener(ToggleMenuEvent.EVENT_NAME, callback);
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

        describe('Footer area for Simple Element', () => {
            let footer;
            let editButton;

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
            });

            it('Clicking the Edit Button should dispatch ToggleMenuEvent', () => {
                const callback = jest.fn();
                menu.addEventListener(ToggleMenuEvent.EVENT_NAME, callback);
                editButton.click();
                expect(callback).toHaveBeenCalled();
            });
        });
    });

    describe('Element Action Node Menu for a Branch Element', () => {
        let menu;
        const highlightPathCallback = jest.fn();
        const toggleMenuCallback = jest.fn();

        beforeEach(() => {
            menu = createComponentUnderTest(dummyBranchElement, conditionOptions);
            menu.addEventListener(HighlightPathsToDeleteEvent.EVENT_NAME, highlightPathCallback);
            menu.addEventListener(ToggleMenuEvent.EVENT_NAME, toggleMenuCallback);
            menu.shadowRoot.querySelectorAll(selectors.menuActionRow)[1].click();
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

        it('Clicking the Delete Action should not dispatch ToggleMenuEvent', () => {
            expect(toggleMenuCallback).not.toHaveBeenCalled();
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
            let footer;
            let deleteButton;

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

            it('Clicking the Delete Button should dispatch DeleteElementEvent', () => {
                const callback = jest.fn();
                menu.addEventListener(DeleteElementEvent.EVENT_NAME, callback);
                deleteButton.click();
                expect(callback).toHaveBeenCalled();
            });

            it('Clicking the Delete Button should dispatch DeleteElementEvent with right details', () => {
                const callback = jest.fn();
                menu.addEventListener(DeleteElementEvent.EVENT_NAME, callback);
                deleteButton.click();
                expect(callback.mock.calls[0][0]).toMatchObject({
                    detail: {
                        selectedElementGUID: [dummyBranchElement.guid],
                        selectedElementType: dummyBranchElement.elementType,
                        childIndexToKeep: 0
                    }
                });
            });

            it('Clicking the Delete Button should dispatch ToggleMenuEvent', () => {
                const callback = jest.fn();
                menu.addEventListener(ToggleMenuEvent.EVENT_NAME, callback);
                deleteButton.click();
                expect(callback).toHaveBeenCalled();
            });
        });
    });

    describe('Element Action Node Menu for End Element', () => {
        let menu;
        let deleteRow;
        beforeEach(() => {
            menu = createComponentUnderTest(dummyEndElement);
            deleteRow = menu.shadowRoot.querySelector(selectors.menuActionRow);
        });

        it('Should only have one dropdown item', () => {
            const dropDownItems = menu.shadowRoot.querySelectorAll(selectors.menuActionRow);
            expect(dropDownItems).toHaveLength(1);
        });

        it('The delete row icon should have the right icon-name', () => {
            const deleteIcon = deleteRow.querySelector(selectors.menuActionRowIcon);
            expect(deleteIcon.iconName).toBe(ELEMENT_ACTION_CONFIG.DELETE_END_ELEMENT_ACTION.icon);
        });

        it('The delete row icon should have the right variant', () => {
            const deleteIcon = deleteRow.querySelector(selectors.menuActionRowIcon);
            expect(deleteIcon.variant).toBe(ELEMENT_ACTION_CONFIG.DELETE_END_ELEMENT_ACTION.iconVariant);
        });

        it('The delete row should have the right label', () => {
            const deleteRowLabel = deleteRow.querySelector(selectors.menuActionRowLabel);
            expect(deleteRowLabel.textContent).toBe(ELEMENT_ACTION_CONFIG.DELETE_END_ELEMENT_ACTION.label);
        });

        it('Clicking on the Delete Action dispatches the DeleteElementEvent', () => {
            const callback = jest.fn();
            menu.addEventListener(DeleteElementEvent.EVENT_NAME, callback);
            deleteRow.click();
            expect(callback).toHaveBeenCalled();
        });

        it('Clicking on the Delete Action dispatches the toggle menu event ', () => {
            const callback = jest.fn();
            menu.addEventListener(ToggleMenuEvent.EVENT_NAME, callback);
            deleteRow.click();
            expect(callback).toHaveBeenCalled();
        });

        it('Should not have a Footer area', () => {
            const footer = menu.shadowRoot.querySelector(selectors.footer);
            expect(footer).toBeNull();
        });
    });
});
