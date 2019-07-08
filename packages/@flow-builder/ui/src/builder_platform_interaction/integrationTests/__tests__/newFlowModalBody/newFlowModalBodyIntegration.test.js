import { createElement } from 'lwc';
import NewFlowModalBody from 'builder_platform_interaction/newFlowModalBody';
import { FLOW_PROCESS_TYPE } from 'builder_platform_interaction/flowMetadata';
import { resolveRenderCycles } from '../../resolveRenderCycles';
import {
    setAuraFetch,
    resetFetchOnceCache
} from 'builder_platform_interaction/serverDataLib';
import { auraFetch } from '../../integrationTestUtils';
import { MOCK_RAW_PROCESS_TYPES } from 'mock/processTypesData';
import { MOCK_RAW_TEMPLATE_LIST } from 'mock/templates';
import {
    ALL_PROCESS_TYPE,
    resetCacheTemplates
} from 'builder_platform_interaction/processTypeLib';

const SELECTORS = {
    ERROR_MESSAGE: '.errorMessage .slds-notify__content',
    FEATURED_SECTION: '.featured',
    GET_TEMPLATES_TILE: 'builder_platform_interaction-get-templates-tile',
    PROCESS_TYPES_NAVIGATION:
        'builder_platform_interaction-process-types-vertical-navigation',
    PROCESS_TYPES_TEMPLATES:
        'builder_platform_interaction-process-types-templates',
    TEMPLATES_SECTION: '.templates',
    VISUAL_PICKER_ITEM: 'builder_platform_interaction-visual-picker-item',
    VISUAL_PICKER_LIST: 'builder_platform_interaction-visual-picker-list'
};

const getProcessTypesNavigationItems = modalBody => {
    const processTypeNavigation = modalBody.shadowRoot.querySelector(
        SELECTORS.PROCESS_TYPES_NAVIGATION
    );
    const verticalNavigation = processTypeNavigation.shadowRoot.querySelector(
        'lightning-vertical-navigation'
    );
    return verticalNavigation.querySelectorAll(
        'lightning-vertical-navigation-item-icon'
    );
};

const getProcessTypeLink = (processTypesNavigationItems, processType) => {
    const searchedNode = [...processTypesNavigationItems].find(
        processTypeNode => processTypeNode.name === processType
    );
    return searchedNode.shadowRoot.querySelector('a');
};

const getProcessTypesTemplates = modalBody =>
    modalBody.shadowRoot.querySelector(SELECTORS.PROCESS_TYPES_TEMPLATES);

const getTemplateList = (processTypeTemplates, section) =>
    processTypeTemplates.shadowRoot
        .querySelector(section)
        .querySelector(SELECTORS.VISUAL_PICKER_LIST);

const getTemplateItems = templatesList =>
    templatesList.shadowRoot.querySelectorAll(SELECTORS.VISUAL_PICKER_ITEM);

const getExploreFlowTemplateTile = processTypeTemplates =>
    processTypeTemplates.shadowRoot
        .querySelector(SELECTORS.TEMPLATES_SECTION)
        .querySelector(SELECTORS.GET_TEMPLATES_TILE);

const createComponentForTest = () => {
    const el = createElement(
        'builder_platform_interaction-new-Flow-modal-body',
        { is: NewFlowModalBody }
    );
    document.body.appendChild(el);
    return el;
};

const getTemplateItemTitle = templateItem =>
    templateItem.shadowRoot.querySelector('h2').title;

