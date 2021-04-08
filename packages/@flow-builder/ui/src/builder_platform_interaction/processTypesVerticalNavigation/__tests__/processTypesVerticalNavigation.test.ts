// @ts-nocheck
import { createElement } from 'lwc';
import ProcessTypesVerticalNavigation from '../processTypesVerticalNavigation';
import { ALL_PROCESS_TYPE, getProcessTypeIcon } from 'builder_platform_interaction/processTypeLib';
import { FLOW_PROCESS_TYPE } from 'builder_platform_interaction/flowMetadata';
import { ProcessTypeSelectedEvent } from 'builder_platform_interaction/events';
import { setDocumentBodyChildren } from 'builder_platform_interaction/builderTestUtils';
import { processTypes as baseProcessType } from 'serverData/GetProcessTypes/processTypes.json';

const mostProcessTypes = [
    ...baseProcessType,
    {
        label: 'Checkout Flow',
        name: FLOW_PROCESS_TYPE.CHECKOUT_FLOW
    },
    {
        label: 'Routing Flow',
        name: FLOW_PROCESS_TYPE.ROUTING_FLOW
    },
    {
        label: 'Well no icon yet',
        name: 'WeDoNotKnowYou'
    }
];

const createComponentUnderTest = (processTypes = mostProcessTypes) => {
    const el = createElement('builder_platform_interaction-process-types-vertical-navigation', {
        is: ProcessTypesVerticalNavigation
    });
    Object.assign(el, { processTypes });
    setDocumentBodyChildren(el);
    return el;
};

const SELECTORS = {
    VERTICAL_NAVIGATION_ITEM_ICON: 'lightning-vertical-navigation-item-icon',
    VERTICAL_NAVIGATION_ITEM_ICON_ANCHOR: 'a'
};

const getAllVerticalNavigationItemIcons = (processTypesVerticalNavigation) =>
    processTypesVerticalNavigation.shadowRoot.querySelectorAll(SELECTORS.VERTICAL_NAVIGATION_ITEM_ICON);

