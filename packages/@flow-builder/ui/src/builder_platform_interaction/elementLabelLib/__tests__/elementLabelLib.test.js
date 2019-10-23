import {
    getResourceLabel,
    getElementCategory,
    getResourceCategory,
    getResourceTypeLabel,
    formatWithEntityLabel
} from '../elementLabelLib';
import { LABELS } from '../elementLabelLibLabels';
import {
    lookupRecordOutputReference,
    lookupRecordAutomaticOutput,
    lookupRecordCollectionAutomaticOutput,
    emailScreenFieldAutomaticOutput,
    actionCallAutomaticOutput,
    apexCallAutomaticAnonymousAccountOutput,
    apexCallAutomaticAnonymousStringOutput,
    createAccountWithAutomaticOutput
} from 'mock/storeData';
import { deepCopy } from 'builder_platform_interaction/storeLib';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';

jest.mock(
    '@salesforce/label/FlowBuilderElementLabels.recordLookupAsResourceText',
    () => {
        return { default: '{0} from {1}' };
    },
    { virtual: true }
);
jest.mock(
    '@salesforce/label/FlowBuilderElementConfig.assignmentPluralLabel',
    () => {
        return { default: 'Assignments' };
    },
    { virtual: true }
);
jest.mock(
    '@salesforce/label/FlowBuilderElementConfig.recordLookupPluralLabel',
    () => {
        return { default: 'Get Records' };
    },
    { virtual: true }
);
jest.mock(
    '@salesforce/label/FlowBuilderElementLabels.lightningComponentScreenFieldAsResourceText',
    () => {
        return { default: 'Outputs from {0}' };
    },
    { virtual: true }
);
jest.mock(
    '@salesforce/label/FlowBuilderElementLabels.actionAsResourceText',
    () => {
        return { default: 'Outputs from {0}' };
    },
    { virtual: true }
);
jest.mock(
    '@salesforce/label/FlowBuilderElementLabels.recordCreateIdAsResourceText',
    () => {
        return { default: '{0}Id from {1}' };
    },
    { virtual: true }
);
jest.mock(
    '@salesforce/label/FlowBuilderElementLabels.variablePluralLabel',
    () => {
        return { default: 'Variables' };
    },
    { virtual: true }
);
jest.mock('builder_platform_interaction/sobjectLib', () => {
    const mockEntities = require('mock/serverEntityData').mockEntities;
    return {
        getEntity: jest.fn().mockImplementation(apiName => {
            return mockEntities.find(entity => entity.apiName === apiName);
        })
    };
});
jest.mock(
    '@salesforce/label/FlowBuilderElementLabels.actionAnonymousPrimitiveAsResourceText',
    () => {
        return { default: '{0} from {1}' };
    },
    { virtual: true }
);

const createElement = (
    elementType,
    dataType,
    isCollection,
    storeOutputAutomatically
) => ({
    elementType,
    dataType,
    isCollection,
    storeOutputAutomatically
});