describe('new Flow Modal Body', () => {
    let newFlowModalBody;
    describe('with existing templates', () => {
        beforeAll(() => {
            setAuraFetch(
                auraFetch({
                    'c.getProcessTypes': () => ({
                        data: {
                            processTypes: JSON.stringify(MOCK_RAW_PROCESS_TYPES)
                        }
                    }),
                    'c.getTemplates': () => ({ data: MOCK_RAW_TEMPLATE_LIST })
                })
            );
        });
        beforeEach(() => {
            newFlowModalBody = createComponentForTest();
        });
        afterAll(() => {
            setAuraFetch();
            resetFetchOnceCache();
            resetCacheTemplates();
        });
        describe('Process Types', () => {
            it('should have "all" select by default', () => {
                return resolveRenderCycles(() => {
                    expect(newFlowModalBody.selectedProcessType).toBe('all');
                });
            });
            it('should shows the correct number of process types in navigation', () => {
                const processTypesNavigationItems = getProcessTypesNavigationItems(
                    newFlowModalBody
                );
                expect(processTypesNavigationItems).toHaveLength(
                    MOCK_RAW_PROCESS_TYPES.length + 1
                );
            });
            it('should shows the correct number of templates in navigation', () => {
                return resolveRenderCycles(() => {
                    const processTypesTemplates = getProcessTypesTemplates(
                        newFlowModalBody
                    );
                    const templatesTiles = getTemplateList(
                        processTypesTemplates,
                        SELECTORS.TEMPLATES_SECTION
                    );
                    const templateItems = getTemplateItems(templatesTiles);
                    expect(templateItems).toHaveLength(
                        MOCK_RAW_TEMPLATE_LIST.length
                    );
                });
            });
            describe('select a Process Type', () => {
                it('should only display autolaunched flow templates', async () => {
                    const processTypesNavigationItems = getProcessTypesNavigationItems(
                        newFlowModalBody
                    );
                    getProcessTypeLink(
                        processTypesNavigationItems,
                        FLOW_PROCESS_TYPE.AUTO_LAUNCHED_FLOW
                    ).click();
                    await Promise.resolve();
                    const processTypesTemplates = getProcessTypesTemplates(
                        newFlowModalBody
                    );
                    const templateList = getTemplateList(
                        processTypesTemplates,
                        SELECTORS.TEMPLATES_SECTION
                    );
                    const templateItems = getTemplateItems(templateList);
                    expect(templateItems).toHaveLength(2);
                    expect(getTemplateItemTitle(templateItems[0])).toBe(
                        'myFlowTemplateGetAccount'
                    );
                    expect(getTemplateItemTitle(templateItems[1])).toBe(
                        'myAutoLaunchedFlow'
                    );
                });
                it('should only display screen flow templates', async () => {
                    const processTypesNavigationItems = getProcessTypesNavigationItems(
                        newFlowModalBody
                    );
                    getProcessTypeLink(
                        processTypesNavigationItems,
                        FLOW_PROCESS_TYPE.FLOW
                    ).click();
                    await Promise.resolve();
                    const processTypesTemplates = getProcessTypesTemplates(
                        newFlowModalBody
                    );
                    const templateList = getTemplateList(
                        processTypesTemplates,
                        SELECTORS.TEMPLATES_SECTION
                    );
                    const templateItems = getTemplateItems(templateList);
                    expect(templateItems).toHaveLength(2);
                    expect(getTemplateItemTitle(templateItems[0])).toBe(
                        'myScreenFlowTemplateGetAccount'
                    );
                    expect(getTemplateItemTitle(templateItems[1])).toBe(
                        'screenFlowAddAccount'
                    );
                });
            });
        });
    });
    describe('without templates', () => {
        beforeAll(() => {
            setAuraFetch(
                auraFetch({
                    'c.getProcessTypes': () => ({
                        data: {
                            processTypes: JSON.stringify(MOCK_RAW_PROCESS_TYPES)
                        }
                    }),
                    'c.getTemplates': () => ({ data: [] })
                })
            );
        });
        beforeEach(() => {
            newFlowModalBody = createComponentForTest();
        });
        afterAll(() => {
            setAuraFetch();
            resetFetchOnceCache();
            resetCacheTemplates();
        });
        it('should display the process types templates', () => {
            return resolveRenderCycles(() => {
                const processTypesTemplates = getProcessTypesTemplates(
                    newFlowModalBody
                );
                expect(processTypesTemplates.processType).toEqual(
                    ALL_PROCESS_TYPE.name
                );
            });
        });
        it('should display the get template tile', () => {
            return resolveRenderCycles(() => {
                const processTypesTemplates = getProcessTypesTemplates(
                    newFlowModalBody
                );
                const exploreFlowTemplate = getExploreFlowTemplateTile(
                    processTypesTemplates
                );
                expect(exploreFlowTemplate).not.toBeNull();
                const templatesTiles = getTemplateList(
                    processTypesTemplates,
                    SELECTORS.TEMPLATES_SECTION
                );
                expect(templatesTiles).toBeNull();
            });
        });
    });
});
