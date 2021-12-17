// @ts-nocheck
import { getDefaultLayoutConfig } from 'builder_platform_interaction/autoLayoutCanvas';

const flowRenderInfo = {
    geometry: { x: 0, y: 0, w: 264, h: 144 },
    nodes: [
        {
            guid: 'eb01a710-d341-4ba0-81d2-f7ef03300db5',
            geometry: { x: 0, y: 0, w: 48, h: 144 },
            menuOpened: false,
            label: 'eb01a710-d341-4ba0-81d2-f7ef03300db5',
            metadata: {
                section: null,
                icon: 'utility:right',
                label: 'Start',
                value: 'START_ELEMENT',
                elementType: 'START_ELEMENT',
                type: 'start',
                canHaveFaultConnector: false
            },
            config: { isSelected: false, isHighlighted: false, canSelect: true },
            flows: [],
            isNew: false,
            logicConnectors: [],
            isTerminal: false,
            node: {},
            nextConnector: {
                geometry: { x: 0, y: 0, w: 6, h: 144 },
                addInfo: { offsetY: 72, menuOpened: false },
                source: {
                    guid: 'eb01a710-d341-4ba0-81d2-f7ef03300db5'
                },
                svgInfo: { geometry: { x: -3, y: 0, w: 6, h: 144 }, path: 'M 3, 24\nL 3, 144' },
                labelOffsetY: 24,
                type: 'straight'
            }
        },
        {
            guid: '837e0692-6f17-4d5c-ba5d-854851d31fcb',
            geometry: { x: 0, y: 144, w: 48, h: 0 },
            menuOpened: false,
            label: '837e0692-6f17-4d5c-ba5d-854851d31fcb',
            metadata: {
                section: 'Logic',
                icon: 'standard:first_non_empty',
                description: 'End Description',
                label: 'End',
                value: 'END_ELEMENT',
                elementType: 'END_ELEMENT',
                type: 'end',
                canHaveFaultConnector: false
            },
            config: { isSelected: false, isHighlighted: false, canSelect: true },
            flows: [],
            isNew: false,
            logicConnectors: [],
            isTerminal: true
        }
    ],
    isTerminal: true,
    layoutConfig: getDefaultLayoutConfig()
};