describe('elementLabelLib', () => {
    describe('getResourceLabel', () => {
        it('returns the resource name in the general case', () => {
            const label = getResourceLabel(lookupRecordOutputReference);
            expect(label).toEqual(lookupRecordOutputReference.name);
        });
        describe('GetRecord element with automatic handling mode', () => {
            it('returns "[SObject label] from [elementName]"', () => {
                const label = getResourceLabel(lookupRecordAutomaticOutput);
                expect(label).toEqual(
                    'Account from lookupRecordAutomaticOutput'
                );
            });
            it('returns "[SObject plural label] from [elementName]" when returning all records', () => {
                const label = getResourceLabel(
                    lookupRecordCollectionAutomaticOutput
                );
                expect(label).toEqual(
                    'Accounts from lookupRecordCollectionAutomaticOutput'
                );
            });
            it('returns the resource name if SObject cannot be found', () => {
                const element = deepCopy(lookupRecordCollectionAutomaticOutput);
                element.object = 'UnknownRecord';
                element.subtype = 'UnknownRecord';
                const label = getResourceLabel(element);
                expect(label).toEqual(element.name);
            });
        });
        describe('Action with automatic handling mode and anonymous output', () => {
            it('returns [Entity name] from [ActionName] for single sobject', () => {
                const label = getResourceLabel(
                    apexCallAutomaticAnonymousAccountOutput
                );

                expect(label).toEqual(
                    'Account from apexCall_anonymous_account'
                );
            });
            it('returns [Primitive] from [ActionName] for single primitive', () => {
                const label = getResourceLabel(
                    apexCallAutomaticAnonymousStringOutput
                );

                expect(label).toEqual('String from apexCall_anonymous_string');
            });
        });
        it('returns "Outputs" from [LCScreenFieldName]" for LC screen field with automatic handling mode', () => {
            const label = getResourceLabel(emailScreenFieldAutomaticOutput);
            expect(label).toEqual(
                'Outputs from emailScreenFieldAutomaticOutput'
            );
        });
        it('returns "Outputs" from [ActionName]" for action with automatic handling mode', () => {
            const label = getResourceLabel(actionCallAutomaticOutput);
            expect(label).toEqual('Outputs from actionCallAutomaticOutput');
        });
        it('returns "[SObject label]Id from [elementName]" for create records with automatic handling mode', () => {
            const label = getResourceLabel(createAccountWithAutomaticOutput);
            expect(label).toEqual(
                'AccountId from createAccountWithAutomaticOutput'
            );
        });
    });
    describe('getResourceTypeLabel', () => {
        describe('GetRecord element with automatic handling mode', () => {
            it('returns "Record (Single) Variable"', () => {
                const typeLabel = getResourceTypeLabel(
                    lookupRecordAutomaticOutput
                );
                expect(typeLabel).toEqual(LABELS.sObjectSingularLabel);
            });
            it('returns "Record Collection Variable" when returning all records', () => {
                const typeLabel = getResourceTypeLabel(
                    lookupRecordCollectionAutomaticOutput
                );
                expect(typeLabel).toEqual(
                    LABELS.sObjectCollectionSingularLabel
                );
            });
        });
        it('returns "Screen Component" for LC screen field with automatic handling mode', () => {
            const typeLabel = getResourceTypeLabel(
                emailScreenFieldAutomaticOutput
            );
            expect(typeLabel).toEqual(LABELS.screenFieldSingularLabel);
        });
        it('returns "Action" for action with automatic handling mode', () => {
            const typeLabel = getResourceTypeLabel(actionCallAutomaticOutput);
            expect(typeLabel).toEqual(LABELS.actionSingularLabel);
        });
        it('returns "Variable" for create records with automatic handling mode', () => {
            const typeLabel = getResourceTypeLabel(
                createAccountWithAutomaticOutput
            );
            expect(typeLabel).toEqual(LABELS.variableSingularLabel);
        });
    });
    describe('getElementCategory', () => {
        it('for elements', () => {
            expect(
                getElementCategory(createElement(ELEMENT_TYPE.ASSIGNMENT))
            ).toEqual('Assignments');
        });
        describe('For elements that are also resources', () => {
            it('for "Get Records" as record resource', () => {
                expect(
                    getElementCategory(
                        createElement(
                            ELEMENT_TYPE.RECORD_LOOKUP,
                            FLOW_DATA_TYPE.SOBJECT.value,
                            false
                        )
                    )
                ).toEqual('Get Records');
            });
            it('for "Get Records" as record collection resource', () => {
                expect(
                    getElementCategory(
                        createElement(
                            ELEMENT_TYPE.RECORD_LOOKUP,
                            FLOW_DATA_TYPE.SOBJECT.value,
                            true
                        )
                    )
                ).toEqual('Get Records');
            });
            it('for lightning component screen field as record resource', () => {
                expect(
                    getElementCategory(
                        createElement(
                            ELEMENT_TYPE.SCREEN_FIELD,
                            FLOW_DATA_TYPE.LIGHTNING_COMPONENT_OUTPUT.value,
                            false
                        )
                    )
                ).toEqual('FlowBuilderElementConfig.screenFieldPluralLabel');
            });
            it('for action as record resource', () => {
                expect(
                    getElementCategory(
                        createElement(
                            ELEMENT_TYPE.ACTION_CALL,
                            FLOW_DATA_TYPE.ACTION_OUTPUT.value,
                            false
                        )
                    )
                ).toEqual('FlowBuilderElementConfig.actionPluralLabel');
            });
        });
        it('for collections variables', () => {
            expect(
                getElementCategory(
                    createElement(
                        ELEMENT_TYPE.VARIABLE,
                        FLOW_DATA_TYPE.NUMBER,
                        true
                    )
                )
            ).toEqual('FlowBuilderElementConfig.variablePluralLabel');
        });
        it('for sobjects variables', () => {
            expect(
                getElementCategory(
                    createElement(
                        ELEMENT_TYPE.VARIABLE,
                        FLOW_DATA_TYPE.SOBJECT.value,
                        false
                    )
                )
            ).toEqual('FlowBuilderElementConfig.variablePluralLabel');
        });
        it('for sobject collections variables', () => {
            expect(
                getElementCategory(
                    createElement(
                        ELEMENT_TYPE.VARIABLE,
                        FLOW_DATA_TYPE.SOBJECT.value,
                        true
                    )
                )
            ).toEqual('FlowBuilderElementConfig.variablePluralLabel');
        });
        it('for apex variables', () => {
            expect(
                getElementCategory(
                    createElement(
                        ELEMENT_TYPE.VARIABLE,
                        FLOW_DATA_TYPE.APEX.value,
                        false
                    )
                )
            ).toEqual('FlowBuilderElementConfig.variablePluralLabel');
        });
        it('for apex variable collections', () => {
            expect(
                getElementCategory(
                    createElement(
                        ELEMENT_TYPE.VARIABLE,
                        FLOW_DATA_TYPE.APEX.value,
                        true
                    )
                )
            ).toEqual('FlowBuilderElementConfig.variablePluralLabel');
        });
    });
    describe('getResourceCategory', () => {
        it('for elements', () => {
            expect(
                getResourceCategory(createElement(ELEMENT_TYPE.ASSIGNMENT))
            ).toEqual('Assignments');
        });
        describe('For elements that are also resources', () => {
            it('for "Get Records" as record resource', () => {
                expect(
                    getResourceCategory(
                        createElement(
                            ELEMENT_TYPE.RECORD_LOOKUP,
                            FLOW_DATA_TYPE.SOBJECT.value,
                            false
                        )
                    )
                ).toEqual(LABELS.sObjectPluralLabel);
            });
            it('for "Get Records" as record collection resource', () => {
                expect(
                    getResourceCategory(
                        createElement(
                            ELEMENT_TYPE.RECORD_LOOKUP,
                            FLOW_DATA_TYPE.SOBJECT.value,
                            true
                        )
                    )
                ).toEqual(LABELS.sObjectCollectionPluralLabel);
            });
            it('for lightning component screen field as resource', () => {
                expect(
                    getResourceCategory(
                        createElement(
                            ELEMENT_TYPE.SCREEN_FIELD,
                            FLOW_DATA_TYPE.LIGHTNING_COMPONENT_OUTPUT.value,
                            false
                        )
                    )
                ).toEqual('FlowBuilderElementConfig.screenFieldPluralLabel');
            });
            it('for action as resource', () => {
                expect(
                    getResourceCategory(
                        createElement(
                            ELEMENT_TYPE.ACTION_CALL,
                            FLOW_DATA_TYPE.ACTION_OUTPUT.value,
                            false
                        )
                    )
                ).toEqual('FlowBuilderElementConfig.actionPluralLabel');
            });
            it('for action with anonymous sobject output as resource', () => {
                expect(
                    getResourceCategory(apexCallAutomaticAnonymousAccountOutput)
                ).toEqual(LABELS.sObjectPluralLabel);
            });
            it('for action with anonymous string output as resource', () => {
                expect(
                    getResourceCategory(apexCallAutomaticAnonymousStringOutput)
                ).toEqual('FlowBuilderElementConfig.variablePluralLabel');
            });
            it('for create record as resource', () => {
                expect(
                    getResourceCategory(createAccountWithAutomaticOutput)
                ).toEqual(LABELS.variablePluralLabel);
            });
        });
        it('for collections variables', () => {
            expect(
                getResourceCategory(
                    createElement(
                        ELEMENT_TYPE.VARIABLE,
                        FLOW_DATA_TYPE.NUMBER,
                        true
                    )
                )
            ).toEqual(LABELS.collectionVariablePluralLabel);
        });
        it('for sobjects variables', () => {
            expect(
                getResourceCategory(
                    createElement(
                        ELEMENT_TYPE.VARIABLE,
                        FLOW_DATA_TYPE.SOBJECT.value,
                        false
                    )
                )
            ).toEqual(LABELS.sObjectPluralLabel);
        });
        it('for sobject collections variables', () => {
            expect(
                getResourceCategory(
                    createElement(
                        ELEMENT_TYPE.VARIABLE,
                        FLOW_DATA_TYPE.SOBJECT.value,
                        true
                    )
                )
            ).toEqual(LABELS.sObjectCollectionPluralLabel);
        });
        it('for apex variables', () => {
            expect(
                getResourceCategory(
                    createElement(
                        ELEMENT_TYPE.VARIABLE,
                        FLOW_DATA_TYPE.APEX.value,
                        false
                    )
                )
            ).toEqual(LABELS.apexVariablePluralLabel);
        });
        it('for apex variable collections', () => {
            expect(
                getResourceCategory(
                    createElement(
                        ELEMENT_TYPE.VARIABLE,
                        FLOW_DATA_TYPE.APEX.value,
                        true
                    )
                )
            ).toEqual(LABELS.apexCollectionVariablePluralLabel);
        });
    });
    describe('formatWithEntityLabel', () => {
        const elementName = 'myAccount',
            aLabelWithTokens = '{0} from {1}';
        test.each`
            resource                                                          | labelWithTokens     | formattedLabel
            ${null}                                                           | ${aLabelWithTokens} | ${elementName}
            ${undefined}                                                      | ${aLabelWithTokens} | ${elementName}
            ${{}}                                                             | ${aLabelWithTokens} | ${elementName}
            ${{ subtype: 'Account' }}                                         | ${aLabelWithTokens} | ${'Account from myAccount'}
            ${{ subtype: 'Account' }}                                         | ${null}             | ${elementName}
            ${{ subtype: 'Account' }}                                         | ${undefined}        | ${elementName}
            ${{ subtype: 'Account' }}                                         | ${''}               | ${elementName}
            ${{ subtype: 'Account', isCollection: true }}                     | ${aLabelWithTokens} | ${'Accounts from myAccount'}
            ${{ subtype: 'Account', isCollection: false }}                    | ${aLabelWithTokens} | ${'Account from myAccount'}
            ${{ subtype: 'Account', object: 'Contact' }}                      | ${aLabelWithTokens} | ${'Account from myAccount'}
            ${{ subtype: 'Account', object: 'Contact', isCollection: true }}  | ${aLabelWithTokens} | ${'Accounts from myAccount'}
            ${{ subtype: 'Account', object: 'Contact', isCollection: false }} | ${aLabelWithTokens} | ${'Account from myAccount'}
            ${{ object: 'Account' }}                                          | ${aLabelWithTokens} | ${'Account from myAccount'}
            ${{ object: 'Account', isCollection: false }}                     | ${aLabelWithTokens} | ${'Account from myAccount'}
            ${{ object: 'Account', isCollection: true }}                      | ${aLabelWithTokens} | ${'Accounts from myAccount'}
        `(
            'Formatted label for resource: $resource and labelWithTokens: $labelWithTokens should be: $formattedLabel',
            ({ resource, labelWithTokens, formattedLabel }) => {
                const actual = formatWithEntityLabel(
                    resource,
                    elementName,
                    labelWithTokens
                );
                expect(actual).toBe(formattedLabel);
            }
        );
    });
});