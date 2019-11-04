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
        actionCalls: [],
        apexPluginCalls: [],
        assignments: [],
        choices: [],
        constants: [],
        decisions: [],
        dynamicChoiceSets: [],
        formulas: [],
        interviewLabel: 'flowCreateRecordWithSObject {!$Flow.CurrentDateTime}',
        isTemplate: false,
        label: 'flowCreateRecordWithSObject',
        loops: [],
        processType: 'AutoLaunchedFlow',
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
                inputAssignments: [],
                inputReference: 'vAccount',
                label: 'Create Record Using SObject',
                description: 'Create account record in sobject mode',
                locationX: 474,
                locationY: 50,
                name: 'Create_Record_Using_SObject',
                processMetadataValues: [],
                storeOutputAutomatically: false
            }
        ],
        recordDeletes: [],
        recordLookups: [],
        recordUpdates: [],
        screens: [],
        stages: [],
        startElementReference: 'Create_Record_Using_SObject',
        status: 'Draft',
        steps: [],
        subflows: [],
        textTemplates: [],
        variables: [
            {
                dataType: 'SObject',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'vAccount',
                objectType: 'Account',
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
        actionCalls: [],
        apexPluginCalls: [],
        assignments: [],
        choices: [],
        constants: [],
        decisions: [],
        dynamicChoiceSets: [],
        formulas: [],
        interviewLabel:
            'Flow Create Record Using SObject Collection {!$Flow.CurrentDateTime}',
        isTemplate: false,
        label: 'Flow Create Record Using SObject Collection',
        loops: [],
        processType: 'AutoLaunchedFlow',
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
                inputAssignments: [],
                inputReference: 'vAccounts',
                description: 'Create account records in sobject mode',
                label: 'Create Record Using SObject Collection',
                locationX: 523,
                locationY: 200,
                name: 'Create_Record_Using_SObject_Collection',
                processMetadataValues: [],
                storeOutputAutomatically: false
            }
        ],
        recordDeletes: [],
        recordLookups: [],
        recordUpdates: [],
        screens: [],
        stages: [],
        startElementReference: 'Create_Record_Using_SObject_Collection',
        status: 'Draft',
        steps: [],
        subflows: [],
        textTemplates: [],
        variables: [
            {
                dataType: 'SObject',
                isCollection: true,
                isInput: false,
                isOutput: false,
                name: 'vAccounts',
                objectType: 'Account',
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
        interviewLabel:
            'flowWithCreateRecordUsingFields {!$Flow.CurrentDateTime}',
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
