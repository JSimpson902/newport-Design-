// @ts-nocheck
import { resolveReferenceFromIdentifier } from '../mergeField';
import * as mockStoreData from 'mock/storeData';
import { scheduleTriggeredFlowUIModel } from 'mock/storeDataScheduleTriggered';
import { Store } from 'builder_platform_interaction/storeLib';
import { GLOBAL_CONSTANT_OBJECTS, setSystemVariables } from 'builder_platform_interaction/systemLib';
import { systemVariablesForFlow } from 'serverData/GetSystemVariables/systemVariablesForFlow.json';
import { accountFields as mockAccountFields } from 'serverData/GetFieldsForEntity/accountFields.json';
import { userFields as mockUserFields } from 'serverData/GetFieldsForEntity/userFields.json';
import { feedItemFields as mockFeedItemFields } from 'serverData/GetFieldsForEntity/feedItemFields.json';
import { expectFieldsAreComplexTypeFieldDescriptions } from 'builder_platform_interaction/builderTestUtils';
import { setApexClasses, setApexClasses as mockSetApexClasses } from 'builder_platform_interaction/apexTypeLib';
import { setExtensionDescriptions, clearExtensionsCache } from 'builder_platform_interaction/flowExtensionLib';
import { apexTypesForFlow as mockApexTypesForFlow } from 'serverData/GetApexTypes/apexTypesForFlow.json';
import { fetchFieldsForEntity } from 'builder_platform_interaction/sobjectLib';
import { flowWithAllElementsUIModel } from 'mock/storeData';
import { allEntities as mockEntities } from 'serverData/GetEntities/allEntities.json';
import { flowWithActiveAndLatest as mockFlowWithActiveAndLatest } from 'serverData/GetFlowInputOutputVariables/flowWithActiveAndLatest.json';
import { recordTriggeredFlowUIModel } from 'mock/storeDataRecordTriggered';
import { flowExtensionDetails } from 'serverData/GetFlowExtensionDetails/flowExtensionDetails.json';

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

jest.mock('builder_platform_interaction/sobjectLib', () => {
    const actual = jest.requireActual('builder_platform_interaction/sobjectLib');
    return {
        fetchFieldsForEntity: jest.fn().mockImplementation((entityName) => {
            if (entityName === 'Account') {
                return Promise.resolve(mockAccountFields);
            } else if (entityName === 'User') {
                return Promise.resolve(mockUserFields);
            } else if (entityName === 'FeedItem') {
                return Promise.resolve(mockFeedItemFields);
            }
            return Promise.reject(`No entity with name ${entityName}`);
        }),
        getEntityFieldWithApiName: actual.getEntityFieldWithApiName,
        getEntity: jest.fn().mockImplementation((apiName) => {
            return mockEntities.find((entity) => entity.apiName.toLowerCase() === apiName.toLowerCase());
        })
    };
});

jest.mock('builder_platform_interaction/subflowsLib', () => {
    const actual = jest.requireActual('builder_platform_interaction/subflowsLib');
    return {
        fetchActiveOrLatestFlowOutputVariables: jest.fn().mockImplementation((flowName) => {
            if (flowName === 'flowWithActiveAndLatest') {
                return Promise.resolve(
                    actual.getActiveOrLatestInputOutputVariables(mockFlowWithActiveAndLatest).outputVariables
                );
            }
            return Promise.reject(`No flow with name ${flowName}`);
        })
    };
});

jest.mock('builder_platform_interaction/preloadLib', () => {
    return {
        loadApexClasses: jest.fn().mockImplementation(() => {
            mockSetApexClasses(mockApexTypesForFlow);
            return Promise.resolve();
        })
    };
});

jest.mock('builder_platform_interaction/invocableActionLib', () =>
    require('builder_platform_interaction_mocks/invocableActionLib')
);

