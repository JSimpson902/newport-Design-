export const flowWithGetRecordUsingSObject = {
    createdById: '005xx000001X7i5AAC',
    createdDate: '2018-12-19T15:49:05.000+0000',
    definitionId: '300xx000000bnevAAA',
    fieldsToNull: [],
    fullName: 'Flow_Get_Record_Using_SObject',
    id: '301xx000003GZ7zAAG',
    lastModifiedBy: { fieldsToNull: Array(0), name: 'User User' },
    lastModifiedById: '005xx000001X7i5AAC',
    lastModifiedDate: '2018-12-19T15:49:09.000+0000',
    manageableState: 'unmanaged',
    masterLabel: 'Flow Get Record Using SObject',
    metadata: {
        actionCalls: [],
        apexPluginCalls: [],
        assignments: [],
        choices: [],
        constants: [],
        decisions: [],
        dynamicChoiceSets: [],
        formulas: [],
        interviewLabel: 'Flow Get Record Using SObject {!$Flow.CurrentDateTime}',
        isTemplate: false,
        label: 'Flow Get Record Using SObject',
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
        processType: 'AutoLaunchedFlow',
        recordCreates: [],
        recordDeletes: [],
        recordLookups: [
            {
                assignNullValuesIfNoRecordsFound: false,
                filters: [
                    {
                        field: 'BillingCity',
                        operator: 'EqualTo',
                        value: { stringValue: 'San Francisco' },
                        processMetadataValues: []
                    }
                ],
                label: 'get Record Using SObject',
                locationX: 440,
                locationY: 279,
                name: 'Get_Record_Using_SObject',
                object: 'Account',
                outputAssignments: [],
                outputReference: 'vAccount',
                processMetadataValues: [],
                queriedFields: ['Id', 'BillingCity'],
                sortField: 'AnnualRevenue',
                sortOrder: 'Asc'
            }
        ],
        recordUpdates: [],
        screens: [],
        stages: [],
        startElementReference: 'Get_Record_Using_SObject',
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
                processMetadataValues: []
            }
        ],
        waits: []
    },
    processType: 'AutoLaunchedFlow',
    status: 'Draft',
    versionNumber: 1
};

