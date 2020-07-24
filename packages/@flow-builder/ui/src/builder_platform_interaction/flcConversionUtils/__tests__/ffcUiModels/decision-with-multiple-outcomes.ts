export default {
    connectors: [
        {
            guid: 'start-element-guid -> decision-element-guid',
            source: 'start-element-guid',
            target: 'decision-element-guid',
            label: null,
            type: 'REGULAR',
            config: { isSelected: false }
        }
    ],
    elements: {
        'start-element-guid': {
            guid: 'start-element-guid',
            description: '',
            locationX: 362,
            locationY: 48,
            isCanvasElement: true,
            connectorCount: 1,
            elementType: 'START_ELEMENT',
            maxConnections: 1,
            triggerType: 'None',
            filterType: 'all',
            object: '',
            objectIndex: '2832cafc-39fc-41bf-95b1-c6d3881f6705',
            filters: [
                {
                    rowIndex: 'e7f9f0cf-3953-43b3-a578-3ddc8a10e4df',
                    leftHandSide: '',
                    rightHandSide: '',
                    rightHandSideDataType: '',
                    operator: ''
                }
            ]
        },
        'decision-element-guid': {
            guid: 'decision-element-guid',
            name: 'd1',
            description: '',
            label: 'd1',
            locationX: 488,
            locationY: 206,
            isCanvasElement: true,
            connectorCount: 0,
            defaultConnectorLabel: 'Default Outcome',
            elementType: 'Decision',
            maxConnections: 4,
            childReferences: [
                { childReference: 'outcome1-element-guid' },
                { childReference: 'outcome2-element-guid' },
                { childReference: 'outcome3-element-guid' }
            ],
            availableConnections: [
                { type: 'REGULAR', childReference: 'outcome1-element-guid' },
                { type: 'REGULAR', childReference: 'outcome2-element-guid' },
                { type: 'REGULAR', childReference: 'outcome3-element-guid' },
                { type: 'DEFAULT' }
            ]
        },
        'outcome1-element-guid': {
            guid: 'outcome1-element-guid',
            name: 'outcome1',
            label: 'outcome1',
            elementType: 'OUTCOME',
            dataType: 'Boolean',
            conditionLogic: 'and',
            conditions: [
                {
                    rowIndex: 'cbf949b8-cb9c-4f36-931f-1b128912360d',
                    leftHandSide: '$Flow.CurrentRecord',
                    rightHandSide: 'a',
                    rightHandSideDataType: 'String',
                    operator: 'EqualTo'
                }
            ]
        },
        'outcome2-element-guid': {
            guid: 'outcome2-element-guid',
            name: 'outcome2',
            label: 'outcome2',
            elementType: 'OUTCOME',
            dataType: 'Boolean',
            conditionLogic: 'and',
            conditions: [
                {
                    rowIndex: 'cbf949b8-cb9c-4f36-931f-1b128912360d',
                    leftHandSide: '$Flow.CurrentRecord',
                    rightHandSide: 'a',
                    rightHandSideDataType: 'String',
                    operator: 'EqualTo'
                }
            ]
        },
        'outcome3-element-guid': {
            guid: 'outcome3-element-guid',
            name: 'outcome3',
            label: 'outcome3',
            elementType: 'OUTCOME',
            dataType: 'Boolean',
            conditionLogic: 'and',
            conditions: [
                {
                    rowIndex: 'cbf949b8-cb9c-4f36-931f-1b128912360d',
                    leftHandSide: '$Flow.CurrentRecord',
                    rightHandSide: 'a',
                    rightHandSideDataType: 'String',
                    operator: 'EqualTo'
                }
            ]
        }
    },
    canvasElements: ['decision-element-guid', 'start-element-guid']
};