const describeSkip = describe.skip;
// see W-9112510
describeSkip('process-types-vertical-navigation ', () => {
    let processTypesVerticalNavigation;
    beforeEach(() => {
        processTypesVerticalNavigation = createComponentUnderTest();
    });
    describe('Process types details', () => {
        test('by default "all" entry selected', () => {
            expect(processTypesVerticalNavigation.selectedProcessType).toBe(ALL_PROCESS_TYPE.name);
        });

        test('number of process types', () => {
            expect(processTypesVerticalNavigation.items).toHaveLength(mostProcessTypes.length + 1); // 'ALL' entry included
        });

        test('"All" entry in first place (among process types) (API)', () => {
            expect(processTypesVerticalNavigation.items[0]).toMatchObject({
                name: ALL_PROCESS_TYPE.name
            });
        });

        test('details of "featured" process types ("all" included) (API)', () => {
            expect(processTypesVerticalNavigation.items).toEqual([
                {
                    label: 'FlowBuilderProcessTypesVerticalNavigation.all',
                    name: ALL_PROCESS_TYPE.name,
                    iconName: getProcessTypeIcon(ALL_PROCESS_TYPE.name)
                },
                {
                    label: 'Screen Flow',
                    name: FLOW_PROCESS_TYPE.FLOW,
                    iconName: getProcessTypeIcon(FLOW_PROCESS_TYPE.FLOW)
                },
                {
                    label: 'Autolaunched Flow',
                    name: FLOW_PROCESS_TYPE.AUTO_LAUNCHED_FLOW,
                    iconName: getProcessTypeIcon(FLOW_PROCESS_TYPE.AUTO_LAUNCHED_FLOW)
                },
                {
                    label: 'Checkout Flow',
                    name: FLOW_PROCESS_TYPE.CHECKOUT_FLOW,
                    iconName: getProcessTypeIcon(FLOW_PROCESS_TYPE.CHECKOUT_FLOW)
                },
                {
                    label: 'Contact Request Flow',
                    name: FLOW_PROCESS_TYPE.CONTACT_REQUEST_FLOW,
                    iconName: getProcessTypeIcon(FLOW_PROCESS_TYPE.CONTACT_REQUEST_FLOW)
                },
                {
                    label: 'Embedded Appointment Management Flow',
                    name: FLOW_PROCESS_TYPE.FIELD_SERVICE_WEB,
                    iconName: getProcessTypeIcon(FLOW_PROCESS_TYPE.FIELD_SERVICE_WEB)
                },
                {
                    label: 'Field Service Mobile Flow',
                    name: FLOW_PROCESS_TYPE.FIELD_SERVICE_MOBILE,
                    iconName: getProcessTypeIcon(FLOW_PROCESS_TYPE.FIELD_SERVICE_MOBILE)
                },
                {
                    label: 'Routing Flow',
                    name: FLOW_PROCESS_TYPE.ROUTING_FLOW,
                    iconName: getProcessTypeIcon(FLOW_PROCESS_TYPE.ROUTING_FLOW)
                },
                {
                    label: 'User Provisioning Flow',
                    name: FLOW_PROCESS_TYPE.USER_PROVISIONING_FLOW,
                    iconName: getProcessTypeIcon(FLOW_PROCESS_TYPE.USER_PROVISIONING_FLOW)
                },
                {
                    label: 'Well no icon yet',
                    name: 'WeDoNotKnowYou',
                    iconName: getProcessTypeIcon('WeDoNotKnowYou')
                }
            ]);
        });

        test('process types name', () => {
            const processTypesVerticalNavigationItemIcons = getAllVerticalNavigationItemIcons(
                processTypesVerticalNavigation
            );
            const joinedProcessTypesNames = Array.from(processTypesVerticalNavigationItemIcons)
                .map((itemIcon) => {
                    return itemIcon.name;
                })
                .join('');
            expect(joinedProcessTypesNames).toBe(
                ALL_PROCESS_TYPE.name +
                    FLOW_PROCESS_TYPE.FLOW +
                    FLOW_PROCESS_TYPE.AUTO_LAUNCHED_FLOW +
                    FLOW_PROCESS_TYPE.CHECKOUT_FLOW +
                    FLOW_PROCESS_TYPE.CONTACT_REQUEST_FLOW +
                    FLOW_PROCESS_TYPE.FIELD_SERVICE_WEB +
                    FLOW_PROCESS_TYPE.FIELD_SERVICE_MOBILE +
                    FLOW_PROCESS_TYPE.ROUTING_FLOW +
                    FLOW_PROCESS_TYPE.USER_PROVISIONING_FLOW +
                    'WeDoNotKnowYou'
            );
        });

        test('process types icon name', () => {
            const processTypesVerticalNavigationItemIcons = getAllVerticalNavigationItemIcons(
                processTypesVerticalNavigation
            );
            const actualIconNames = Array.from(processTypesVerticalNavigationItemIcons).map(
                (itemIcon) => itemIcon.iconName
            );
            expect(actualIconNames).toEqual([
                'utility:flow',
                'utility:desktop',
                'utility:magicwand',
                'utility:cart',
                'utility:contact_request',
                'utility:insert_tag_field',
                'utility:phone_portrait',
                'utility:omni_channel',
                'utility:user',
                'utility:flow'
            ]);
        });
    });

    describe('Events', () => {
        test('should fire "ProcessTypeSelectedEvent" when selecting a process type with process type name', async () => {
            const eventCallback = jest.fn();
            processTypesVerticalNavigation.addEventListener(ProcessTypeSelectedEvent.EVENT_NAME, eventCallback);
            const processTypesVerticalNavigationItemIcon = getAllVerticalNavigationItemIcons(
                processTypesVerticalNavigation
            )[1];

            processTypesVerticalNavigationItemIcon.dispatchEvent(
                new CustomEvent('select', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        name: processTypesVerticalNavigationItemIcon.name
                    }
                })
            );
            await Promise.resolve();
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0].detail).toEqual({
                name: processTypesVerticalNavigationItemIcon.name
            });
        });
    });
});
