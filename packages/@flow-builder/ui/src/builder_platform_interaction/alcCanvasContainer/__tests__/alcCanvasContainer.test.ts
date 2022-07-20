// @ts-nocheck
import { AutoLayoutCanvasMode } from 'builder_platform_interaction/alcComponentsUtils';
import { createComponent, ticks } from 'builder_platform_interaction/builderTestUtils';
import { getChildElementTypesWithOverridenProperties } from 'builder_platform_interaction/elementConfig';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { Store } from 'builder_platform_interaction/storeLib';
import { augmentElementsMetadata } from '../alcCanvasContainerUtils';

jest.mock('builder_platform_interaction/alcCanvas', () => require('builder_platform_interaction_mocks/alcCanvas'));
jest.mock('builder_platform_interaction/sharedUtils', () => require('builder_platform_interaction_mocks/sharedUtils'));
jest.mock('builder_platform_interaction/storeLib');

const elementsMetadata = [
    {
        section: 'Interaction',
        type: 'default',
        icon: 'standard:screen',
        label: 'Screen',
        value: 'Screen',
        elementType: 'Screen',
        description: 'Collect information from users who run the flow or show them some information.',
        canHaveFaultConnector: false
    },
    {
        section: 'Interaction',
        type: 'default',
        icon: 'standard:lightning_component',
        label: 'New Action',
        value: 'ActionCall',
        elementType: 'ActionCall',
        description:
            'Perform an action outside of the flow. Choose from your org’s custom create and update actions or an out-of-the-box action, like Post to Chatter or Submit for Approval.',
        canHaveFaultConnector: true
    },
    {
        section: 'Flow Control',
        type: 'branch',
        icon: 'standard:decision',
        label: 'Decision',
        value: 'Decision',
        elementType: 'Decision',
        description: 'Create paths for the flow to take based on conditions you set.',
        canHaveFaultConnector: false
    },
    {
        section: 'Flow Control',
        type: 'branch',
        icon: 'standard:waits',
        label: 'Pause',
        value: 'Wait',
        elementType: 'Wait',
        description:
            'Pause the flow. Resume the flow when the org receives a platform event message or a specified day, date, or time occurs.',
        canHaveFaultConnector: true
    },
    {
        section: 'Data Operation',
        type: 'default',
        icon: 'standard:record_create',
        label: 'RecordCreate',
        value: 'RecordCreate',
        elementType: 'RecordCreate',
        description: 'Create Salesforce records using values from the flow.',
        canHaveFaultConnector: true
    },
    {
        section: 'Data Operation',
        type: 'default',
        icon: 'standard:record_update',
        label: 'RecordUpdate',
        value: 'RecordUpdate',
        elementType: 'RecordUpdate',
        description: 'Find Salesforce records, and store their field values to use later in the flow.',
        canHaveFaultConnector: true
    },
    {
        section: 'Data Operation',
        type: 'default',
        icon: 'standard:record_lookup',
        label: 'RecordQuery',
        value: 'RecordQuery',
        elementType: 'RecordQuery',
        description: 'Update Salesforce records using values from the flow.',
        canHaveFaultConnector: true
    },
    {
        section: 'Data Operation',
        type: 'default',
        icon: 'standard:record_delete',
        label: 'RecordDelete',
        value: 'RecordDelete',
        elementType: 'RecordDelete',
        description: 'Delete Salesforce records.',
        canHaveFaultConnector: true
    },
    {
        section: null,
        icon: 'utility:right',
        label: 'Start',
        value: 'START_ELEMENT',
        elementType: 'START_ELEMENT',
        type: 'start',
        canHaveFaultConnector: false
    },
    {
        section: null,
        icon: '',
        label: '',
        elementType: 'root',
        value: 'root',
        type: 'root',
        canHaveFaultConnector: false
    },
    {
        section: 'Logic',
        icon: 'standard:first_non_empty',
        description: 'End Description',
        label: 'End',
        value: 'END_ELEMENT',
        elementType: 'END_ELEMENT',
        type: 'end',
        canHaveFaultConnector: false
    },
    {
        section: 'Interaction',
        type: 'orchestratedstage',
        icon: 'standard:screen',
        label: 'orchestratedStage',
        value: 'orchestratedstage',
        elementType: 'orchestratedstage',
        description: 'stepped stage desc',
        canHaveFaultConnector: false,

        dynamicNodeComponent: 'builder_platform_interaction/orchestratedStageNode'
    }
];

