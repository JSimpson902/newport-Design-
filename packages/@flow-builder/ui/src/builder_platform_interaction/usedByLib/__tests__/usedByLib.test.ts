import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { Store } from 'builder_platform_interaction/storeLib';
import { usedBy, UsedByElement, usedByStoreAndElementState } from 'builder_platform_interaction/usedByLib';
import {
    accountSObjectVariable,
    address2,
    decision1Outcome1,
    displayTextUsingResources,
    email2,
    flowWithAllElementsUIModel,
    screenFieldAccounts,
    screenWithAutomaticFields,
    screenWithAutomaticFieldsInSection,
    screenWithSection,
    slider1,
    variableWithSameNameAsAccount
} from 'mock/storeData';

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

const elements = {
    WAIT_1: {
        childReferences: [
            { childReference: 'WAIT_EVENT_1' },
            { childReference: 'WAIT_EVENT_2' },
            { childReference: 'WAIT_EVENT_4' }
        ],
        guid: 'WAIT_1',
        elementType: ELEMENT_TYPE.WAIT
    },
    WAIT_EVENT_1: {
        conditions: [
            {
                leftValueReference: 'VARIABLE_1.fieldName',
                operator: 'EqualTo',
                rightValue: {
                    elementReference: 'VARIABLE_3'
                }
            }
        ],
        label: 'WAIT EVENT 1',
        name: 'WAIT EVENT 1',
        guid: 'WAIT_EVENT_1',
        isCanvasElement: false
    },
    WAIT_EVENT_2: {
        conditions: [
            {
                leftValueReference: 'VARIABLE_1',
                operator: 'EqualTo',
                rightValue: {
                    stringValue: 'WAIT_EVENT_1' // String value without curly braces should not be match even if it is equal to a GUID
                }
            }
        ],
        guid: 'WAIT_EVENT_2',
        label: 'WAIT EVENT 2',
        name: 'WAIT EVENT 2',
        isCanvasElement: false
    },
    WAIT_EVENT_3: {
        conditions: [
            {
                leftValueReference: 'WAIT_EVENT_1',
                operator: 'EqualTo',
                rightValue: {
                    stringValue: '{!WAIT_EVENT_2}' // String value with curly braces should match even if it is equal to a GUID
                }
            }
        ],
        guid: 'WAIT_EVENT_3',
        label: 'WAIT EVENT 3',
        name: 'WAIT EVENT 3',
        isCanvasElement: false
    },
    WAIT_EVENT_4: {
        conditions: [
            {
                leftValueReference: 'WAIT_EVENT_1',
                operator: 'EqualTo',
                rightValue: {
                    stringValue: 'foo'
                }
            }
        ],
        guid: 'WAIT_EVENT_4',
        label: 'WAIT EVENT 4',
        name: 'WAIT EVENT 4',
        isCanvasElement: false
    },
    DECISION_1: {
        defaultConnectorLabel: '[Default Outcome]',
        config: {
            isSelected: false
        },
        childReferences: [
            {
                childReference: 'OUTCOME_1'
            },
            {
                childReference: 'OUTCOME_2'
            },
            {
                childReference: 'OUTCOME_4'
            }
        ],
        availableConnections: [
            {
                type: 'REGULAR',
                childReference: 'OUTCOME_1'
            },
            {
                type: 'REGULAR',
                childReference: 'OUTCOME_2'
            },
            {
                type: 'DEFAULT'
            }
        ],
        guid: 'DECISION_1',
        elementType: ELEMENT_TYPE.DECISION
    },
    OUTCOME_1: {
        conditions: [
            {
                leftValueReference: 'VARIABLE_1.fieldName',
                operator: 'EqualTo',
                rightValue: {
                    elementReference: 'VARIABLE_3'
                }
            }
        ],
        label: 'OUTCOME 1',
        name: 'OUTCOME 1',
        guid: 'OUTCOME_1',
        isCanvasElement: false
    },
    OUTCOME_2: {
        conditions: [
            {
                leftValueReference: 'VARIABLE_1',
                operator: 'EqualTo',
                rightValue: {
                    stringValue: 'OUTCOME_1' // String value without curly braces should not be match even if it is equal to a GUID
                }
            }
        ],
        guid: 'OUTCOME_2',
        label: 'OUTCOME 2',
        name: 'OUTCOME 2',
        isCanvasElement: false
    },
    OUTCOME_3: {
        conditions: [
            {
                leftValueReference: 'OUTCOME_1',
                operator: 'EqualTo',
                rightValue: {
                    stringValue: '{!OUTCOME_2}' // String value with curly braces should match even if it is equal to a GUID
                }
            }
        ],
        guid: 'OUTCOME_3',
        label: 'OUTCOME 3',
        name: 'OUTCOME 3',
        isCanvasElement: false
    },
    OUTCOME_4: {
        conditions: [
            {
                leftValueReference: 'OUTCOME_1',
                operator: 'EqualTo',
                rightValue: {
                    stringValue: 'foo'
                }
            }
        ],
        guid: 'OUTCOME_4',
        label: 'OUTCOME 4',
        name: 'OUTCOME 4',
        isCanvasElement: false
    },
    FORMULA_1: {
        expression:
            '{!VARIABLE_1.fieldName} is a variable with following elements jfkdjkfjdkjf: {!OUTCOME_3} {!WAIT_EVENT_3}',
        name: 'Formula_1',
        elementType: ELEMENT_TYPE.FORMULA,
        guid: 'FORMULA_1',
        isCanvasElement: false
    },
    VARIABLE_1: {
        elementType: ELEMENT_TYPE.VARIABLE,
        guid: 'VARIABLE_1',
        isCanvasElement: false,
        name: 'VARIABLE 1'
    },
    VARIABLE_2: {
        elementType: ELEMENT_TYPE.VARIABLE,
        guid: 'VARIABLE_2',
        isCanvasElement: false,
        name: 'VARIABLE 2'
    },
    VARIABLE_3: {
        elementType: ELEMENT_TYPE.VARIABLE,
        guid: 'VARIABLE_3',
        isCanvasElement: false,
        name: 'VARIABLE 3'
    },
    SCREEN_1: {
        config: {
            isSelected: false
        },
        childReferences: [
            {
                childReference: 'FIELD_1'
            },
            {
                childReference: 'FIELD_2'
            },
            {
                childReference: 'FIELD_3'
            }
        ],
        guid: 'SCREEN_1',
        elementType: ELEMENT_TYPE.SCREEN
    },
    FIELD_1: {
        label: 'FIELD 1',
        name: 'FIELD 1',
        guid: 'FIELD_1',
        isCanvasElement: false
    },
    FIELD_2: {
        guid: 'FIELD_2',
        label: 'FIELD 2',
        name: 'FIELD 2',
        isCanvasElement: false
    },
    FIELD_3: {
        guid: 'FIELD_3',
        label: 'FIELD 3',
        name: 'FIELD 3',
        isCanvasElement: false
    },
    SCREEN_2: {
        childReferences: [
            {
                childReference: 'SECTION_FIELD_1'
            }
        ],
        guid: 'SCREEN_2',
        elementType: ELEMENT_TYPE.SCREEN
    },
    SECTION_FIELD_1: {
        name: 'SECTION FIELD 1',
        guid: 'SECTION_FIELD_1',
        childReferences: [
            {
                childReference: 'COLUMN_FIELD_1'
            }
        ]
    },
    COLUMN_FIELD_1: {
        label: 'COLUMN FIELD 1',
        guid: 'COLUMN_FIELD_1',
        childReferences: [
            {
                childReference: 'SCREEN_FIELD_1'
            }
        ]
    },
    SCREEN_FIELD_1: {
        guid: 'SCREEN_FIELD_1',
        name: 'SCREEN FIELD 1'
    }
};

