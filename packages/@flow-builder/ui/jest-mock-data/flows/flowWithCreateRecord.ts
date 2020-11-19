// @ts-nocheck
export const flowWithCreateRecordUsingSObject = {
    createdById: '005xx000001X7i5AAC',
    createdDate: '2019-01-08T14:25:42.000+0000',
    definitionId: '300xx000000bnobAAA',
    fieldsToNull: [],
    fullName: 'flowCreateRecordWithSObject',
    id: '301xx000003GZHfAAO',
    lastModifiedBy: { fieldsToNull: Array(0), name: 'User User' },
    lastModifiedById: '005xx000001X7i5AAC',
    lastModifiedDate: '2019-01-08T14:25:44.000+0000',
    manageableState: 'unmanaged',
    masterLabel: 'flowCreateRecordWithSObject',
    metadata: {
        start: {
            locationX: 50,
            locationY: 45,
            connector: {
                targetReference: 'Create_Record_Using_SObject'
            },
            doesRequireRecordChangedToMeetCriteria: false,
            filters: []
        },
        variables: [
            {
                name: 'vAccount',
                description: '',
                objectType: 'Account',
                dataType: 'SObject',
                isCollection: false,
                isInput: false,
                isOutput: false,
                scale: 0
            }
        ],
        recordCreates: [
            {
                name: 'Create_Record_Using_SObject',
                description: 'Create account record in sobject mode',
                label: 'Create Record Using SObject',
                locationX: 474,
                locationY: 50,
                inputReference: 'vAccount'
            }
        ],
        description: '',
        interviewLabel: 'flowCreateRecordWithSObject {!$Flow.CurrentDateTime}',
        isTemplate: false,
        label: 'flowCreateRecordWithSObject',
        processMetadataValues: [
            {
                name: 'BuilderType',
                value: {
                    stringValue: 'LightningFlowBuilder'
                }
            },
            {
                name: 'OriginBuilderType',
                value: {
                    stringValue: 'LightningFlowBuilder'
                }
            },
            {
                name: 'CanvasMode',
                value: {
                    stringValue: 'FREE_FORM_CANVAS'
                }
            }
        ],
        processType: 'AutoLaunchedFlow',
        runInMode: null,
        status: 'Draft'
    },
    processType: 'AutoLaunchedFlow',
    status: 'Draft',
    versionNumber: 1
};

export const flowWithCreateRecordUsingSObjectCollection = {
    createdById: '005xx000001X7i5AAC',
    createdDate: '2019-01-09T09:41:06.000+0000',
    definitionId: '300xx000000bnqDAAQ',
    fieldsToNull: [],
    fullName: 'Flow_Create_Record_Using_SObject_Collection',
    id: '301xx000003GZJHAA4',
    lastModifiedBy: { fieldsToNull: Array(0), name: 'User User' },
    lastModifiedById: '005xx000001X7i5AAC',
    lastModifiedDate: '2019-01-09T09:41:08.000+0000',
    manageableState: 'unmanaged',
    masterLabel: 'Flow Create Record Using SObject Collection',
    metadata: {
        start: {
            locationX: 56,
            locationY: 73,
            connector: {
                targetReference: 'Create_Record_Using_SObject_Collection'
            },
            doesRequireRecordChangedToMeetCriteria: false,
            filters: []
        },
        variables: [
            {
                name: 'vAccounts',
                description: '',
                objectType: 'Account',
                dataType: 'SObject',
                isCollection: true,
                isInput: false,
                isOutput: false,
                scale: 0
            }
        ],
        recordCreates: [
            {
                name: 'Create_Record_Using_SObject_Collection',
                description: 'Create account records in sobject mode',
                label: 'Create Record Using SObject Collection',
                locationX: 523,
                locationY: 200,
                inputReference: 'vAccounts'
            }
        ],
        description: '',
        interviewLabel: 'Flow Create Record Using SObject Collection {!$Flow.CurrentDateTime}',
        isTemplate: false,
        label: 'Flow Create Record Using SObject Collection',
        processMetadataValues: [
            {
                name: 'BuilderType',
                value: {
                    stringValue: 'LightningFlowBuilder'
                }
            },
            {
                name: 'OriginBuilderType',
                value: {
                    stringValue: 'LightningFlowBuilder'
                }
            },
            {
                name: 'CanvasMode',
                value: {
                    stringValue: 'FREE_FORM_CANVAS'
                }
            }
        ],
        processType: 'AutoLaunchedFlow',
        runInMode: null,
        status: 'Draft'
    },
    processType: 'AutoLaunchedFlow',
    status: 'Draft',
    versionNumber: 1
};

