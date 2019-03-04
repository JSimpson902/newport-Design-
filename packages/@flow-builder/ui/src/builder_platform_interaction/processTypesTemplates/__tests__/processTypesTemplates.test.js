import { createElement } from 'lwc';
import { getShadowRoot } from 'lwc-test-utils';
import ProcessTypesTemplates from 'builder_platform_interaction/processTypesTemplates';
import { TemplateChangedEvent } from 'builder_platform_interaction/events';
import { ALL_PROCESS_TYPE } from 'builder_platform_interaction/processTypeLib';

const autoTemplate = {
    masterLabel: 'Autolaunched template',
    activeVersionId: '301xx000003Gblb',
    latestVersionId: null,
    processType: 'AutoLaunchedFlow',
    description: 'This is an autolaunched template',
};
const screenTemplate1 = {
    masterLabel: 'Screen template',
    activeVersionId: '301xx000005Abdh',
    latestVersionId: null,
    processType: 'Flow',
    description: 'This is a screen template',
};
const screenTemplate2 = {
    masterLabel: 'Screen template 2',
    activeVersionId: null,
    latestVersionId: '301xx000008jhgn',
    processType: 'Flow',
    description: 'This is a screen template 2',
};

const mockTemplates = [autoTemplate, screenTemplate1, screenTemplate2];

const mockTemplatesPromise = Promise.resolve(mockTemplates);

jest.mock('builder_platform_interaction/serverDataLib', () => {
    const actual = require.requireActual('../../serverDataLib/serverDataLib.js');
    const SERVER_ACTION_TYPE = actual.SERVER_ACTION_TYPE;
    return {
        SERVER_ACTION_TYPE,
        fetchOnce : (serverActionType) => {
            switch (serverActionType) {
            case SERVER_ACTION_TYPE.GET_TEMPLATES:
                return mockTemplatesPromise;
            default:
                return Promise.reject();
            }
        }
    };
});

jest.mock('builder_platform_interaction/systemLib', () => {
    return {
        getProcessTypes: jest.fn().mockImplementation(() => {
            return require('mock/processTypesData').MOCK_ALL_PROCESS_TYPES;
        }),
    };
});

const commonUtils = require.requireActual('../../commonUtils/commonUtils.js');
commonUtils.format = jest.fn().mockImplementation((formatString, ...args) => formatString + '(' + args.toString() + ')');

function createComponentForTest({ processType = ALL_PROCESS_TYPE.name } = {}) {
    const el = createElement('builder_platform_interaction-process-types-templates', { is: ProcessTypesTemplates });
    Object.assign(el, {processType});
    document.body.appendChild(el);
    return el;
}

const SELECTORS = {
    FEATURED_SECTION: '.featured',
    TEMPLATES_SECTION: '.templates',
    VISUAL_PICKER_LIST: 'builder_platform_interaction-visual-picker-list',
    VISUAL_PICKER_ITEM: 'builder_platform_interaction-visual-picker-item',
    CHECKBOX: 'input[type="checkbox"]',
};

const getVisualPickerList = (processTypeTemplates, section) => {
    const featuredSection = getShadowRoot(processTypeTemplates).querySelector(section);
    return featuredSection.querySelector(SELECTORS.VISUAL_PICKER_LIST);
};

const getTemplates = (processTypeTemplates, section) => {
    const visualPickerList = getVisualPickerList(processTypeTemplates, section);
    return visualPickerList.items;
};

const getVisualPickerItems = (visualPickerList) => {
    return getShadowRoot(visualPickerList).querySelectorAll(SELECTORS.VISUAL_PICKER_ITEM);
};

const getCheckbox = (visualPickerItem) => {
    return getShadowRoot(visualPickerItem).querySelector(SELECTORS.CHECKBOX);
};

const getChangedEvent = () => {
    return new Event('change');
};

describe('process-type-templates', () => {
    let processTypeTemplates;
    beforeEach(() => {
        processTypeTemplates = createComponentForTest();
    });

    it('shows 2 process type tiles: one screen and one autolaunched', () => {
        const processTypeTiles = getTemplates(processTypeTemplates, SELECTORS.FEATURED_SECTION);
        expect(processTypeTiles).toHaveLength(2);
        expect(processTypeTiles).toEqual([{"description": "FlowBuilderProcessTypeTemplates.newFlowDescription", "iconName": "utility:desktop", "isSelected": true, "itemId": "Flow", "label": "FlowBuilderProcessTypeTemplates.newFlowTitle"},
            {"description": "FlowBuilderProcessTypeTemplates.newAutolaunchedFlowDescription", "iconName": "utility:magicwand", "isSelected": false, "itemId": "AutoLaunchedFlow", "label": "FlowBuilderProcessTypeTemplates.newAutolaunchedFlowTitle"}]);
    });

    it('shows 3 templates: two screens and one autolaunched', () => {
        const templates = getTemplates(processTypeTemplates, SELECTORS.TEMPLATES_SECTION);
        expect(templates).toHaveLength(3);
        expect(templates).toEqual([{"description": autoTemplate.description, "iconName": "utility:magicwand", "isSelected": false, "itemId": autoTemplate.activeVersionId, "label": autoTemplate.masterLabel},
            {"description": screenTemplate1.description, "iconName": "utility:desktop", "isSelected": false, "itemId": screenTemplate1.activeVersionId, "label": screenTemplate1.masterLabel},
            {"description": screenTemplate2.description, "iconName": "utility:desktop", "isSelected": false, "itemId": screenTemplate2.latestVersionId, "label": screenTemplate2.masterLabel}]);
    });

    it('selects template should uncheck the process type tile', async () => {
        const screenProcessTypeTile = getTemplates(processTypeTemplates, SELECTORS.FEATURED_SECTION)[0];
        expect(screenProcessTypeTile.isSelected).toBe(true);
        const visualPickerList = getVisualPickerList(processTypeTemplates, SELECTORS.TEMPLATES_SECTION);
        const template = getVisualPickerItems(visualPickerList)[0];
        const checkbox = getCheckbox(template);
        checkbox.checked = true;
        checkbox.dispatchEvent(getChangedEvent());
        await Promise.resolve();
        expect(screenProcessTypeTile.isSelected).toBe(false);
    });

    it('selects the same template should keep this template checked', async () => {
        const visualPickerList = getVisualPickerList(processTypeTemplates, SELECTORS.FEATURED_SECTION);
        const screenProcessTypeTile = getVisualPickerItems(visualPickerList)[0];
        const checkbox = getCheckbox(screenProcessTypeTile);
        checkbox.checked = false;
        checkbox.dispatchEvent(getChangedEvent());
        await Promise.resolve();
        expect(screenProcessTypeTile.isSelected).toBe(true);
    });

    it('should fire TemplateChangedEvent when checking the template', async () => {
        const eventCallback = jest.fn();
        processTypeTemplates.addEventListener(TemplateChangedEvent.EVENT_NAME, eventCallback);
        const visualPickerList = getVisualPickerList(processTypeTemplates, SELECTORS.TEMPLATES_SECTION);
        const template = getVisualPickerItems(visualPickerList)[0];
        const checkbox = getCheckbox(template);
        checkbox.checked = true;
        checkbox.dispatchEvent(getChangedEvent());
        await Promise.resolve();
        expect(eventCallback).toHaveBeenCalled();
        expect(eventCallback.mock.calls[0][0].detail).toEqual({id: template.itemId, isProcessType: false});
    });
});