// @ts-nocheck
// FIXME cannot be updated
export const flowWithScreenAndLightningComponentAddress = {
    createdById: '005xx000001X8unAAC',
    createdDate: '2019-07-05T13:52:43.000+0000',
    definitionId: '300xx000000boA5AAI',
    fieldsToNull: [],
    fullName: 'myScreenAutomaticAddressChanging',
    id: '301xx000003GZ23AAG',
    lastModifiedBy: { fieldsToNull: [], name: 'User User' },
    lastModifiedById: '005xx000001X8unAAC',
    lastModifiedDate: '2019-07-05T13:52:45.000+0000',
    manageableState: 'unmanaged',
    masterLabel: 'myScreenAutomaticAddressChanging',
    metadata: {
        actionCalls: [],
        apexPluginCalls: [],
        assignments: [],
        choices: [],
        constants: [],
        decisions: [],
        dynamicChoiceSets: [],
        formulas: [],
        interviewLabel: 'myScreeAutomaticAddressChanging {!$Flow.CurrentDateTime}',
        isTemplate: false,
        label: 'myScreeAutomaticAddressChanging',
        runInSystemMode: false,
        startElementReference: 'ScreenFlowAskAdress',
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
        recordCreates: [],
        recordDeletes: [],
        recordLookups: [],
        recordUpdates: [],
        screens: [
            {
                allowBack: true,
                allowFinish: true,
                allowPause: true,
                connector: {
                    processMetadataValues: [],
                    targetReference: 'create_Account'
                },
                fields: [
                    {
                        choiceReferences: [],
                        extensionName: 'flowruntime:address',
                        fieldType: 'ComponentInstance',
                        inputParameters: [],
                        isRequired: true,
                        name: 'askAddress',
                        outputParameters: [],
                        processMetadataValues: [],
                        scale: 0,
                        storeOutputAutomatically: true
                    }
                ],
                label: 'ScreenFlowAskAdress',
                locationX: 534,
                locationY: 381,
                name: 'ScreenFlowAskAdress',
                processMetadataValues: [],
                rules: [],
                showFooter: true,
                showHeader: true
            }
        ],
        stages: [],
        subflows: [],
        textTemplates: [],
        variables: [],
        waits: []
    },
    processType: 'Flow',
    status: 'Draft',
    versionNumber: 1
};