const elementSubflow = [
    {
        section: 'Interaction',
        type: 'default',
        icon: 'standard:custom_notification',
        label: 'Subflow',
        value: 'Subflow',
        elementType: 'Subflow',
        description: 'Run subflow inside a flow.'
    }
];

const standardInvocableActions = [
    {
        isStandard: true,
        allowsTransactionControl: false,
        iconName: null,
        name: 'chatterPost',
        description: 'Post to the feed for a specific record, user, or Chatter group.',
        configurationEditor: null,
        label: 'Post to Chatter',
        type: 'chatterPost',
        category: 'Messaging',
        genericTypes: [],
        durableId: 'chatterPost-chatterPost'
    }
];

const dynamicInvocableActions = [
    {
        isStandard: false,
        allowsTransactionControl: true,
        iconName: 'resource:/resource/1653591244000/customsvg#top',
        name: 'CustomSVGIconAction',
        description: 'Test Action with Static Resource',
        configurationEditor: null,
        label: 'Action with Static Resource Icon',
        type: 'apex',
        category: 'Static',
        genericTypes: [],
        durableId: 'apex-CustomSVGIconAction'
    },
    {
        isStandard: false,
        allowsTransactionControl: true,
        iconName: 'slds:standard:feed',
        name: 'ActionWithSldsIcon',
        description: 'Test Action with Slds Icon',
        configurationEditor: null,
        label: 'Action with Slds Icon',
        type: 'apex',
        category: 'SLDS',
        genericTypes: [],
        durableId: 'apex-ActionWithSldsIcon'
    }
];

const subflows = [
    {
        isViewable: true,
        masterLabel: 'Display Records Flow',
        activeVersionId: 'Display_Records_Flow1',
        latestVersionId: 'Display_Records_Flow1',
        fullName: 'Display_Records_Flow'
    }
];

const startElement = {
    elementType: 'START_ELEMENT'
};
const createComponentForTest = async (optionsOverrides = {}, includeSubflows: boolean) => {
    return includeSubflows
        ? createComponent(
              'builder_platform_interaction-alc-canvas-container',
              {
                  elementsMetadata: elementsMetadata.concat(elementSubflow),
                  isMenuDataLoading: false,
                  autolayoutCanvasMode: AutoLayoutCanvasMode.DEFAULT,
                  numPasteElementsAvailable: 0,
                  standardInvocableActions,
                  dynamicInvocableActions,
                  subflows
              },
              optionsOverrides
          )
        : createComponent(
              'builder_platform_interaction-alc-canvas-container',
              {
                  elementsMetadata,
                  isMenuDataLoading: false,
                  autolayoutCanvasMode: AutoLayoutCanvasMode.DEFAULT,
                  numPasteElementsAvailable: 0,
                  standardInvocableActions,
                  dynamicInvocableActions,
                  subflows
              },
              optionsOverrides
          );
};

