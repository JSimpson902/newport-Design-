// @ts-nocheck
import { configureMenu } from '../alcConnectorMenuConfig';
import { ICON_SHAPE } from 'builder_platform_interaction/alcComponentsUtils';
import { LABELS } from '../alcConnectorMenuLabels';

jest.mock('builder_platform_interaction/sharedUtils', () => {
    return {
        storeUtils: {
            generateGuid: jest.fn(() => 1)
        }
    };
});

const metaData = [
    {
        section: 'Interaction',
        type: 'default',
        icon: 'standard:screen',
        label: 'Screen',
        value: 'Screen',
        elementType: 'Screen',
        description: 'Collect information from',
        isSupported: true
    },
    {
        section: 'Logic',
        type: 'branch',
        icon: 'standard:decision',
        iconShape: ICON_SHAPE.DIAMOND,
        label: 'Decision',
        value: 'Decision',
        elementType: 'Decision',
        description: 'Create Decision',
        isSupported: true
    },
    {
        section: 'Logic',
        type: 'end',
        icon: 'utility:stop',
        iconBackgroundColor: 'background-red',
        iconShape: ICON_SHAPE.CIRCLE,
        label: 'End',
        value: 'End',
        elementType: 'End',
        description: 'Create End',
        isSupported: true
    }
];

describe('connector menu config', () => {
    it('Match Snapshot with both paste and goto option', () => {
        expect(configureMenu(metaData, false, true, true, false)).toMatchSnapshot();
    });

    it('actionSection should have the right label', () => {
        expect(configureMenu(metaData, false, true, false, false).sections[0].label).toBe(LABELS.actionSectionLabel);
    });

    it('pasteItem should have the right label', () => {
        expect(configureMenu(metaData, false, true, false, false).sections[0].items[0].label).toBe(
            LABELS.pasteItemLabel
        );
    });

    it('pasteSection item should have the right icon', () => {
        expect(configureMenu(metaData, false, true, false, false).sections[0].items[0].icon).toBe('utility:paste');
    });

    it('pasteSection item should have the right rowClass', () => {
        expect(configureMenu(metaData, false, true, false, false).sections[0].items[0].rowClass).toBe(
            'slds-listbox__item action-row-line-height'
        );
    });

    it('goToPath should have the right label', () => {
        expect(configureMenu(metaData, false, true, true, false).sections[0].items[0].label).toBe(
            `${LABELS.goToPathItemLabel} (WIP)`
        );
    });

    it('goToPath item should have the right icon', () => {
        expect(configureMenu(metaData, false, true, true, false).sections[0].items[0].icon).toBe('utility:level_down');
    });

    it('goToPath item should have the right rowClass', () => {
        expect(configureMenu(metaData, false, true, true, false).sections[0].items[0].rowClass).toBe(
            'slds-listbox__item action-row-line-height'
        );
    });

    it('reRoute/delete should be displayed and GoTo should not', () => {
        const menu = configureMenu(metaData, false, true, false, true);
        expect(menu.sections[0].items[0].label).toBe(LABELS.reRouteGoToPathItemLabel);
        expect(menu.sections[0].items[1].label).toBe(LABELS.deleteGoToPathItemLabel);
        expect(menu.sections[0].items[2].label).toBe(LABELS.pasteItemLabel);
    });

    it('reRoutePath item should have the right icon', () => {
        expect(configureMenu(metaData, false, true, false, true).sections[0].items[0].icon).toBe('utility:level_down');
    });

    it('reRoutePath item should have the right rowClass', () => {
        expect(configureMenu(metaData, false, true, false, true).sections[0].items[0].rowClass).toBe(
            'slds-listbox__item action-row-line-height'
        );
    });

    it('deletePath item should have the right icon', () => {
        expect(configureMenu(metaData, false, true, false, true).sections[0].items[1].icon).toBe('utility:delete');
    });

    it('deletePath item should have the right rowClass', () => {
        expect(configureMenu(metaData, false, true, false, true).sections[0].items[1].rowClass).toBe(
            'slds-listbox__item action-row-line-height'
        );
    });
});