const elementsFromScreenEditor = {
    SCREEN_FIELD_1: {
        name: { value: 'SCREEN FIELD 1', error: null },
        guid: 'SCREEN_FIELD_1',
        elementType: ELEMENT_TYPE.SCREEN_FIELD
    },
    SCREEN_FIELD_2: {
        name: { value: 'SCREEN FIELD 2', error: null },
        guid: 'SCREEN_FIELD_2',
        elementType: ELEMENT_TYPE.SCREEN_FIELD
    },
    SECTION_FIELD_1: {
        name: { value: 'SECTION FIELD 1', error: null },
        guid: 'SECTION_FIELD_1',
        elementType: ELEMENT_TYPE.SCREEN_FIELD,
        conditions: [
            {
                leftValueReference: 'SCREEN_FIELD_1',
                operator: 'EqualTo',
                rightValue: {
                    stringValue: 'foo'
                }
            }
        ],
        fields: [
            {
                label: 'COLUMN FIELD 1',
                guid: 'COLUMN_FIELD_1',
                elementType: ELEMENT_TYPE.SCREEN_FIELD,
                fields: [
                    {
                        label: { value: 'SCREEN FIELD 3', error: null },
                        name: { value: 'SCREEN_FIELD_3', error: null },
                        guid: 'SCREEN_FIELD_3',
                        elementType: ELEMENT_TYPE.SCREEN_FIELD,
                        conditions: [
                            {
                                leftValueReference: 'SCREEN_FIELD_2',
                                operator: 'EqualTo',
                                rightValue: {
                                    stringValue: 'foo'
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    },
    SCREEN_FIELD_3: {
        guid: 'SCREEN_FIELD_3',
        name: { value: 'SCREEN FIELD 3', error: null },
        conditions: [
            {
                leftValueReference: 'SCREEN_FIELD_2',
                operator: 'EqualTo',
                rightValue: {
                    stringValue: 'foo'
                }
            }
        ]
    },
    guid: 'SCREEN_3',
    elementType: ELEMENT_TYPE.SCREEN
} as unknown as UI.HydratedElements;

describe('Used by library', () => {
    const expectNoDuplicatesInUsedBy = (usedByElements: UsedByElement[]) => {
        const elementGuids = usedByElements.map((usedByElement) => usedByElement.guid);
        expect(elementGuids.length).toBe(new Set(elementGuids).size);
        for (const usedByElement of usedByElements) {
            expect(usedByElement.elementGuidsReferenced.length).toBe(
                new Set(usedByElement.elementGuidsReferenced).size
            );
        }
    };
    beforeAll(() => {
        (Store as any).setMockState(flowWithAllElementsUIModel);
    });
    afterAll(() => {
        (Store as any).resetStore();
    });
    describe('usedBy', () => {
        it('returns an empty array if an element is not used anywhere', () => {
            const elementGuids = ['VARIABLE_2'];
            const actualResult = usedBy(elementGuids, { elements });
            expect(actualResult).toHaveLength(0);
        });
        it('returns an array of elements where an element is being referenced', () => {
            const elementGuids = ['VARIABLE_1'];
            const expectedResult = [
                {
                    guid: 'WAIT_EVENT_1',
                    label: 'WAIT EVENT 1',
                    name: 'WAIT EVENT 1',
                    elementGuidsReferenced: ['VARIABLE_1']
                },
                {
                    guid: 'WAIT_EVENT_2',
                    label: 'WAIT EVENT 2',
                    name: 'WAIT EVENT 2',
                    elementGuidsReferenced: ['VARIABLE_1']
                },
                {
                    guid: 'OUTCOME_1',
                    label: 'OUTCOME 1',
                    name: 'OUTCOME 1',
                    elementGuidsReferenced: ['VARIABLE_1']
                },
                {
                    guid: 'OUTCOME_2',
                    label: 'OUTCOME 2',
                    name: 'OUTCOME 2',
                    elementGuidsReferenced: ['VARIABLE_1']
                },
                {
                    guid: 'FORMULA_1',
                    name: 'Formula_1',
                    elementGuidsReferenced: ['VARIABLE_1'],
                    iconName: 'standard:formula'
                }
            ];
            const actualResult = usedBy(elementGuids, { elements });
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('returns an array of object which contains guid, label, name, elementGuidsReferenced', () => {
            const elementGuids = ['VARIABLE_3'];
            const expectedResult = [
                {
                    guid: 'WAIT_EVENT_1',
                    label: 'WAIT EVENT 1',
                    name: 'WAIT EVENT 1',
                    elementGuidsReferenced: ['VARIABLE_3']
                },
                {
                    guid: 'OUTCOME_1',
                    label: 'OUTCOME 1',
                    name: 'OUTCOME 1',
                    elementGuidsReferenced: ['VARIABLE_3']
                }
            ];
            const actualResult = usedBy(elementGuids, { elements });
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('returns an array of object which contains multiple element guids referenced', () => {
            const elementGuids = ['VARIABLE_1', 'VARIABLE_3', 'VARIABLE_2'];
            const expectedResult = [
                {
                    guid: 'WAIT_EVENT_1',
                    label: 'WAIT EVENT 1',
                    name: 'WAIT EVENT 1',
                    elementGuidsReferenced: ['VARIABLE_1', 'VARIABLE_3']
                },
                {
                    guid: 'WAIT_EVENT_2',
                    label: 'WAIT EVENT 2',
                    name: 'WAIT EVENT 2',
                    elementGuidsReferenced: ['VARIABLE_1']
                },
                {
                    guid: 'OUTCOME_1',
                    label: 'OUTCOME 1',
                    name: 'OUTCOME 1',
                    elementGuidsReferenced: ['VARIABLE_1', 'VARIABLE_3']
                },
                {
                    guid: 'OUTCOME_2',
                    label: 'OUTCOME 2',
                    name: 'OUTCOME 2',
                    elementGuidsReferenced: ['VARIABLE_1']
                },
                {
                    guid: 'FORMULA_1',
                    name: 'Formula_1',
                    elementGuidsReferenced: ['VARIABLE_1'],
                    iconName: 'standard:formula'
                }
            ];
            const actualResult = usedBy(elementGuids, { elements });
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('returns an array of object if an element is referenced in a template field', () => {
            const elementGuids = ['WAIT_EVENT_3', 'OUTCOME_3'];
            const expectedResult = [
                {
                    guid: 'FORMULA_1',
                    name: 'Formula_1',
                    elementGuidsReferenced: ['OUTCOME_3', 'WAIT_EVENT_3'],
                    iconName: 'standard:formula'
                }
            ];
            const actualResult = usedBy(elementGuids, { elements });
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('should not delete the section/column/screen field element when it is referenced in screen element with the nested structure', () => {
            const elementGuids = ['SECTION_FIELD_1', 'COLUMN_FIELD_1', 'SCREEN_FIELD_3'];
            const expectedResult = [
                {
                    guid: 'SCREEN_2',
                    elementGuidsReferenced: ['SECTION_FIELD_1']
                }
            ];
            const actualResult = usedBy(elementGuids, { elements });
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('should return the referenced screen field element and the section referencing it when the section is using the screen field in cfv rule', () => {
            const elementGuids = ['SCREEN_FIELD_1'];
            const expectedResult = [
                {
                    guid: 'SECTION_FIELD_1',
                    elementGuidsReferenced: ['SCREEN_FIELD_1']
                }
            ];
            const actualResult = usedBy(elementGuids, { elements: elementsFromScreenEditor });
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('should return the referenced screen field element and the field referencing it, but not the section in which the referencing screen field is nested', () => {
            const elementGuids = ['SCREEN_FIELD_2'];
            const expectedResult = [
                {
                    guid: 'SCREEN_FIELD_3',
                    elementGuidsReferenced: ['SCREEN_FIELD_2']
                }
            ];
            const actualResult = usedBy(elementGuids, { elements: elementsFromScreenEditor });
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('returns an array of object including any childReferences if an element is referenced and has child references', () => {
            const elementGuids = ['WAIT_1', 'DECISION_1'];
            const expectedResult = [
                {
                    guid: 'WAIT_EVENT_3',
                    label: 'WAIT EVENT 3',
                    name: 'WAIT EVENT 3',
                    elementGuidsReferenced: ['WAIT_EVENT_1', 'WAIT_EVENT_2'],
                    iconName: 'standard:custom'
                },
                {
                    guid: 'OUTCOME_3',
                    label: 'OUTCOME 3',
                    name: 'OUTCOME 3',
                    elementGuidsReferenced: ['OUTCOME_1', 'OUTCOME_2'],
                    iconName: 'standard:custom'
                }
            ];
            const actualResult = usedBy(elementGuids, { elements });
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('returns an empty array in case the references are cyclic', () => {
            const elementGuids = ['DECISION_1', 'OUTCOME_3', 'WAIT_EVENT_3', 'FORMULA_1'];
            const actualResult = usedBy(elementGuids, { elements });
            expect(actualResult).toHaveLength(0);
        });
        it('returns an empty array if variable has the same name than an object name and is not referenced anywhere', () => {
            const actualResult = usedBy([variableWithSameNameAsAccount.guid]);
            expect(actualResult).toHaveLength(0);
        });
        describe('automatic fields', () => {
            it('returns an array with the screen containing the automatic field (with no duplicates in the array)', () => {
                const actualResult = usedBy([accountSObjectVariable.guid]);
                expectNoDuplicatesInUsedBy(actualResult);
                expect(actualResult).toEqual(
                    expect.arrayContaining([
                        {
                            elementGuidsReferenced: [accountSObjectVariable.guid],
                            guid: screenWithAutomaticFields.guid,
                            iconName: 'standard:screen',
                            isCanvasElement: true,
                            label: 'screenWithAutomaticFields',
                            name: 'screenWithAutomaticFields'
                        }
                    ])
                );
            });
            it('returns an array with the screen containing the automatic field when field is in section (with no duplicates in the array)', () => {
                const actualResult = usedBy([accountSObjectVariable.guid]);
                expectNoDuplicatesInUsedBy(actualResult);
                expect(actualResult).toEqual(
                    expect.arrayContaining([
                        {
                            elementGuidsReferenced: [accountSObjectVariable.guid],
                            guid: screenWithAutomaticFieldsInSection.guid,
                            iconName: 'standard:screen',
                            isCanvasElement: true,
                            label: 'screenWithAutomaticFieldsInSection',
                            name: 'screenWithAutomaticFieldsInSection'
                        }
                    ])
                );
            });
        });
        describe('with sections', () => {
            it('returns an array of object including any childReferences if an element is referenced in a section', () => {
                const actualResult = usedBy([screenWithSection.guid]);
                expect(actualResult).toEqual(
                    expect.arrayContaining([
                        {
                            elementGuidsReferenced: [address2.guid, email2.guid],
                            guid: displayTextUsingResources.guid,
                            iconName: 'standard:display_text',
                            isCanvasElement: false,
                            label: undefined,
                            name: 'displayTextUsingResources'
                        }
                    ])
                );
            });
            it('returns an array with the screen containing the regular field when field is in section', () => {
                const actualResult = usedBy([slider1.guid]);
                expectNoDuplicatesInUsedBy(actualResult);
                expect(actualResult).toEqual(
                    expect.arrayContaining([
                        {
                            elementGuidsReferenced: [slider1.guid],
                            guid: screenFieldAccounts.guid,
                            iconName: 'standard:display_text',
                            isCanvasElement: false,
                            label: undefined,
                            name: 'accounts'
                        },
                        {
                            elementGuidsReferenced: [slider1.guid],
                            guid: screenWithSection.guid,
                            iconName: 'standard:screen',
                            isCanvasElement: true,
                            label: 'ScreenWithSection',
                            name: 'ScreenWithSection'
                        }
                    ])
                );
            });
        });
    });

    describe('usedByStoreAndElementState', () => {
        it('returns an empty array if an element is only referenced by the parent element', () => {
            const decisionOneOutcomes = elements.DECISION_1.childReferences.map((ref) => {
                return {
                    guid: ref.childReference,
                    name: elements[ref.childReference].name
                };
            });

            const actualResult = usedByStoreAndElementState('OUTCOME_4', 'DECISION_1', decisionOneOutcomes);
            expect(actualResult).toHaveLength(0);
        });
        it('returns the referencing element if an element is referenced by an element other than the parent', () => {
            const actualResult = usedByStoreAndElementState(decision1Outcome1.guid, 'DECISION_1', []);
            expect(actualResult).not.toHaveLength(0);
        });

        it('returns an empty array if an screen field element is only referenced by the screen element', () => {
            const screenOneFields = elements.SCREEN_1.childReferences.map((ref) => {
                return {
                    guid: ref.childReference,
                    name: elements[ref.childReference].name
                };
            });

            const actualResult = usedByStoreAndElementState('FIELD_3', 'SCREEN_1', screenOneFields);
            expect(actualResult).toHaveLength(0);
        });
        it('returns the referencing screen field element if an element is referenced by any element other than the parent screen element', () => {
            const actualResult = usedByStoreAndElementState(decision1Outcome1.guid, 'SCREEN_1', []);
            expect(actualResult).not.toHaveLength(0);
        });

        describe('used by of nested screen fields structure', () => {
            const screenFields = [
                {
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    guid: 'region-container-1',
                    fieldType: 'RegionContainer',
                    fields: [
                        {
                            elementType: ELEMENT_TYPE.SCREEN_FIELD,
                            fieldType: 'Region',
                            guid: 'region-container-1-region-1',
                            fields: [
                                {
                                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                                    fieldType: 'InputField',
                                    guid: 'region-container-1-region-1-text-1'
                                }
                            ]
                        }
                    ]
                },
                {
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldType: 'Region',
                    guid: 'region-container-1-region-1',
                    fields: [
                        {
                            elementType: ELEMENT_TYPE.SCREEN_FIELD,
                            fieldType: 'InputField',
                            guid: 'region-container-1-region-1-text-1'
                        }
                    ]
                },
                {
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldType: 'InputField',
                    guid: 'region-container-1-region-1-text-1'
                },
                {
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldType: 'InputField',
                    guid: 'referencing-screen-field',
                    defaultValue: {
                        value: 'region-container-1-region-1-text-1',
                        error: null
                    },
                    defaultValueDataType: 'reference'
                }
            ];

            it('returns the referencing element when a screen field element is deleted that is referenced by another screen field element', () => {
                const actualResult = usedByStoreAndElementState(
                    'region-container-1-region-1-text-1',
                    'region-container-1',
                    screenFields
                );
                expect(actualResult).toHaveLength(1);
                const expectedResult = [
                    {
                        guid: 'referencing-screen-field',
                        elementGuidsReferenced: ['region-container-1-region-1-text-1']
                    }
                ];
                expect(actualResult).toMatchObject(expectedResult);
            });

            it('returns the referencing element when a section is deleted with a screen field element that is referenced by another screen field element', () => {
                const actualResult = usedByStoreAndElementState(
                    'region-container-1',
                    'region-container-1',
                    screenFields
                );
                expect(actualResult).toHaveLength(1);
                const expectedResult = [
                    {
                        guid: 'referencing-screen-field',
                        elementGuidsReferenced: ['region-container-1-region-1-text-1']
                    }
                ];
                expect(actualResult).toMatchObject(expectedResult);
            });

            it('returns the referencing element when a column is deleted with a screen field element that is referenced by another screen field element', () => {
                const actualResult = usedByStoreAndElementState(
                    'region-container-1-region-1',
                    'region-container-1',
                    screenFields
                );
                expect(actualResult).toHaveLength(1);
                const expectedResult = [
                    {
                        guid: 'referencing-screen-field',
                        elementGuidsReferenced: ['region-container-1-region-1-text-1']
                    }
                ];
                expect(actualResult).toMatchObject(expectedResult);
            });
        });
    });
});