describe('alc canvas container', () => {
    let cmp;

    beforeAll(() => {
        Store.getStore.mockImplementation(() => {
            return {
                getCurrentState: jest.fn(() => {
                    return {
                        elements: {
                            startGuid: startElement,
                            root: { elementType: ELEMENT_TYPE.ROOT_ELEMENT }
                        },
                        properties: { processType: 'autolaunched', isAutoLayoutCanvas: true }
                    };
                }),
                subscribe: jest.fn(() => jest.fn()),
                unsubscribe: jest.fn()
            };
        });
    });

    const getBuilderContainerElement = () =>
        cmp.shadowRoot.querySelector('builder_platform_interaction-alc-canvas-container');

    const getAlcCanvas = () => cmp.shadowRoot.querySelector('builder_platform_interaction-alc-canvas');

    it('renders the component', async () => {
        cmp = await createComponentForTest({}, true);
        expect(getBuilderContainerElement).not.toBeNull();
    });

    it('offsets when in selection mode', async () => {
        cmp = await createComponentForTest({}, true);
        expect(getAlcCanvas().offsets).toEqual([0, 58]);

        cmp.autolayoutCanvasMode = AutoLayoutCanvasMode.SELECTION;
        cmp.showLeftPanel = true;
        await ticks(1);
        expect(getAlcCanvas().offsets).toEqual([320, 58]);
    });

    it('intializes augmented metadata types correctly', async () => {
        cmp = await createComponentForTest({}, true);
        const elementTypes = cmp.elementsMetadata.map((element) => {
            return element.elementType;
        });
        const expectedElementTypeArray = [
            ELEMENT_TYPE.END_ELEMENT,
            ELEMENT_TYPE.ROOT_ELEMENT,
            ELEMENT_TYPE.START_ELEMENT
        ].concat(getChildElementTypesWithOverridenProperties());

        expect(elementTypes).toEqual(expect.arrayContaining(expectedElementTypeArray));
    });

    it('can have a fault connector for record update', async () => {
        cmp = await createComponentForTest({}, true);
        const elementsMetadata = cmp.elementsMetadata.filter(
            (element) => element.elementType === ELEMENT_TYPE.RECORD_UPDATE
        );
        expect(elementsMetadata.length).toBe(1);
        expect(elementsMetadata[0].canHaveFaultConnector).toBe(true);
    });

    it('generates the correct connector menu metadata ', async () => {
        cmp = await createComponentForTest({}, true);
        const expectedElementTypes = new Set([
            'Screen',
            'ActionCall',
            'Decision',
            'Wait',
            'RecordCreate',
            'RecordUpdate',
            'RecordQuery',
            'RecordDelete',
            'START_ELEMENT',
            'root',
            'END_ELEMENT',
            'orchestratedstage',
            'EMAIL_ALERT',
            'APEX_CALL',
            'ApexPlugin',
            'EXTERNAL_SERVICE',
            'Subflow'
        ]);
        const expectedMenuItems = [
            {
                guid: 'random_guid',
                description: 'Post to the feed for a specific record, user, or Chatter group.',
                label: 'Post to Chatter',
                elementType: ELEMENT_TYPE.ACTION_CALL,
                actionType: 'chatterPost',
                actionName: 'chatterPost',
                actionIsStandard: true,
                icon: 'standard:custom_notification',
                iconSrc: undefined,
                iconContainerClass: 'slds-media__figure slds-listbox__option-icon',
                iconClass: 'background-navy',
                iconSize: 'small',
                iconVariant: '',
                rowClass: 'slds-listbox__item',
                elementSubtype: null,
                tooltip: 'Post to Chatter: Post to the feed for a specific record, user, or Chatter group.',
                flowName: undefined
            },
            {
                guid: 'random_guid',
                description: 'Test Action with Static Resource',
                label: 'Action with Static Resource Icon',
                elementType: ELEMENT_TYPE.ACTION_CALL,
                actionType: 'apex',
                actionName: 'CustomSVGIconAction',
                actionIsStandard: false,
                icon: null,
                iconSrc: '/resource/1653591244000/customsvg#top',
                iconContainerClass: 'slds-media__figure slds-listbox__option-icon',
                iconClass: undefined,
                iconSize: 'small',
                iconVariant: '',
                rowClass: 'slds-listbox__item',
                elementSubtype: null,
                tooltip: 'Action with Static Resource Icon: Test Action with Static Resource',
                flowName: undefined
            },
            {
                guid: 'random_guid',
                description: 'Test Action with Slds Icon',
                label: 'Action with Slds Icon',
                elementType: ELEMENT_TYPE.ACTION_CALL,
                actionType: 'apex',
                actionName: 'ActionWithSldsIcon',
                actionIsStandard: false,
                icon: 'standard:feed',
                iconSrc: null,
                iconContainerClass: 'slds-media__figure slds-listbox__option-icon',
                iconClass: undefined,
                iconSize: 'small',
                iconVariant: '',
                rowClass: 'slds-listbox__item',
                elementSubtype: null,
                tooltip: 'Action with Slds Icon: Test Action with Slds Icon',
                flowName: undefined
            },
            {
                guid: 'random_guid',
                description: undefined,
                label: 'Display Records Flow',
                elementType: ELEMENT_TYPE.SUBFLOW,
                actionType: undefined,
                actionName: undefined,
                actionIsStandard: undefined,
                icon: 'standard:flow',
                iconSrc: undefined,
                iconContainerClass: 'slds-media__figure slds-listbox__option-icon',
                iconClass: 'background-navy',
                iconSize: 'small',
                iconVariant: '',
                rowClass: 'slds-listbox__item',
                elementSubtype: null,
                tooltip: 'Display Records Flow',
                flowName: 'Display_Records_Flow'
            }
        ];
        const expectedIsLoading = false;

        const { menuComponent, elementTypes, isLoading, menuItems } = getAlcCanvas().connectorMenuMetadata;
        expect(menuComponent).toEqual('builder_platform_interaction/alcConnectorMenu');
        expect(elementTypes).toEqual(expectedElementTypes);
        expect(isLoading).toEqual(expectedIsLoading);
        expect(menuItems).toEqual(expectedMenuItems);
    });

    it('augments the metadata', async () => {
        cmp = await createComponentForTest({}, true);
        expect(augmentElementsMetadata(elementsMetadata, startElement)).toMatchSnapshot();
    });

    it('excludes subflows from results when process type does not support them', async () => {
        cmp = await createComponentForTest({}, false);
        const expectedElementTypes = new Set([
            'Screen',
            'ActionCall',
            'Decision',
            'Wait',
            'RecordCreate',
            'RecordUpdate',
            'RecordQuery',
            'RecordDelete',
            'START_ELEMENT',
            'root',
            'END_ELEMENT',
            'orchestratedstage',
            'EMAIL_ALERT',
            'APEX_CALL',
            'ApexPlugin',
            'EXTERNAL_SERVICE'
        ]);
        const expectedMenuItems = [
            {
                guid: 'random_guid',
                description: 'Post to the feed for a specific record, user, or Chatter group.',
                label: 'Post to Chatter',
                elementType: ELEMENT_TYPE.ACTION_CALL,
                actionType: 'chatterPost',
                actionName: 'chatterPost',
                actionIsStandard: true,
                icon: 'standard:custom_notification',
                iconSrc: undefined,
                iconContainerClass: 'slds-media__figure slds-listbox__option-icon',
                iconClass: 'background-navy',
                iconSize: 'small',
                iconVariant: '',
                rowClass: 'slds-listbox__item',
                elementSubtype: null,
                tooltip: 'Post to Chatter: Post to the feed for a specific record, user, or Chatter group.',
                flowName: undefined
            },
            {
                guid: 'random_guid',
                description: 'Test Action with Static Resource',
                label: 'Action with Static Resource Icon',
                elementType: ELEMENT_TYPE.ACTION_CALL,
                actionType: 'apex',
                actionName: 'CustomSVGIconAction',
                actionIsStandard: false,
                icon: null,
                iconSrc: '/resource/1653591244000/customsvg#top',
                iconContainerClass: 'slds-media__figure slds-listbox__option-icon',
                iconClass: undefined,
                iconSize: 'small',
                iconVariant: '',
                rowClass: 'slds-listbox__item',
                elementSubtype: null,
                tooltip: 'Action with Static Resource Icon: Test Action with Static Resource',
                flowName: undefined
            },
            {
                guid: 'random_guid',
                description: 'Test Action with Slds Icon',
                label: 'Action with Slds Icon',
                elementType: ELEMENT_TYPE.ACTION_CALL,
                actionType: 'apex',
                actionName: 'ActionWithSldsIcon',
                actionIsStandard: false,
                icon: 'standard:feed',
                iconSrc: null,
                iconContainerClass: 'slds-media__figure slds-listbox__option-icon',
                iconClass: undefined,
                iconSize: 'small',
                iconVariant: '',
                rowClass: 'slds-listbox__item',
                elementSubtype: null,
                tooltip: 'Action with Slds Icon: Test Action with Slds Icon',
                flowName: undefined
            }
        ];
        const expectedIsLoading = false;

        const { menuComponent, elementTypes, isLoading, menuItems } = getAlcCanvas().connectorMenuMetadata;
        expect(menuComponent).toEqual('builder_platform_interaction/alcConnectorMenu');
        expect(elementTypes).toEqual(expectedElementTypes);
        expect(isLoading).toEqual(expectedIsLoading);
        expect(menuItems).toEqual(expectedMenuItems);
    });
});

describe('before save flow', () => {
    let cmp;

    beforeAll(() => {
        Store.getStore.mockImplementation(() => {
            return {
                getCurrentState: jest.fn(() => {
                    return {
                        elements: { startGuid: { elementType: 'START_ELEMENT', triggerType: 'RecordBeforeSave' } },
                        properties: { processType: 'autolaunched' }
                    };
                }),
                subscribe: jest.fn(() => jest.fn()),
                unsubscribe: jest.fn()
            };
        });
    });

    beforeEach(async () => {
        cmp = await createComponentForTest();
    });

    it('cannot have a fault connector for record update', async () => {
        const elementsMetadata = cmp.elementsMetadata.filter(
            (element) => element.elementType === ELEMENT_TYPE.RECORD_UPDATE
        );
        expect(elementsMetadata.length).toBe(1);
        expect(elementsMetadata[0].canHaveFaultConnector).toBe(false);
    });
});