const flowModel = {
    'eb01a710-d341-4ba0-81d2-f7ef03300db5': {
        guid: 'eb01a710-d341-4ba0-81d2-f7ef03300db5',
        description: '',
        next: '837e0692-6f17-4d5c-ba5d-854851d31f99',
        prev: null,
        locationX: 50,
        locationY: 50,
        isCanvasElement: true,
        connectorCount: 0,
        config: { isSelected: false, isHighlighted: false, canSelect: true },
        elementType: 'START_ELEMENT',
        maxConnections: 1,
        triggerType: 'None',
        filterType: 'all',
        object: '',
        objectIndex: '7b70630f-6fb3-44a4-a5ac-095f55f7a007',
        filters: [
            {
                rowIndex: '423543d4-dbc7-46eb-9266-0be65fb4fde8',
                leftHandSide: '',
                rightHandSide: '',
                rightHandSideDataType: '',
                operator: ''
            }
        ],
        parent: 'root',
        childIndex: 0,
        isTerminal: false
    },
    root: {
        elementType: 'root',
        guid: 'root',
        label: 'root',
        value: 'root',
        text: 'root',
        name: 'root',
        prev: null,
        next: null,
        children: ['eb01a710-d341-4ba0-81d2-f7ef03300db5']
    },
    '837e0692-6f17-4d5c-ba5d-854851d31fcb': {
        guid: '837e0692-6f17-4d5c-ba5d-854851d31fcb',
        name: 'END_ELEMENT',
        description: '',
        next: null,
        prev: 'eb01a710-d341-4ba0-81d2-f7ef03300db5',
        label: null,
        locationX: 0,
        locationY: 0,
        isCanvasElement: true,
        connectorCount: 0,
        config: { isSelected: false, isHighlighted: false, canSelect: true },
        elementType: 'END_ELEMENT',
        value: 'END_ELEMENT',
        text: 'END_ELEMENT'
    },
    '837e0692-6f17-4d5c-ba5d-854851d31f99': {
        guid: '837e0692-6f17-4d5c-ba5d-854851d31f99',
        name: 'ORCHESTRATED_STAGE',
        childReferences: [
            { childReference: '369e5cef-f661-460a-a0ae-ab2ed95fed03' },
            { childReference: 'f509c9e4-32a6-47cb-aa7a-9b02fe3c9715' }
        ],
        description: '',
        next: '1c397973-762d-443f-9780-2b9777b6d6a3',
        prev: '837e0692-6f17-4d5c-ba5d-854851d31fcb',
        label: null,
        locationX: 0,
        locationY: 0,
        isCanvasElement: true,
        connectorCount: 0,
        config: { isSelected: false, isHighlighted: false, canSelect: true },
        elementType: 'orchestratedstage',
        value: 'orchestratedstage',
        text: 'orchestratedstage'
    },
    '369e5cef-f661-460a-a0ae-ab2ed95fed03': {
        guid: '369e5cef-f661-460a-a0ae-ab2ed95fed03',
        name: 'STAGE_STEP',
        elementType: 'STAGE_STEP',
        dataType: 'STAGE_STEP',
        label: 'Step 1 of Stage 1'
    },
    'f509c9e4-32a6-47cb-aa7a-9b02fe3c9715': {
        guid: 'f509c9e4-32a6-47cb-aa7a-9b02fe3c9715',
        name: 'STAGE_STEP_2',
        elementType: 'STAGE_STEP',
        dataType: 'STAGE_STEP',
        label: 'Step 2 of Stage 1'
    },
    '1c397973-762d-443f-9780-2b9777b6d6a3': {
        availableConnections: [],
        childReferences: [
            { childReference: 'ab8019d9-98fd-445e-9726-a08f6ec545f2' },
            { childReference: '58263090-23c4-4531-b670-ef13fa3412c0' }
        ],
        children: ['4b54cd8b-6bba-407b-a02b-c2129290162e', null, null],
        config: { isSelected: false, isHighlighted: false, isSelectable: true, hasError: false },
        connectorCount: 3,
        defaultConnectorLabel: 'Default Outcome',
        description: '',
        elementType: 'Decision',
        guid: '1c397973-762d-443f-9780-2b9777b6d6a3',
        incomingGoTo: [],
        isCanvasElement: true,
        label: 'd1',
        locationX: 0,
        locationY: 0,
        maxConnections: 3,
        name: 'd1',
        next: '4b54cd8b-6bba-407b-a02b-c2129290162e',
        nodeType: 'branch',
        prev: '993322be-f3a9-4f14-94ba-1f7876a3bc5d'
    },
    '4b54cd8b-6bba-407b-a02b-c2129290162e': {
        availableConnections: [],
        childReferences: [
            { childReference: 'f1b4e6eb-b13d-4db4-b89b-6ed0213e9449' },
            { childReference: '4a5eb4ef-b35c-47f3-ae22-aa5d59ae2ac1' }
        ],
        children: [
            'fc08cac6-a5e3-4a0c-8c5e-c19c450fcfae',
            'fb4c2394-d6fb-4d0a-8d79-69ee3d4f1706',
            '4abdffa3-0ae6-4ea9-bdbc-a1dd6402b629'
        ],
        config: { isSelected: false, isHighlighted: false, isSelectable: true, hasError: false },
        connectorCount: 3,
        defaultConnectorLabel: 'Default Outcome',
        description: '',
        elementType: 'Decision',
        guid: '4b54cd8b-6bba-407b-a02b-c2129290162e',
        incomingGoTo: [],
        isCanvasElement: true,
        label: 'd2',
        locationX: 0,
        locationY: 0,
        maxConnections: 3,
        name: 'd2',
        next: null,
        nodeType: 'branch',
        parent: '1c397973-762d-443f-9780-2b9777b6d6a3',
        prev: null,
        isTerminal: true
    },
    '993322be-f3a9-4f14-94ba-1f7876a3bc5d': {
        allowBack: true,
        allowFinish: true,
        allowPause: true,
        childReferences: [],
        config: { isSelected: false, isHighlighted: false, isSelectable: true, hasError: false },
        connectorCount: 1,
        description: '',
        elementType: 'Screen',
        guid: '993322be-f3a9-4f14-94ba-1f7876a3bc5d',
        helpText: '',
        incomingGoTo: [],
        isCanvasElement: true,
        label: 's1',
        locationX: 0,
        locationY: 0,
        maxConnections: 1,
        name: 's1',
        next: '1a58efd4-a3fc-414d-9b51-589fa2bede7a',
        nodeType: 'default',
        pausedText: '',
        prev: '1c397973-762d-443f-9780-2b9777b6d6a3',
        showFooter: true,
        showHeader: true
    },
    '4a5eb4ef-b35c-47f3-ae22-aa5d59ae2ac1': {
        conditionLogic: 'and',
        conditions: [],
        dataType: 'Boolean',
        doesRequireRecordChangedToMeetCriteria: false,
        elementType: 'OUTCOME',
        guid: '4a5eb4ef-b35c-47f3-ae22-aa5d59ae2ac1',
        label: 'o4',
        name: 'o4'
    },
    '58263090-23c4-4531-b670-ef13fa3412c0': {
        conditionLogic: 'and',
        conditions: [],
        dataType: 'Boolean',
        doesRequireRecordChangedToMeetCriteria: false,
        elementType: 'OUTCOME',
        guid: '58263090-23c4-4531-b670-ef13fa3412c0',
        label: 'o2',
        name: 'o2'
    },
    'ab8019d9-98fd-445e-9726-a08f6ec545f2': {
        conditionLogic: 'and',
        conditions: [],
        dataType: 'Boolean',
        doesRequireRecordChangedToMeetCriteria: false,
        elementType: 'OUTCOME',
        guid: 'ab8019d9-98fd-445e-9726-a08f6ec545f2',
        label: 'o1',
        name: 'o1'
    },
    'f1b4e6eb-b13d-4db4-b89b-6ed0213e9449': {
        conditionLogic: 'and',
        conditions: [],
        dataType: 'Boolean',
        doesRequireRecordChangedToMeetCriteria: false,
        elementType: 'OUTCOME',
        guid: 'f1b4e6eb-b13d-4db4-b89b-6ed0213e9449',
        label: 'o3',
        name: 'o3'
    },
    '1a58efd4-a3fc-414d-9b51-589fa2bede7a': {
        config: { isSelected: false, isHighlighted: false, isSelectable: true, hasError: false },
        connectorCount: 0,
        description: '',
        elementType: 'END_ELEMENT',
        guid: '1a58efd4-a3fc-414d-9b51-589fa2bede7a',
        isCanvasElement: true,
        label: 'End',
        locationX: 0,
        locationY: 0,
        name: 'END_ELEMENT',
        nodeType: 'end',
        prev: '993322be-f3a9-4f14-94ba-1f7876a3bc5d',
        text: 'END_ELEMENT',
        value: 'END_ELEMENT'
    },
    '9731c397-443f-9780-762d-d6a32b9777b6': {
        availableConnections: [],
        childReferences: [{ childReference: 'a1dd6402b629-4abdffa3-0ae6-4ea9-bdbc' }],
        children: ['a1dd6402b629-4abdffa3-0ae6-4ea9-bdbc', null, null],
        config: { isSelected: false, isHighlighted: false, isSelectable: true, hasError: false },
        connectorCount: 3,
        defaultConnectorLabel: 'Default Outcome',
        description: '',
        elementType: 'Decision',
        guid: '9731c397-443f-9780-762d-d6a32b9777b6',
        incomingGoTo: [],
        isCanvasElement: true,
        label: 'd3',
        locationX: 0,
        locationY: 0,
        maxConnections: 3,
        name: 'd3',
        next: 'a1dd6402b629-4abdffa3-0ae6-4ea9-bdbc',
        nodeType: 'branch',
        prev: '1a58efd4-a3fc-414d-9b51-589fa2bede7a'
    },
    'a1dd6402b629-4abdffa3-0ae6-4ea9-bdbc': {
        childIndex: 0,
        config: { isSelected: false, isHighlighted: false, isSelectable: true, hasError: false },
        connectorCount: 0,
        description: '',
        elementType: 'END_ELEMENT',
        guid: 'a1dd6402b629-4abdffa3-0ae6-4ea9-bdbc',
        isCanvasElement: true,
        isTerminal: true,
        label: 'End',
        locationX: 0,
        locationY: 0,
        name: 'END_ELEMENT',
        nodeType: 'end',
        parent: '9731c397-443f-9780-762d-d6a32b9777b6',
        prev: null,
        text: 'END_ELEMENT',
        value: 'END_ELEMENT'
    },
    '4abdffa3-0ae6-4ea9-bdbc-a1dd6402b629': {
        childIndex: 2,
        config: { isSelected: false, isHighlighted: false, isSelectable: true, hasError: false },
        connectorCount: 0,
        description: '',
        elementType: 'END_ELEMENT',
        guid: '4abdffa3-0ae6-4ea9-bdbc-a1dd6402b629',
        isCanvasElement: true,
        isTerminal: true,
        label: 'End',
        locationX: 0,
        locationY: 0,
        name: 'END_ELEMENT',
        nodeType: 'end',
        parent: '4b54cd8b-6bba-407b-a02b-c2129290162e',
        prev: null,
        text: 'END_ELEMENT',
        value: 'END_ELEMENT'
    },
    'fb4c2394-d6fb-4d0a-8d79-69ee3d4f1706': {
        childIndex: 1,
        config: { isSelected: false, isHighlighted: false, isSelectable: true, hasError: false },
        connectorCount: 0,
        description: '',
        elementType: 'END_ELEMENT',
        guid: 'fb4c2394-d6fb-4d0a-8d79-69ee3d4f1706',
        isCanvasElement: true,
        isTerminal: true,
        label: 'End',
        locationX: 0,
        locationY: 0,
        name: 'END_ELEMENT',
        nodeType: 'end',
        parent: '4b54cd8b-6bba-407b-a02b-c2129290162e',
        prev: null,
        text: 'END_ELEMENT',
        value: 'END_ELEMENT'
    },
    'fc08cac6-a5e3-4a0c-8c5e-c19c450fcfae': {
        childIndex: 0,
        config: { isSelected: false, isHighlighted: false, isSelectable: true, hasError: false },
        connectorCount: 0,
        description: '',
        elementType: 'END_ELEMENT',
        guid: 'fc08cac6-a5e3-4a0c-8c5e-c19c450fcfae',
        isCanvasElement: true,
        isTerminal: true,
        label: 'End',
        locationX: 0,
        locationY: 0,
        name: 'END_ELEMENT',
        nodeType: 'end',
        parent: '4b54cd8b-6bba-407b-a02b-c2129290162e',
        prev: null,
        text: 'END_ELEMENT',
        value: 'END_ELEMENT'
    },
    'screen-one': {
        allowBack: true,
        allowFinish: true,
        allowPause: true,
        childReferences: [],
        config: { isSelected: false, isHighlighted: false, isSelectable: true, hasError: false },
        connectorCount: 1,
        description: '',
        elementType: 'Screen',
        guid: 'screen-one',
        helpText: '',
        incomingGoTo: ['decision', 'decision:default'],
        isCanvasElement: true,
        label: 'screen-one',
        locationX: 0,
        locationY: 0,
        maxConnections: 1,
        name: 'screen-one',
        next: 'decision',
        nodeType: 'default',
        pausedText: '',
        prev: null,
        showFooter: true,
        showHeader: true,
        parent: 'root'
    },
    decision: {
        availableConnections: [],
        childReferences: [{ childReference: 'o1' }, { childReference: 'o2' }],
        children: [null, 'screen-two', 'screen-one'],
        config: { isSelected: false, isHighlighted: false, isSelectable: true, hasError: false },
        connectorCount: 3,
        defaultConnectorLabel: 'Default Outcome',
        description: '',
        elementType: 'Decision',
        guid: 'decision',
        incomingGoTo: [],
        isCanvasElement: true,
        label: 'decision',
        locationX: 0,
        locationY: 0,
        maxConnections: 3,
        name: 'decision',
        next: 'screen-one',
        nodeType: 'branch',
        prev: 'screen-one'
    },
    'screen-two': {
        allowBack: true,
        allowFinish: true,
        allowPause: true,
        childReferences: [],
        config: { isSelected: false, isHighlighted: false, isSelectable: true, hasError: false },
        connectorCount: 1,
        description: '',
        elementType: 'Screen',
        guid: 'screen-two',
        helpText: '',
        incomingGoTo: [],
        isCanvasElement: true,
        label: 'screen-two',
        locationX: 0,
        locationY: 0,
        maxConnections: 1,
        name: 'screen-two',
        next: null,
        nodeType: 'default',
        pausedText: '',
        prev: null,
        parent: 'decision',
        childIndex: 1,
        isTerminal: false,
        showFooter: true,
        showHeader: true
    }
};

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
        supportsMenu: true,
        isSupported: true,
        dynamicNodeComponent: 'builder_platform_interaction/orchestratedStageNode'
    }
];

const nodeLayoutMap = {
    'root:0': {
        prevLayout: { x: 0, y: 0, w: 0, h: 0, joinOffsetY: 0, offsetX: 0 },
        layout: { x: 0, y: 0, w: 264, h: 144, joinOffsetY: 0, offsetX: 88 }
    },
    'eb01a710-d341-4ba0-81d2-f7ef03300db5': { layout: { w: 264, h: 144, y: 0, x: 0, joinOffsetY: 0, offsetX: 88 } },
    '837e0692-6f17-4d5c-ba5d-854851d31fcb': { layout: { w: 264, h: 0, y: 144, x: 0, joinOffsetY: 0, offsetX: 88 } }
};

export { flowRenderInfo, flowModel, elementsMetadata, nodeLayoutMap };