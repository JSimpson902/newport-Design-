// @ts-nocheck
export const flowWithSubflows = {
    createdById: '005xx000001X7dFAAS',
    createdDate: '2018-12-27T10:01:02.000+0000',
    definitionId: '300xx000000bnlNAAQ',
    fieldsToNull: [],
    fullName: 'Flow_with_all_types_variables',
    id: '301xx000003GZb1AAG',
    lastModifiedBy: {
        fieldsToNull: [],
        name: 'Admin User'
    },
    lastModifiedById: '005xx000001X7dFAAS',
    lastModifiedDate: '2018-12-27T10:01:09.000+0000',
    manageableState: 'unmanaged',
    masterLabel: 'Flow with all types variables',
    metadata: {
        actionCalls: [],
        apexPluginCalls: [],
        assignments: [],
        choices: [],
        constants: [],
        decisions: [],
        dynamicChoiceSets: [],
        formulas: [],
        interviewLabel: 'Flow with all types variables {!$Flow.CurrentDateTime}',
        isTemplate: false,
        label: 'Flow with all types variables',
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
        recordLookups: [],
        recordUpdates: [],
        screens: [],
        stages: [],
        startElementReference: 'Flow_With_All_Types_Variables',
        status: 'Draft',
        steps: [],
        subflows: [
            {
                flowName: 'FlowWithAllTypesVariables',
                inputAssignments: [
                    {
                        name: 'inputOutputAccountColVar',
                        processMetadataValues: [],
                        value: {
                            elementReference: 'accountSObjectCollectionVariable'
                        }
                    },
                    {
                        name: 'inputOutputAccountVar',
                        processMetadataValues: [],
                        value: {
                            elementReference: 'accountSObjectVariable'
                        }
                    },
                    {
                        name: 'inputOutputBoolVar',
                        processMetadataValues: [],
                        value: {
                            elementReference: 'booleanVariable'
                        }
                    },
                    {
                        name: 'inputOutputCurrencyVar',
                        processMetadataValues: [],
                        value: {
                            elementReference: 'currencyVariable'
                        }
                    },
                    {
                        name: 'inputOutputDateTimeVar',
                        processMetadataValues: [],
                        value: {
                            elementReference: 'dateTimeVariable'
                        }
                    },
                    {
                        name: 'inputOutputDateVar',
                        processMetadataValues: [],
                        value: {
                            elementReference: 'dateVariable'
                        }
                    },
                    {
                        name: 'inputOutputNumberVar',
                        processMetadataValues: [],
                        value: {
                            elementReference: 'numberVariable'
                        }
                    },
                    {
                        name: 'inputOutputNumberVar',
                        processMetadataValues: [],
                        value: {
                            elementReference: 'numberVariable'
                        }
                    },
                    {
                        name: 'inputNotAvailableParam',
                        processMetadataValues: [],
                        value: {
                            elementReference: 'stringVariable'
                        }
                    },
                    {
                        name: 'inputOutputStringVar',
                        processMetadataValues: [],
                        value: {
                            elementReference: 'stringVariable'
                        }
                    }
                ],
                label: 'Flow With All Types Variables',
                locationX: 250,
                locationY: 88,
                name: 'Flow_With_All_Types_Variables',
                outputAssignments: [
                    {
                        assignToReference: 'accountSObjectCollectionVariable',
                        name: 'inputOutputAccountColVar',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'accountSObjectVariable',
                        name: 'inputOutputAccountVar',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'booleanVariable',
                        name: 'inputOutputBoolVar',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'currencyVariable',
                        name: 'inputOutputCurrencyVar',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'dateVariable',
                        name: 'inputOutputDateTimeVar',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'dateVariable',
                        name: 'inputOutputDateVar',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'numberVariable',
                        name: 'inputOutputNumberVar',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'numberVariable',
                        name: 'inputOutputNumberVar',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'stringVariable',
                        name: 'outputNotAvailableParam',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'stringCollectionVariable',
                        name: 'inputOutputStringColVar',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'stringVariable',
                        name: 'inputOutputStringVar',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'stringCollectionVariable',
                        name: 'latestOutputStringColVar',
                        processMetadataValues: []
                    },
                    {
                        assignToReference: 'stringVariable',
                        name: 'latestOutputStringVar',
                        processMetadataValues: []
                    }
                ],
                processMetadataValues: []
            }
        ],
        textTemplates: [],
        variables: [
            {
                dataType: 'SObject',
                isCollection: true,
                isInput: false,
                isOutput: false,
                name: 'accountSObjectCollectionVariable',
                objectType: 'Account',
                processMetadataValues: [],
                scale: 0
            },
            {
                dataType: 'SObject',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'accountSObjectVariable',
                objectType: 'Account',
                processMetadataValues: [],
                scale: 0
            },
            {
                dataType: 'Boolean',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'booleanVariable',
                processMetadataValues: [],
                scale: 0
            },
            {
                dataType: 'SObject',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'caseSObjectVariable',
                objectType: 'Case',
                processMetadataValues: [],
                scale: 0
            },
            {
                dataType: 'Currency',
                isCollection: true,
                isInput: false,
                isOutput: false,
                name: 'currencyCollectionVariable',
                processMetadataValues: [],
                scale: 2
            },
            {
                dataType: 'Currency',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'currencyVariable',
                processMetadataValues: [],
                scale: 2
            },
            {
                dataType: 'DateTime',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'dateTimeVariable',
                processMetadataValues: [],
                scale: 0
            },
            {
                dataType: 'Date',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'dateVariable',
                processMetadataValues: [],
                scale: 0
            },
            {
                dataType: 'Number',
                isCollection: true,
                isInput: false,
                isOutput: false,
                name: 'numberCollectionVariable',
                processMetadataValues: [],
                scale: 2
            },
            {
                dataType: 'Number',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'numberVariable',
                processMetadataValues: [],
                scale: 2
            },
            {
                dataType: 'String',
                isCollection: true,
                isInput: false,
                isOutput: false,
                name: 'stringCollectionVariable',
                processMetadataValues: [],
                scale: 0
            },
            {
                dataType: 'String',
                isCollection: false,
                isInput: false,
                isOutput: false,
                name: 'stringVariable',
                processMetadataValues: [],
                scale: 0
            }
        ],
        waits: []
    },
    processType: 'Flow',
    status: 'Draft',
    versionNumber: 1
};