describe('mergeField', () => {
    beforeAll(() => {
        setSystemVariables(systemVariablesForFlow);
        setExtensionDescriptions(flowExtensionDetails);
    });
    afterAll(() => {
        clearExtensionsCache();
    });
    beforeEach(() => {
        Store.setMockState(flowWithAllElementsUIModel);
    });
    afterEach(() => {
        Store.resetStore();
        setApexClasses(null);
    });
    describe('resolveReferenceFromIdentifier', () => {
        it('returns undefined if not a valid identifier', async () => {
            const resolved = await resolveReferenceFromIdentifier('thisIsNotAnId');
            expect(resolved).toBeUndefined();
        });
        it('resolves element identifier', async () => {
            const resolved = await resolveReferenceFromIdentifier(mockStoreData.numberVariable.guid);
            expect(resolved).toEqual([mockStoreData.numberVariable]);
        });
        it('resolves global constant identifier', async () => {
            const resolved = await resolveReferenceFromIdentifier('$GlobalConstant.EmptyString');
            expect(resolved).toEqual([GLOBAL_CONSTANT_OBJECTS['$GlobalConstant.EmptyString']]);
        });
        it('returns undefined if unknown global constant identifier', async () => {
            const resolved = await resolveReferenceFromIdentifier('$GlobalConstant.A');
            expect(resolved).toBeUndefined();
        });
        it('resolves system variable identifier', async () => {
            const resolved = await resolveReferenceFromIdentifier('$Flow.CurrentDateTime');
            expect(resolved).toEqual([expect.objectContaining({ name: '$Flow.CurrentDateTime' })]);
        });
        it('returns undefined if unknown system variable identifier', async () => {
            const resolved = await resolveReferenceFromIdentifier('{!$Flow.A}');
            expect(resolved).toBeUndefined();
        });
        describe('record system variable identifier', () => {
            beforeEach(() => {
                Store.resetStore();
                Store.setMockState(scheduleTriggeredFlowUIModel);
            });
            afterAll(() => {
                Store.resetStore();
            });
            it('resolves $Record system variable identifier', async () => {
                const resolved = await resolveReferenceFromIdentifier('$Record.BillingAddress');

                expect(resolved).toEqual([
                    expect.objectContaining({
                        dataType: 'SObject',
                        name: '$Record',
                        subtype: 'Account'
                    }),
                    expect.objectContaining({
                        apiName: 'BillingAddress',
                        dataType: 'String'
                    })
                ]);
            });
        });
        describe('record__Prior system variable identifier', () => {
            beforeEach(() => {
                Store.resetStore();
                Store.setMockState(recordTriggeredFlowUIModel);
            });
            afterAll(() => {
                Store.resetStore();
            });
            it('resolves $Record__Prior system variable identifier', async () => {
                const resolved = await resolveReferenceFromIdentifier('$Record__Prior.BillingAddress');

                expect(resolved).toEqual([
                    expect.objectContaining({
                        dataType: 'SObject',
                        name: '$Record__Prior',
                        subtype: 'Account'
                    }),
                    expect.objectContaining({
                        apiName: 'BillingAddress',
                        dataType: 'String'
                    })
                ]);
            });
        });
        describe('record fields', () => {
            const accountSObjectVariableGuid = mockStoreData.accountSObjectVariable.guid;
            const feedItemVariableGuid = mockStoreData.feedItemVariable.guid;
            it('resolves a record field identifier', async () => {
                const resolved = await resolveReferenceFromIdentifier(`${accountSObjectVariableGuid}.Name`);
                expectFieldsAreComplexTypeFieldDescriptions(resolved.slice(1));
                expect(resolved).toEqual([
                    expect.objectContaining({ name: 'accountSObjectVariable' }),
                    expect.objectContaining({
                        apiName: 'Name',
                        dataType: 'String'
                    })
                ]);
            });
            it('resolves a record field identifier case-insensitively', async () => {
                const resolved = await resolveReferenceFromIdentifier(`${accountSObjectVariableGuid}.NAME`);
                expectFieldsAreComplexTypeFieldDescriptions(resolved.slice(1));
                expect(resolved).toEqual([
                    expect.objectContaining({ name: 'accountSObjectVariable' }),
                    expect.objectContaining({
                        apiName: 'Name',
                        dataType: 'String'
                    })
                ]);
            });
            it('returns undefined if record field is unknown', async () => {
                const resolved = await resolveReferenceFromIdentifier(`${accountSObjectVariableGuid}.Unknown`);
                expect(resolved).toBeUndefined();
            });
            it('resolves a cross object field reference identifier', async () => {
                const resolved = await resolveReferenceFromIdentifier(
                    `${accountSObjectVariableGuid}.CreatedBy.AboutMe`
                );
                expectFieldsAreComplexTypeFieldDescriptions(resolved.slice(1));
                expect(resolved).toEqual([
                    expect.objectContaining({ name: 'accountSObjectVariable' }),
                    expect.objectContaining({
                        apiName: 'CreatedById',
                        dataType: 'String'
                    }),
                    expect.objectContaining({
                        apiName: 'AboutMe',
                        dataType: 'String'
                    })
                ]);
            });
            it('returns undefined if one of the intermediary fields is not spannable', async () => {
                const resolved = await resolveReferenceFromIdentifier(`${feedItemVariableGuid}.OriginalCreatedBy.Name`);
                expect(resolved).toBeUndefined();
            });
            it('resolves a polymorphic cross object field reference identifier', async () => {
                const resolved = await resolveReferenceFromIdentifier(`${feedItemVariableGuid}.Parent:User.AboutMe`);
                expectFieldsAreComplexTypeFieldDescriptions(resolved.slice(1));
                expect(resolved).toEqual([
                    expect.objectContaining({ name: 'feedItemVariable' }),
                    expect.objectContaining({
                        apiName: 'ParentId',
                        dataType: 'String'
                    }),
                    expect.objectContaining({
                        apiName: 'AboutMe',
                        dataType: 'String',
                        sobjectName: 'User'
                    })
                ]);
            });
            it('returns a rejected promise if remote call failed', async () => {
                fetchFieldsForEntity.mockImplementationOnce(() => Promise.reject('Error while retrieving fields'));
                await expect(resolveReferenceFromIdentifier(`${accountSObjectVariableGuid}.Name`)).rejects.toEqual(
                    'Error while retrieving fields'
                );
            });
        });
        describe('Apex types', () => {
            const apexCarVariableGuid = mockStoreData.apexCarVariable.guid;
            const apexComplexTypeVariableGuid = mockStoreData.apexComplexTypeVariable.guid;
            it('resolves an apex type field identifier', async () => {
                const resolved = await resolveReferenceFromIdentifier(`${apexCarVariableGuid}.model`);
                expectFieldsAreComplexTypeFieldDescriptions(resolved.slice(1));
                expect(resolved).toEqual([
                    expect.objectContaining({
                        name: 'apexCarVariable',
                        dataType: 'Apex',
                        subtype: 'Car'
                    }),
                    expect.objectContaining({
                        apiName: 'model',
                        dataType: 'String',
                        apexClass: 'Car'
                    })
                ]);
            });
            it('returns undefined if apex type property is unknown', async () => {
                const resolved = await resolveReferenceFromIdentifier(`${apexCarVariableGuid}.Unknown`);
                expect(resolved).toBeUndefined();
            });
            it('resolves a reference with apex type with an sobject field', async () => {
                const resolved = await resolveReferenceFromIdentifier(
                    `${apexComplexTypeVariableGuid}.acct.CreatedBy.Name`
                );
                expectFieldsAreComplexTypeFieldDescriptions(resolved.slice(1));
                expect(resolved).toEqual([
                    expect.objectContaining({
                        name: 'apexComplexTypeVariable',
                        dataType: 'Apex',
                        subtype: 'ApexComplexTypeTestOne216'
                    }),
                    expect.objectContaining({
                        apiName: 'acct',
                        dataType: 'SObject',
                        apexClass: 'ApexComplexTypeTestOne216',
                        subtype: 'Account'
                    }),
                    expect.objectContaining({
                        apiName: 'CreatedById',
                        dataType: 'String'
                    }),
                    expect.objectContaining({
                        apiName: 'Name',
                        dataType: 'String'
                    })
                ]);
            });
            it('resolves a reference with apex type containing another apex type', async () => {
                const resolved = await resolveReferenceFromIdentifier(`${apexCarVariableGuid}.wheel.Type`);
                expectFieldsAreComplexTypeFieldDescriptions(resolved.slice(1));
                expect(resolved).toEqual([
                    expect.objectContaining({
                        name: 'apexCarVariable',
                        dataType: 'Apex',
                        subtype: 'Car'
                    }),
                    expect.objectContaining({
                        apiName: 'wheel',
                        dataType: 'Apex',
                        apexClass: 'Car',
                        subtype: 'Wheel'
                    }),
                    expect.objectContaining({
                        apiName: 'type',
                        dataType: 'String',
                        apexClass: 'Wheel'
                    })
                ]);
            });
        });
        describe('Lookup elements with automatic output handling mode', () => {
            const lookupRecordAutomaticOutputGuid = mockStoreData.lookupRecordAutomaticOutput.guid;
            it('resolves a reference to lookup element automatic output', async () => {
                const resolved = await resolveReferenceFromIdentifier(`${lookupRecordAutomaticOutputGuid}`);
                expect(resolved).toEqual([
                    expect.objectContaining({
                        name: 'lookupRecordAutomaticOutput',
                        dataType: 'SObject',
                        subtype: 'Account'
                    })
                ]);
            });
            it('resolves a reference to field from lookup element automatic output', async () => {
                const resolved = await resolveReferenceFromIdentifier(`${lookupRecordAutomaticOutputGuid}.Name`);
                expect(resolved).toEqual([
                    expect.objectContaining({
                        name: 'lookupRecordAutomaticOutput',
                        dataType: 'SObject',
                        subtype: 'Account'
                    }),
                    expect.objectContaining({
                        apiName: 'Name',
                        dataType: 'String',
                        sobjectName: 'Account'
                    })
                ]);
            });
            it('resolves a reference to cross object field from lookup element automatic output', async () => {
                const resolved = await resolveReferenceFromIdentifier(
                    `${lookupRecordAutomaticOutputGuid}.CreatedBy.AboutMe`
                );
                expect(resolved).toEqual([
                    expect.objectContaining({
                        name: 'lookupRecordAutomaticOutput',
                        dataType: 'SObject',
                        subtype: 'Account'
                    }),
                    expect.objectContaining({
                        apiName: 'CreatedById',
                        dataType: 'String'
                    }),
                    expect.objectContaining({
                        apiName: 'AboutMe',
                        dataType: 'String'
                    })
                ]);
            });
        });
        describe('LC screen fields with automatic output handling mode', () => {
            const emailScreenFieldAutomaticOutputGuid = mockStoreData.emailScreenFieldAutomaticOutput.guid;
            const screenFieldWithAccountAutomaticOutputGuid =
                mockStoreData.lightningCompAutomaticOutputContainsAccountExtension.guid;
            it('resolves a reference to an output parameter from a screen field', async () => {
                const resolved = await resolveReferenceFromIdentifier(`${emailScreenFieldAutomaticOutputGuid}.value`);
                expect(resolved).toEqual([
                    expect.objectContaining({
                        name: 'emailScreenFieldAutomaticOutput',
                        dataType: 'LightningComponentOutput'
                    }),
                    expect.objectContaining({
                        apiName: 'value',
                        dataType: 'String'
                    })
                ]);
            });
            it('resolves a reference to object field from a LC screenfield automatic output', async () => {
                const resolved = await resolveReferenceFromIdentifier(
                    `${screenFieldWithAccountAutomaticOutputGuid}.account.Name`
                );
                expect(resolved).toEqual([
                    expect.objectContaining({
                        name: 'lightningCompWithAccountOutput',
                        dataType: 'LightningComponentOutput'
                    }),
                    expect.objectContaining({
                        apiName: 'account',
                        dataType: 'SObject'
                    }),
                    expect.objectContaining({
                        apiName: 'Name',
                        dataType: 'String'
                    })
                ]);
            });
        });
        describe('Action with automatic output handling mode', () => {
            it('resolves a reference to an output parameter from an action', async () => {
                const apexCallStringAutomaticOutputGuid = mockStoreData.apexCallStringAutomaticOutput.guid;
                const resolved = await resolveReferenceFromIdentifier(
                    `${apexCallStringAutomaticOutputGuid}.accountName`
                );
                expect(resolved).toEqual([
                    expect.objectContaining({
                        name: 'apexCall_String_automatic_output',
                        dataType: 'ActionOutput'
                    }),
                    expect.objectContaining({
                        apiName: 'accountName',
                        dataType: 'String'
                    })
                ]);
            });
            it('resolves a reference to object field from an action in automatic output handling mode', async () => {
                const apexCallAccountAutomaticOutputGuid = mockStoreData.apexCallAccountAutomaticOutput.guid;
                const resolved = await resolveReferenceFromIdentifier(
                    `${apexCallAccountAutomaticOutputGuid}.generatedAccount.LastModifiedBy.Name`
                );
                expect(resolved).toEqual([
                    expect.objectContaining({
                        name: 'apexCall_account_automatic_output',
                        dataType: 'ActionOutput'
                    }),
                    expect.objectContaining({
                        apiName: 'generatedAccount',
                        dataType: 'SObject',
                        subtype: 'Account'
                    }),
                    expect.objectContaining({
                        apiName: 'LastModifiedById',
                        dataType: 'String'
                    }),
                    expect.objectContaining({
                        apiName: 'Name',
                        dataType: 'String'
                    })
                ]);
            });
        });
        describe('Subflow with automatic output handling mode', () => {
            it('resolves a reference to an output variable from a subflow', async () => {
                const subflowAutomaticOutputGuid = mockStoreData.subflowAutomaticOutput.guid;
                const resolved = await resolveReferenceFromIdentifier(`${subflowAutomaticOutputGuid}.output1`);
                expect(resolved).toEqual([
                    expect.objectContaining({
                        name: 'subflowAutomaticOutput',
                        dataType: 'SubflowOutput'
                    }),
                    expect.objectContaining({
                        apiName: 'output1',
                        dataType: 'String'
                    })
                ]);
            });
        });
    });
});