// FIXME this cannot be updated
export const flowWithCreateRecordUsingFields = {
    createdById: '005xx000001X7i5AAC',
    createdDate: '2019-01-09T10:48:20.000+0000',
    definitionId: '300xx000000bnrpAAA',
    fieldsToNull: [],
    fullName: 'flowWithCreateRecordUsingFields',
    id: '301xx000003GZKtAAO',
    lastModifiedBy: { fieldsToNull: Array(0), name: 'User User' },
    lastModifiedById: '005xx000001X7i5AAC',
    lastModifiedDate: '2019-01-09T10:48:23.000+0000',
    manageableState: 'unmanaged',
    masterLabel: 'flowWithCreateRecordUsingFields',
    metadata: {
        actionCalls: [],
        apexPluginCalls: [],
        assignments: [],
        choices: [],
        constants: [],
        decisions: [],
        dynamicChoiceSets: [],
        formulas: [],
        interviewLabel: 'flowWithCreateRecordUsingFields {!$Flow.CurrentDateTime}',
        isTemplate: false,
        label: 'flowWithCreateRecordUsingFields',
        loops: [],
        processMetadataValues: [
            {
                name: 'BuilderType',
                value: { stringValue: 'LightningFlowBuilder' }
            },
            {
                name: 'OriginBuilderType',
                value: { stringValue: 'LightningFlowBuilder' }
            }
        ],
        recordCreates: [
            {
                assignRecordIdToReference: 'vNewAccountId',
                inputAssignments: [
                    {
                        field: 'BillingCity',
                        processMetadataValues: [],
                        value: { elementReference: 'vBillingCity' }
                    },
                    {
                        field: 'Name',
                        processMetadataValues: [],
                        value: { elementReference: 'vName' }
                    }
                ],
                description: 'Create account record in fields mode',
                label: 'Create Record using Fields',
                locationX: 498,
                locationY: 89,
                name: 'Create_Record_using_Fields',
                object: 'Account',
                processMetadataValues: [],
                storeOutputAutomatically: false
            }
        ],
        recordDeletes: [],
        recordLookups: [],
        recordUpdates: [],
        screens: [],
        stages: [],
        startElementReference: 'Create_Record_using_Fields',
        status: 'Draft',
        steps: [],
        subflows: [],
        textTemplates: [],
        variables: [
            {
                dataType: 'String',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'vBillingCity',
                processMetadataValues: [],
                scale: 0,
                value: { stringValue: 'San Francisco' }
            },
            {
                dataType: 'String',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'vName',
                processMetadataValues: [],
                scale: 0,
                value: { stringValue: 'my Account' }
            },
            {
                dataType: 'String',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'vNewAccountId',
                processMetadataValues: [],
                scale: 0
            }
        ],
        waits: []
    },
    processType: 'AutoLaunchedFlow',
    status: 'Draft',
    versionNumber: 1
};

// FIXME same
export const flowWithCreateRecordAutomatedOutput = {
    createdById: '005xx000001X7i5AAC',
    createdDate: '2019-01-09T10:48:20.000+0000',
    definitionId: '300RM0000000AT0YAM',
    fieldsToNull: [],
    fullName: 'flowWithCreateRecordAutomatedOutput',
    id: '301RM0000000E6iYAE',
    lastModifiedBy: { fieldsToNull: Array(0), name: 'User User' },
    lastModifiedById: '005xx000001X7i5AAC',
    lastModifiedDate: '2019-01-09T10:48:23.000+0000',
    manageableState: 'unmanaged',
    masterLabel: 'flowWithCreateRecordAutomatedOutput',
    metadata: {
        actionCalls: [],
        apexPluginCalls: [],
        assignments: [
            {
                assignmentItems: [
                    {
                        assignToReference: '$Flow.CurrentStage',
                        operator: 'Assign',
                        processMetadataValues: [],
                        value: {
                            elementReference: '$Flow.CurrentDate'
                        }
                    }
                ],
                label: 'assignment',
                locationX: 551,
                locationY: 131,
                name: 'assignment',
                processMetadataValues: []
            }
        ],
        choices: [],
        constants: [],
        decisions: [],
        dynamicChoiceSets: [],
        formulas: [],
        interviewLabel: 'flowWithCreateRecordAutomatedOutput {!$Flow.CurrentDateTime}',
        isTemplate: false,
        label: 'flowWithCreateRecordAutomatedOutput',
        loops: [],
        processMetadataValues: [
            {
                name: 'BuilderType',
                value: { stringValue: 'LightningFlowBuilder' }
            },
            {
                name: 'OriginBuilderType',
                value: { stringValue: 'LightningFlowBuilder' }
            }
        ],
        recordCreates: [
            {
                inputAssignments: [
                    {
                        field: 'BillingCity',
                        processMetadataValues: [],
                        value: { elementReference: 'vBillingCity' }
                    },
                    {
                        field: 'Name',
                        processMetadataValues: [],
                        value: { elementReference: 'vName' }
                    }
                ],
                description: 'Create account record in automatic output mode',
                label: 'Create Record in automatic output mode',
                locationX: 498,
                locationY: 89,
                name: 'Create_Record_in_automatic_output_mode',
                object: 'Account',
                processMetadataValues: [],
                storeOutputAutomatically: true
            }
        ],
        recordDeletes: [],
        recordLookups: [],
        recordUpdates: [],
        screens: [],
        stages: [],
        startElementReference: 'Create_Record_using_Fields',
        status: 'Draft',
        steps: [],
        subflows: [],
        textTemplates: [],
        variables: [
            {
                dataType: 'String',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'vBillingCity',
                processMetadataValues: [],
                scale: 0,
                value: { stringValue: 'San Francisco' }
            },
            {
                dataType: 'String',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'vName',
                processMetadataValues: [],
                scale: 0,
                value: { stringValue: 'my Account' }
            },
            {
                dataType: 'String',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'vNewAccountId',
                processMetadataValues: [],
                scale: 0
            }
        ],
        waits: []
    },
    processType: 'AutoLaunchedFlow',
    status: 'Draft',
    versionNumber: 1
};
