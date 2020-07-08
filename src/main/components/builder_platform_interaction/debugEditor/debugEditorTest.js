({
    mocks: [
        {
            type: 'ACTION',
            descriptor: 'serviceComponent://ui.interaction.builder.components.controllers.FlowBuilderController',
            stubs: [
                {
                    method: { name: 'getFlowInputOutputVariables' },
                    answers: [
                        {
                            value: [
                                {
                                    variables: []
                                }
                            ]
                        }
                    ]
                },
                {
                    method: { name: 'debugRunAsValidation' },
                    answers: [
                        {
                            value: {
                                showIsDebugAsUserAllowed: true,
                                showIsDebugAsUserAllowedInNonPrd: true
                            }
                        }
                    ]
                }
            ]
        }
    ],

    browsers: ['GOOGLECHROME', 'FIREFOX', 'SAFARI'],

    assertObjectEquals: function(obj1, obj2, assertionMessage) {
        return $A.test.assertEquals(JSON.stringify(obj1), JSON.stringify(obj2), assertionMessage);
    },

    /** Test Cases **/
    testDefaultOptions: {
        test: function(cmp) {
            $A.test.assertTrue(
                cmp.find('isRunLatestVersionBox').get('v.checked'),
                'RunLatestVersion is checked by default'
            );
            $A.test.assertTrue(cmp.find('isShowDebugInfoBox').get('v.checked'), 'ShowDebugInfo is checked by default');
            $A.test.assertFalse(
                cmp.find('isDebugAsUserAllowedBox').get('v.checked'),
                'DebugAsUser is not checked by default'
            );
            $A.test.assertFalse(
                cmp.find('isEnableRollbackModeBox').get('v.checked'),
                'EnableRollbackMode is not checked by default'
            );
            $A.test.assertFalse(
                cmp.find('isGovernorLimitsBox').get('v.checked'),
                'GovernorLimits is not checked by default'
            );
            this.assertObjectEquals(
                cmp.getDebugInput(),
                {
                    inputs: [],
                    runLatestVersion: true,
                    showDebugInfo: true,
                    runAs: false,
                    debugAsUserId: null,
                    enableRollback: false,
                    governorLimits: false
                },
                "Default getDebugInput doesn't work correctly"
            );
            $A.test.assertFalse(cmp.get('v.hasInputs'), 'hasInputs is not set properly');
        }
    },

    testToggleCheckboxes: {
        test: function(cmp) {
            cmp.find('isRunLatestVersionBox').set('v.checked', false);
            cmp.find('isShowDebugInfoBox').set('v.checked', false);
            cmp.find('isDebugAsUserAllowedBox').set('v.checked', true);
            cmp.find('isEnableRollbackModeBox').set('v.checked', true);
            cmp.find('isGovernorLimitsBox').set('v.checked', true);
            this.assertObjectEquals(
                cmp.getDebugInput(),
                {
                    inputs: [],
                    runLatestVersion: false,
                    showDebugInfo: false,
                    runAs: true,
                    debugAsUserId: null,
                    enableRollback: true,
                    governorLimits: true
                },
                "getDebugInput doesn't reflect value changes of checkboxes correctly"
            );
        }
    },

    testDebugAsUserHelp: {
        test: function(cmp) {
            $A.test.addWaitFor(
                false,
                function() {
                    return $A.test.isActionPending('doInit');
                },
                function(cmp) {
                    $A.test.assertEquals(
                        $A.get('$Label.FlowDebug.ShowDebugAsUserHelp'),
                        cmp.get('v.runAsHelptext'),
                        'Cancel button was not created correctly'
                    );
                }
            );
        }
    },

    testDebugAsUserDisabledHelp: {
        mocks: [
            {
                type: 'ACTION',
                descriptor: 'serviceComponent://ui.interaction.builder.components.controllers.FlowBuilderController',
                stubs: [
                    {
                        method: { name: 'debugRunAsValidation' },
                        answers: [
                            {
                                value: {
                                    showIsDebugAsUserAllowed: false,
                                    showIsDebugAsUserAllowedInNonPrd: true
                                }
                            }
                        ]
                    }
                ]
            }
        ],
        test: function(cmp) {
            $A.test.addWaitFor(
                false,
                function() {
                    return $A.test.isActionPending('doInit');
                },
                function(cmp) {
                    $A.test.assertEquals(
                        $A.get('$Label.FlowDebug.ShowDebugAsUserDisabledHelp'),
                        cmp.get('v.runAsHelptext'),
                        'Helptext for debugRunAs is not created correctly'
                    );
                }
            );
        }
    },

    testDebugAsUserDisabledHelpInPrdOrg: {
        mocks: [
            {
                type: 'ACTION',
                descriptor: 'serviceComponent://ui.interaction.builder.components.controllers.FlowBuilderController',
                stubs: [
                    {
                        method: { name: 'debugRunAsValidation' },
                        answers: [
                            {
                                value: {
                                    showIsDebugAsUserAllowed: false,
                                    showIsDebugAsUserAllowedInNonPrd: false
                                }
                            }
                        ]
                    }
                ]
            }
        ],
        test: function(cmp) {
            $A.test.addWaitFor(
                false,
                function() {
                    return $A.test.isActionPending('doInit');
                },
                function(cmp) {
                    $A.test.assertEquals(
                        $A.get('$Label.FlowDebug.ShowDebugAsUserDisabledHelpInPrdOrg'),
                        cmp.get('v.runAsHelptext'),
                        'Helptext for debugRunAs is not created correctly'
                    );
                }
            );
        }
    },

    testInputVariables: {
        mocks: [
            {
                type: 'ACTION',
                descriptor: 'serviceComponent://ui.interaction.builder.components.controllers.FlowBuilderController',
                stubs: [
                    {
                        method: { name: 'getFlowInputOutputVariables' },
                        answers: [
                            {
                                value: [
                                    {
                                        variables: [
                                            {
                                                dataType: 'String',
                                                isCollection: false,
                                                isInput: true,
                                                isOutput: false,
                                                name: 'test1-Text'
                                            },
                                            {
                                                dataType: 'Number',
                                                isCollection: false,
                                                isInput: true,
                                                isOutput: false,
                                                name: 'test2-Number'
                                            },
                                            {
                                                dataType: 'Currency',
                                                isCollection: false,
                                                isInput: true,
                                                isOutput: false,
                                                name: 'test3-Currency'
                                            },
                                            {
                                                dataType: 'Boolean',
                                                isCollection: false,
                                                isInput: true,
                                                isOutput: false,
                                                name: 'test4-Boolean'
                                            },
                                            {
                                                dataType: 'Date',
                                                isCollection: false,
                                                isInput: true,
                                                isOutput: false,
                                                name: 'test5-Date'
                                            },
                                            {
                                                dataType: 'DateTime',
                                                isCollection: false,
                                                isInput: true,
                                                isOutput: false,
                                                name: 'test6-DateTime'
                                            },
                                            {
                                                dataType: 'Picklist',
                                                isCollection: false,
                                                isInput: true,
                                                isOutput: false,
                                                name: 'test7-Picklist'
                                            },
                                            {
                                                dataType: 'Multipicklist',
                                                isCollection: false,
                                                isInput: true,
                                                isOutput: false,
                                                name: 'test8-Multipicklist'
                                            },
                                            {
                                                dataType: 'SObject',
                                                isCollection: false,
                                                isInput: true,
                                                isOutput: false,
                                                name: 'test9-SObject',
                                                objectType: 'Account'
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        test: function(cmp) {
            $A.test.addWaitFor(
                false,
                function() {
                    return $A.test.isActionPending('doInit');
                },
                function(cmp) {
                    var inputs = cmp.find('flowInput').get('v.body');
                    $A.test.assertTrue(inputs.length > 1, "Input variables don't show up");
                    $A.test.assertTrue(cmp.get('v.hasInputs'), 'hasInputs is not set properly');
                }
            );
        }
    }
});
