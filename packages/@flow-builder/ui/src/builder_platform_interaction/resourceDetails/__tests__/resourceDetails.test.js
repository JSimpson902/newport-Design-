import { createElement } from 'lwc';
import { EditElementEvent, DeleteResourceEvent } from 'builder_platform_interaction/events';
import ResourceDetails from 'builder_platform_interaction/resourceDetails';
import {
    mockExtensionScreenfieldAutomaticOutputsModeResourceDetails,
    mockGetRecordsAutomaticOutputModeResourceDetails,
    mockExtensionScreenfieldNotInAutomaticOutputsModeResourceDetails,
    mockActionSubmitForApprovalAutomaticOutputsModeResourceDetails,
    mockActionSubmitForApprovalNotInAutomaticOutputsModeResourceDetails,
    mockApexActionInAutomaticOutputsModeResourceDetails,
    mockApexActionNotInAutomaticOutputsModeResourceDetails,
    mockAccountRecordVariable,
    mockCreateRecordAutomaticOutputModeResourceDetails,
    mockCreateRecordNotInAutomaticOutputModeResourceDetails,
    mockApexActionInAutomaticOutputsModeAnonymousStringResourceDetails,
    mockSubflowInAutomaticOutputModeResourceDetails
} from 'mock/resourceDetailsData';
import { LABELS } from '../resourceDetailsLabels';
import { logInteraction } from 'builder_platform_interaction/loggingUtils';

jest.mock('builder_platform_interaction/loggingUtils', () => ({
    logInteraction: jest.fn()
}));

const createComponentUnderTest = details => {
    const el = createElement('builder_platform_interaction-resource-details', {
        is: ResourceDetails
    });
    el.resourceDetails = details;
    document.body.appendChild(el);
    return el;
};

const ASSIGNMENT_DETAILS = {
    elementType: 'ASSIGNMENT',
    guid: 'guid1',
    label: 'Assignment',
    iconName: 'Assignment_Icon',
    description: 'Assignment_Desc',
    name: 'guid1',
    editable: true,
    deletable: true,
    usedByElements: [],
    storeOutputAutomatically: undefined,
    title: 'assign1',
    typeIconName: undefined,
    typeLabel: 'Assignment'
};

const SELECTORS = {
    footerButtons: '.panel-footer lightning-button',
    detailsSection: '.resource-detail-panel-body',
    usedBySection: '.test-used-by-section',
    createdBySection: '.test-created-by-section',
    createdByList: 'builder_platform_interaction-used-by-content',
    usedByList: 'builder_platform_interaction-used-by-content',
    resourceDetailsParameters: 'builder_platform_interaction-resource-details-parameters',
    detailsSectionLi: '.resource-detail-panel-body li'
};

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

const getApiNameLineTextContent = resourceDetailsComponent =>
    Array.from(resourceDetailsComponent.shadowRoot.querySelectorAll(SELECTORS.detailsSectionLi))
        .map(li => li.textContent)
        .find(textContent => textContent && textContent.includes('uniqueName'));

