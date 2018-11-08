import { createElement } from 'lwc';
import { EditFlowPropertiesEvent, SaveFlowEvent } from 'builder_platform_interaction/events';
import Toolbar from 'builder_platform_interaction/toolbar';
import { getShadowRoot } from 'lwc-test-utils';
import { parseMetadataDateTime } from 'builder_platform_interaction/dateTimeUtils';
import { LABELS } from '../toolbarLabels';

const createComponentUnderTest = (props = {}) => {
    const el = createElement('builder_platform_interaction-toolbar', {
        is: Toolbar
    });

    el.lastModifiedDate = props.lastModifiedDate;
    el.saveStatus = props.saveStatus;

    document.body.appendChild(el);
    return el;
};

const selectors = {
    editflowproperties: '.test-toolbar-editflowproperties',
    saveas: '.test-toolbar-saveas',
    save: '.test-toolbar-save',
    lastSave: '.test-toolbar-last-saved'
};

jest.mock('builder_platform_interaction/dateTimeUtils', () => {
    return {
        parseMetadataDateTime: jest.fn().mockName('parseMetadataDateTime'),
    };
});

describe('toolbar', () => {
    it('fires editflowproperties event when edit flow properties button is clicked', () => {
        const toolbarComponent = createComponentUnderTest();

        return Promise.resolve().then(() => {
            const eventCallback = jest.fn();
            toolbarComponent.addEventListener(EditFlowPropertiesEvent.EVENT_NAME, eventCallback);
            getShadowRoot(toolbarComponent).querySelector(selectors.editflowproperties).click();
            expect(eventCallback).toHaveBeenCalled();
        });
    });

    it('Button Group should be present', () => {
        const toolbarComponent = createComponentUnderTest();

        return Promise.resolve().then(() => {
            const toolbarButtonGroup = getShadowRoot(toolbarComponent).querySelector('lightning-button-group');
            expect(toolbarButtonGroup).not.toBeNull();
        });
    });

    it('fires save event when save button is clicked', () => {
        const toolbarComponent = createComponentUnderTest();

        return Promise.resolve().then(() => {
            const eventCallback = jest.fn();
            toolbarComponent.addEventListener(SaveFlowEvent.EVENT_NAME, eventCallback);
            getShadowRoot(toolbarComponent).querySelector(selectors.save).click();
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0].detail.type).toBe(SaveFlowEvent.Type.SAVE);
        });
    });

    it('fires saveas event when save as button is clicked', () => {
        const toolbarComponent = createComponentUnderTest();

        return Promise.resolve().then(() => {
            const eventCallback = jest.fn();
            toolbarComponent.addEventListener(SaveFlowEvent.EVENT_NAME, eventCallback);
            getShadowRoot(toolbarComponent).querySelector(selectors.saveas).click();
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0].detail.type).toBe(SaveFlowEvent.Type.SAVE_AS);
        });
    });

    it('Displays "Saving..." in the toolbar when saveStatus is set to the same', () => {
        const toolbarComponent = createComponentUnderTest({
            saveStatus: LABELS.savingStatus
        });

        return Promise.resolve().then(() => {
            const lastSavedButton = getShadowRoot(toolbarComponent).querySelector(selectors.lastSave);
            const relativeDateTimeComponent = getShadowRoot(toolbarComponent).querySelector('lightning-relative-date-time');
            expect(lastSavedButton.textContent).toBe(LABELS.savingStatus);
            expect(relativeDateTimeComponent).toBeNull();
        });
    });

    it('Displays "Saved {relative time}" in the toolbar when saveStatus is set to "Saved"', () => {
        const currentDate = new Date();
        parseMetadataDateTime.mockReturnValueOnce({ date: currentDate });
        const toolbarComponent = createComponentUnderTest({
            lastModifiedDate: currentDate.toISOString(),
            saveStatus: LABELS.savedStatus
        });

        return Promise.resolve().then(() => {
            const lastSavedButton = getShadowRoot(toolbarComponent).querySelector(selectors.lastSave);
            const relativeDateTimeComponent = getShadowRoot(toolbarComponent).querySelector('lightning-relative-date-time');
            expect(lastSavedButton.textContent.trim()).toEqual(LABELS.savedStatus);
            expect(relativeDateTimeComponent).not.toBeNull();
            expect(relativeDateTimeComponent.value).toEqual(currentDate);
            expect(parseMetadataDateTime).toHaveBeenCalledWith(currentDate.toISOString(), true);
        });
    });
});