export const flowWithGetRecordUsingSObjectCollection = {
    createdById: '005xx000001X7i5AAC',
    createdDate: '2018-12-20T10:08:33.000+0000',
    definitionId: '300xx000000bngXAAQ',
    fieldsToNull: [],
    fullName: 'Flow_Get_Record_Using_SObject_Collection',
    id: '301xx000003GZ9bAAG',
    lastModifiedBy: { fieldsToNull: Array(0), name: 'User User' },
    lastModifiedById: '005xx000001X7i5AAC',
    lastModifiedDate: '2018-12-20T10:08:36.000+0000',
    manageableState: 'unmanaged',
    masterLabel: 'Flow Get Record Using SObject Collection',
    metadata: {
        actionCalls: [],
        apexPluginCalls: [],
        assignments: [],
        choices: [],
        constants: [],
        decisions: [],
        dynamicChoiceSets: [],
        formulas: [],
        interviewLabel: 'Flow Get Record Using SObject Collection {!$Flow.CurrentDateTime}',
        isTemplate: false,
        label: 'Flow Get Record Using SObject Collection',
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
        processType: 'AutoLaunchedFlow',
        recordCreates: [],
        recordDeletes: [],
        recordLookups: [
            {
                assignNullValuesIfNoRecordsFound: true,
                filters: [
                    {
                        field: 'BillingCity',
                        operator: 'NotEqualTo',
                        processMetadataValues: [],
                        value: { stringValue: 'San Francisco' }
                    }
                ],
                label: 'get Record Using SObject Collection',
                locationX: 468,
                locationY: 371,
                name: 'get_Record_Using_SObject_Collection',
                object: 'Account',
                outputAssignments: [],
                outputReference: 'vAccountCollection',
                processMetadataValues: [],
                queriedFields: ['Id', 'BillingCity', 'BillingAddress'],
                sortField: 'Name',
                sortOrder: 'Asc'
            }
        ],
        recordUpdates: [],
        screens: [],
        stages: [],
        startElementReference: 'get_Record_Using_SObject_Collection',
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
                name: 'vAccountCollection',
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

export const flowWithGetRecordUsingFields = {
    createdById: '005xx000001X7i5AAC',
    createdDate: '2018-12-20T11:58:30.000+0000',
    definitionId: '300xx000000bni9AAA',
    fieldsToNull: [],
    fullName: 'Flow_Get_Record_Using_Fields',
    id: '301xx000003GZBDAA4',
    lastModifiedBy: { fieldsToNull: Array(0), name: 'User User' },
    lastModifiedById: '005xx000001X7i5AAC',
    lastModifiedDate: '2018-12-20T11:58:32.000+0000',
    manageableState: 'unmanaged',
    masterLabel: 'Flow Get Record Using Fields',
    metadata: {
        actionCalls: [],
        apexPluginCalls: [],
        assignments: [],
        choices: [],
        constants: [],
        decisions: [],
        dynamicChoiceSets: [],
        formulas: [],
        interviewLabel: 'Flow Get Record Using Fields {!$Flow.CurrentDateTime}',
        isTemplate: false,
        label: 'Flow Get Record Using Fields',
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
        processType: 'AutoLaunchedFlow',
        recordCreates: [],
        recordDeletes: [],
        recordLookups: [
            {
                assignNullValuesIfNoRecordsFound: false,
                filters: [
                    {
                        field: 'BillingCity',
                        operator: 'EndsWith',
                        processMetadataValues: [],
                        value: { stringValue: 'Francisco' }
                    }
                ],
                label: 'get Record Using Fields',
                locationX: 680,
                locationY: 50,
                name: 'get_Record_Using_Fields',
                object: 'Account',
                outputAssignments: [
                    {
                        assignToReference: 'vBillingCity',
                        field: 'BillingCity',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'vName',
                        field: 'Name',
                        processMetadataValues: []
                    }
                ],
                processMetadataValues: [],
                queriedFields: [],
                sortField: 'AnnualRevenue',
                sortOrder: 'Asc'
            }
        ],
        recordUpdates: [],
        screens: [],
        stages: [],
        startElementReference: 'get_Record_Using_Fields',
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
                value: { stringValue: '' }
            },
            {
                dataType: 'String',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'vName',
                processMetadataValues: [],
                scale: 0,
                value: { stringValue: '' }
            }
        ],
        waits: []
    },
    processType: 'AutoLaunchedFlow',
    status: 'Draft',
    versionNumber: 1
};

export const flowWithGetRecordUsingSObjectSingleAutomatedOutput = {
    createdById: '005RM000001kjoRYAQ',
    createdDate: '2019-06-20T11:17:17.000+0000',
    definitionId: '300RM00000007oUYAQ',
    fieldsToNull: [],
    fullName: 'Flow_with_get_record_using_SObject_with_automated_output',
    id: '301RM000000090KYAQ',
    lastModifiedBy: {
        fieldsToNull: [],
        name: 'Admin User'
    },
    lastModifiedById: '005RM000001kjoRYAQ',
    lastModifiedDate: '2019-06-20T11:17:35.000+0000',
    manageableState: 'unmanaged',
    masterLabel: 'Flow with get record using SObject with automated output',
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
        interviewLabel: 'Flow with get record using SObject with automated output {!$Flow.CurrentDateTime}',
        isTemplate: false,
        label: 'Flow with get record using SObject with automated output',
        loops: [],
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
            }
        ],
        processType: 'Flow',
        recordCreates: [],
        recordDeletes: [],
        recordLookups: [
            {
                assignNullValuesIfNoRecordsFound: false,
                filters: [],
                getFirstRecordOnly: true,
                label: 'Get single record automatic output',
                locationX: 408,
                locationY: 285,
                name: 'Get_single_record_automatic_output',
                object: 'Account',
                outputAssignments: [],
                processMetadataValues: [],
                queriedFields: ['Id'],
                storeOutputAutomatically: true
            }
        ],
        recordUpdates: [],
        screens: [],
        stages: [],
        status: 'InvalidDraft',
        steps: [],
        subflows: [],
        textTemplates: [],
        variables: [],
        waits: []
    },
    processType: 'Flow',
    status: 'InvalidDraft',
    versionNumber: 1
};