describe('Resource Details', () => {
    describe('For elements', () => {
        it('should display Edit Button', () => {
            const element = createComponentUnderTest(ASSIGNMENT_DETAILS);
            const editBtn = element.shadowRoot.querySelectorAll(SELECTORS.footerButtons)[1];
            expect(editBtn.label).toBe(LABELS.editButtonLabel);
            expect(editBtn.title).toBe(LABELS.editButtonLabel);
        });
        it('handle edit click and check call to logging made', async () => {
            const eventCallback = jest.fn();
            const element = createComponentUnderTest(ASSIGNMENT_DETAILS);
            element.addEventListener(EditElementEvent.EVENT_NAME, eventCallback);
            element.shadowRoot.querySelectorAll(SELECTORS.footerButtons)[1].dispatchEvent(new CustomEvent('click'));
            await Promise.resolve();
            expect(eventCallback).toHaveBeenCalled();
            expect(logInteraction).toHaveBeenCalled();
        });
        it('handle delete click and check call to logging made', async () => {
            const eventCallback = jest.fn();
            const element = createComponentUnderTest(ASSIGNMENT_DETAILS);
            element.addEventListener(DeleteResourceEvent.EVENT_NAME, eventCallback);
            element.shadowRoot.querySelectorAll(SELECTORS.footerButtons)[0].dispatchEvent(new CustomEvent('click'));
            await Promise.resolve();
            expect(eventCallback).toHaveBeenCalled();
            expect(logInteraction).toHaveBeenCalled();
        });
        it('handle edit click SHOULD fire EditElementEvent with outcome canvasElementGUID', () => {
            const eventCallback = jest.fn();
            const guid = 'guid1';
            const element = createComponentUnderTest(ASSIGNMENT_DETAILS);
            element.addEventListener(EditElementEvent.EVENT_NAME, eventCallback);
            return Promise.resolve().then(() => {
                const footerButtons = element.shadowRoot.querySelectorAll(SELECTORS.footerButtons);
                const editButtonClickedEvent = new EditElementEvent(guid);
                footerButtons[1].dispatchEvent(editButtonClickedEvent);
                return Promise.resolve().then(() => {
                    expect(eventCallback).toHaveBeenCalled();
                    expect(eventCallback.mock.calls[0][0]).toMatchObject({
                        detail: {
                            canvasElementGUID: guid
                        }
                    });
                });
            });
        });

        it('should display Delete Button', () => {
            const element = createComponentUnderTest(ASSIGNMENT_DETAILS);
            const footerButtons = element.shadowRoot.querySelectorAll(SELECTORS.footerButtons);
            expect(footerButtons[0].label).toBe(LABELS.deleteButtonLabel);
            expect(footerButtons[0].title).toBe(LABELS.deleteButtonLabel);
        });
        it('handle delete click SHOULD fire DeleteResourceEvent with outcome selectedElementGUID and selectedElementType', () => {
            const eventCallback = jest.fn();
            const guid = 'guid1';
            const element = createComponentUnderTest(ASSIGNMENT_DETAILS);
            element.addEventListener(DeleteResourceEvent.EVENT_NAME, eventCallback);
            return Promise.resolve().then(() => {
                const footerButtons = element.shadowRoot.querySelectorAll(SELECTORS.footerButtons);
                const deleteButtonClickedEvent = new DeleteResourceEvent([guid], 'ASSIGNMENT');
                footerButtons[0].dispatchEvent(deleteButtonClickedEvent);
                return Promise.resolve().then(() => {
                    expect(eventCallback).toHaveBeenCalled();
                    expect(eventCallback.mock.calls[0][0]).toMatchObject({
                        detail: {
                            selectedElementGUID: [guid],
                            selectedElementType: 'ASSIGNMENT'
                        }
                    });
                });
            });
        });
    });
    describe("'Resource in automatic output handling mode", () => {
        describe('"Get Records" as a resource', () => {
            let resourceDetailsComponent;
            beforeEach(() => {
                resourceDetailsComponent = createComponentUnderTest(mockGetRecordsAutomaticOutputModeResourceDetails);
            });
            it('should not display Edit and Delete buttons', () => {
                const footerButtons = resourceDetailsComponent.shadowRoot.querySelectorAll(SELECTORS.footerButtons);
                expect(footerButtons).toHaveLength(0);
            });
            it('should display the element that created the automatic output (createdBy section) with correct title and list elements', () => {
                const createdBySection = resourceDetailsComponent.shadowRoot.querySelector(SELECTORS.createdBySection);
                expect(createdBySection).toBeDefined();
                const createdByList = createdBySection.querySelector(SELECTORS.createdByList);
                expect(createdByList.listSectionHeader).toBe('FlowBuilderResourceDetailsPanel.createdByText');
                expect(createdByList.listSectionItems).toEqual([
                    mockGetRecordsAutomaticOutputModeResourceDetails.createdByElement
                ]);
                expect(resourceDetailsComponent.createdByElements).toEqual([
                    mockGetRecordsAutomaticOutputModeResourceDetails.createdByElement
                ]);
            });
            it('should not display "Parameters" section (element type not supported)', () => {
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).toBeNull();
            });
            it('should not display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);

                expect(apiName).not.toBeDefined();
            });
        });
        describe('Extension (ie: lightning component) screenfield as a resource', () => {
            let resourceDetailsComponent;
            beforeEach(() => {
                resourceDetailsComponent = createComponentUnderTest(
                    mockExtensionScreenfieldAutomaticOutputsModeResourceDetails
                );
            });

            it('should not display "Edit" and "Delete" buttons', () => {
                const footerButtons = resourceDetailsComponent.shadowRoot.querySelectorAll(SELECTORS.footerButtons);
                expect(footerButtons).toHaveLength(0);
            });
            it('should display the element that created the automatic output (createdBy section) with correct title and list elements', () => {
                const createdBySection = resourceDetailsComponent.shadowRoot.querySelector(SELECTORS.createdBySection);
                expect(createdBySection).toBeDefined();
                const createdByList = createdBySection.querySelector(SELECTORS.createdByList);
                expect(createdByList.listSectionHeader).toBe('FlowBuilderResourceDetailsPanel.createdByText');
                expect(createdByList.listSectionItems).toEqual([
                    mockExtensionScreenfieldAutomaticOutputsModeResourceDetails.createdByElement
                ]);
                expect(resourceDetailsComponent.createdByElements).toEqual([
                    mockExtensionScreenfieldAutomaticOutputsModeResourceDetails.createdByElement
                ]);
            });
            it('should display "Parameters" section (element type supported)', () => {
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).not.toBeNull();
            });
            it('should display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);

                expect(apiName).toContain('email1');
            });
        });
        describe('Action (core action - submit for approval) as a resource', () => {
            let resourceDetailsComponent;
            beforeEach(() => {
                resourceDetailsComponent = createComponentUnderTest(
                    mockActionSubmitForApprovalAutomaticOutputsModeResourceDetails
                );
            });

            it('should not display "Edit" and "Delete" buttons', () => {
                const footerButtons = resourceDetailsComponent.shadowRoot.querySelectorAll(SELECTORS.footerButtons);
                expect(footerButtons).toHaveLength(0);
            });
            it('should display the element that created the automatic output (createdBy section) with correct title and list elements', () => {
                const createdBySection = resourceDetailsComponent.shadowRoot.querySelector(SELECTORS.createdBySection);
                expect(createdBySection).toBeDefined();
                const createdByList = createdBySection.querySelector(SELECTORS.createdByList);
                expect(createdByList.listSectionHeader).toBe('FlowBuilderResourceDetailsPanel.createdByText');
                expect(createdByList.listSectionItems).toEqual([
                    mockActionSubmitForApprovalAutomaticOutputsModeResourceDetails.createdByElement
                ]);
                expect(resourceDetailsComponent.createdByElements).toEqual([
                    mockActionSubmitForApprovalAutomaticOutputsModeResourceDetails.createdByElement
                ]);
            });
            it('should display "Parameters" section (element type supported)', () => {
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).not.toBeNull();
            });
            it('should display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);

                expect(apiName).toContain('actionCallAutomaticOutput');
            });
        });
        describe('Action (Apex action) as a resource', () => {
            let resourceDetailsComponent;
            beforeEach(() => {
                resourceDetailsComponent = createComponentUnderTest(
                    mockApexActionInAutomaticOutputsModeResourceDetails
                );
            });

            it('should not display "Edit" and "Delete" buttons', () => {
                const footerButtons = resourceDetailsComponent.shadowRoot.querySelectorAll(SELECTORS.footerButtons);
                expect(footerButtons).toHaveLength(0);
            });
            it('should display the element that created the automatic output (createdBy section) with correct title and list elements', () => {
                const createdBySection = resourceDetailsComponent.shadowRoot.querySelector(SELECTORS.createdBySection);
                expect(createdBySection).toBeDefined();
                const createdByList = createdBySection.querySelector(SELECTORS.createdByList);
                expect(createdByList.listSectionHeader).toBe('FlowBuilderResourceDetailsPanel.createdByText');
                expect(createdByList.listSectionItems).toEqual([
                    mockApexActionInAutomaticOutputsModeResourceDetails.createdByElement
                ]);
                expect(resourceDetailsComponent.createdByElements).toEqual([
                    mockApexActionInAutomaticOutputsModeResourceDetails.createdByElement
                ]);
            });
            it('should display "Parameters" section (element type supported)', () => {
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).not.toBeNull();
            });
            it('should display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);

                expect(apiName).toContain('apex_action1');
            });
        });
        describe('Action (Apex action) with anonymous output as a resource', () => {
            let resourceDetailsComponent;
            beforeEach(() => {
                resourceDetailsComponent = createComponentUnderTest(
                    mockApexActionInAutomaticOutputsModeAnonymousStringResourceDetails
                );
            });
            it('should not display "Parameters" section (element type supported)', () => {
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).toBeNull();
            });
        });
        describe('"Create Record" as a resource', () => {
            let resourceDetailsComponent;
            beforeEach(() => {
                resourceDetailsComponent = createComponentUnderTest(mockCreateRecordAutomaticOutputModeResourceDetails);
            });
            it('should not display Edit and Delete buttons', () => {
                const footerButtons = resourceDetailsComponent.shadowRoot.querySelectorAll(SELECTORS.footerButtons);
                expect(footerButtons).toHaveLength(0);
            });
            it('should display the element that created the automatic output (createdBy section) with correct title and list elements', () => {
                const createdBySection = resourceDetailsComponent.shadowRoot.querySelector(SELECTORS.createdBySection);
                expect(createdBySection).toBeDefined();
                const createdByList = createdBySection.querySelector(SELECTORS.createdByList);
                expect(createdByList.listSectionHeader).toBe('FlowBuilderResourceDetailsPanel.createdByText');
                expect(createdByList.listSectionItems).toEqual([
                    mockCreateRecordAutomaticOutputModeResourceDetails.createdByElement
                ]);
                expect(resourceDetailsComponent.createdByElements).toEqual([
                    mockCreateRecordAutomaticOutputModeResourceDetails.createdByElement
                ]);
            });
            it('should not display "Parameters" section (element type not supported)', () => {
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).toBeNull();
            });
            it('should not display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);

                expect(apiName).not.toBeDefined();
            });
        });
        describe('Subflow as a resource', () => {
            let resourceDetailsComponent;
            beforeEach(() => {
                resourceDetailsComponent = createComponentUnderTest(mockSubflowInAutomaticOutputModeResourceDetails);
            });
            it('should not display Edit and Delete buttons', () => {
                const footerButtons = resourceDetailsComponent.shadowRoot.querySelectorAll(SELECTORS.footerButtons);
                expect(footerButtons).toHaveLength(0);
            });
            it('should display the element that created the automatic output (createdBy section) with correct title and list elements', () => {
                const createdBySection = resourceDetailsComponent.shadowRoot.querySelector(SELECTORS.createdBySection);
                expect(createdBySection).toBeDefined();
                const createdByList = createdBySection.querySelector(SELECTORS.createdByList);
                expect(createdByList.listSectionHeader).toBe('FlowBuilderResourceDetailsPanel.createdByText');
                expect(createdByList.listSectionItems).toEqual([
                    mockSubflowInAutomaticOutputModeResourceDetails.createdByElement
                ]);
                expect(resourceDetailsComponent.createdByElements).toEqual([
                    mockSubflowInAutomaticOutputModeResourceDetails.createdByElement
                ]);
            });
            it('should display "Parameters" section (element type supported)', () => {
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).not.toBeNull();
            });
            it('should display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);
                expect(apiName).toContain(mockSubflowInAutomaticOutputModeResourceDetails.apiName);
            });
        });
    });
    describe("'Resource NOT in automatic output handling mode", () => {
        let resourceDetailsComponent;
        describe('"Get Records" as a resource', () => {
            it('should NOT display "Parameters" section (element type that supports automatic output mode but "storeOutputAutomatically: false")', () => {
                resourceDetailsComponent = createComponentUnderTest(
                    Object.assign(mockGetRecordsAutomaticOutputModeResourceDetails, { storeOutputAutomatically: false })
                );
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).toBeNull();
            });
            it('should display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);

                expect(apiName).toContain(mockGetRecordsAutomaticOutputModeResourceDetails.apiName);
            });
        });
        describe('Extension (ie: lightning component) screenfield as a resource', () => {
            beforeAll(() => {
                resourceDetailsComponent = createComponentUnderTest(
                    mockExtensionScreenfieldNotInAutomaticOutputsModeResourceDetails
                );
            });
            it('should NOT display "Parameters" section (element type that supports automatic output mode but "storeOutputAutomatically: false")', () => {
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).toBeNull();
            });
            it('should display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);

                expect(apiName).toContain(mockExtensionScreenfieldNotInAutomaticOutputsModeResourceDetails.apiName);
            });
        });
        describe('Action (core action - submit for approval) as a resource', () => {
            beforeAll(() => {
                resourceDetailsComponent = createComponentUnderTest(
                    mockActionSubmitForApprovalNotInAutomaticOutputsModeResourceDetails
                );
            });
            it('should NOT display "Parameters" section (element type that supports automatic output mode but "storeOutputAutomatically: false")', () => {
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).toBeNull();
            });
            it('should display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);

                expect(apiName).toContain(mockActionSubmitForApprovalNotInAutomaticOutputsModeResourceDetails.apiName);
            });
        });
        describe('Action (Apex action) as a resource', () => {
            beforeAll(() => {
                resourceDetailsComponent = createComponentUnderTest(
                    mockApexActionNotInAutomaticOutputsModeResourceDetails
                );
            });
            it('should NOT display "Parameters" section (element type that supports automatic output mode but "storeOutputAutomatically: false")', () => {
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).toBeNull();
            });
            it('should display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);

                expect(apiName).toContain(mockApexActionNotInAutomaticOutputsModeResourceDetails.apiName);
            });
        });
        describe('"Account record variable as a resource', () => {
            beforeEach(() => {
                resourceDetailsComponent = createComponentUnderTest(mockAccountRecordVariable);
            });
            it('should NOT display "Parameters" section (element type that does not supports automatic output mode - "storeOutputAutomatically: undefined")', () => {
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).toBeNull();
            });
            it('should NOT display the element that created the automatic output (createdBy section)', () => {
                const createdBySection = resourceDetailsComponent.shadowRoot.querySelector(SELECTORS.createdBySection);
                expect(createdBySection).toBeDefined();
                expect(resourceDetailsComponent.createdByElements).toHaveLength(0);
            });
            it('should display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);

                expect(apiName).toContain('vAccount');
            });
        });
        describe('"Create Record" as a resource', () => {
            it('should NOT display "Parameters" section (element type that supports automatic output mode but "storeOutputAutomatically: false")', () => {
                resourceDetailsComponent = createComponentUnderTest(
                    Object.assign(mockCreateRecordNotInAutomaticOutputModeResourceDetails, {
                        storeOutputAutomatically: false
                    })
                );
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).toBeNull();
            });
            it('should display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);
                expect(apiName).toContain(mockCreateRecordNotInAutomaticOutputModeResourceDetails.apiName);
            });
        });
        describe('Subflow as a resource', () => {
            it('should NOT display "Parameters" section (element type that supports automatic output mode but "storeOutputAutomatically: false")', () => {
                resourceDetailsComponent = createComponentUnderTest(
                    Object.assign(mockSubflowInAutomaticOutputModeResourceDetails, {
                        storeOutputAutomatically: false
                    })
                );
                const resourceDetailsParametersComponent = resourceDetailsComponent.shadowRoot.querySelector(
                    SELECTORS.resourceDetailsParameters
                );
                expect(resourceDetailsParametersComponent).toBeNull();
            });
            it('should display API Name', () => {
                const apiName = getApiNameLineTextContent(resourceDetailsComponent);
                expect(apiName).toContain(mockSubflowInAutomaticOutputModeResourceDetails.apiName);
            });
        });
    });
});
