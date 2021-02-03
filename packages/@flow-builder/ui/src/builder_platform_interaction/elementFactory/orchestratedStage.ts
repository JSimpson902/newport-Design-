import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import {
    baseCanvasElement,
    baseCanvasElementsArrayToMap,
    baseChildElement,
    createCondition,
    createPastedCanvasElement,
    duplicateCanvasElementWithChildElements
} from './base/baseElement';
import {
    baseCanvasElementMetadataObject,
    baseChildElementMetadataObject,
    createConditionMetadataObject
} from './base/baseMetadata';
import { getElementByGuid, getElementsForElementType } from 'builder_platform_interaction/storeUtils';
import { createConnectorObjects } from './connector';
import { format, sanitizeDevName } from 'builder_platform_interaction/commonUtils';
import { LABELS } from './elementFactoryLabels';
import { getParametersForInvocableAction, InvocableAction } from 'builder_platform_interaction/invocableActionLib';
import { createInputParameter, createInputParameterMetadataObject } from './inputParameter';
import { createOutputParameter } from './outputParameter';
import { createActionCall } from './actionCall';
import { ParameterListRowItem } from './base/baseList';
import { RULE_OPERATOR } from 'builder_platform_interaction/ruleLib';
import { ValueWithError } from 'builder_platform_interaction/dataMutationLib';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';

// TODO: Move to UIModel.d.ts after action dependencies have been moved there
// https://gus.lightning.force.com/lightning/r/ADM_Work__c/a07B00000095RTIIA2/view
export interface StageStep extends UI.ChildElement {
    parent: UI.Guid;
    stepTypeLabel: string;
    entryConditions: UI.Condition[];
    entryConditionLogic?: string;
    action?: InvocableAction;
    actionName?: string;
    actionType?: string;
    actor?: ValueWithError;
    inputParameters: ParameterListRowItem[];
    outputParameters: ParameterListRowItem[];
}

// TODO: Move to UIModel.d.ts after action dependencies have been moved there
// https://gus.lightning.force.com/lightning/r/ADM_Work__c/a07B00000095RTIIA2/view
export interface OrchestratedStage extends UI.CanvasElement {
    stageSteps: StageStep[];
    childReferences: UI.ChildReference[];
}

const elementType = ELEMENT_TYPE.ORCHESTRATED_STAGE;

// For Opening Property editor for a OrchestratedStage
export function createOrchestratedStageWithItems(existingStage: OrchestratedStage): OrchestratedStage {
    const newStage: OrchestratedStage = baseCanvasElement(existingStage) as OrchestratedStage;
    const { childReferences = [] } = existingStage;

    if (!existingStage.label) {
        const orchestratedStageCount = getElementsForElementType(ELEMENT_TYPE.ORCHESTRATED_STAGE).length;

        newStage.label = format(LABELS.defaultOrchestratedStageName, orchestratedStageCount + 1);
        newStage.name = sanitizeDevName(newStage.label);
    }

    newStage.stageSteps = childReferences.map((childReference: UI.ChildReference) => {
        return createStageStep(getElementByGuid(childReference.childReference) as any);
    });

    newStage.maxConnections = 1;
    newStage.elementType = elementType;
    newStage.dataType = FLOW_DATA_TYPE.ORCHESTRATED_STAGE.value;

    return newStage;
}

/**
 * Function to create the pasted OrchestratedStage element
 *
 * @param dataForPasting - Data required to create the pasted element
 */
export function createPastedOrchestratedStage({
    canvasElementToPaste,
    newGuid,
    newName,
    canvasElementGuidMap,
    childElementGuidMap,
    childElementNameMap,
    cutOrCopiedChildElements,
    topCutOrCopiedGuid,
    bottomCutOrCopiedGuid,
    prev,
    next,
    parent,
    childIndex
}): { pastedCanvasElement: OrchestratedStage; pastedChildElements: Map<UI.Guid, StageStep> } {
    const { duplicatedElement, duplicatedChildElements } = createDuplicateOrchestratedStage(
        canvasElementToPaste,
        newGuid,
        newName,
        childElementGuidMap,
        childElementNameMap,
        cutOrCopiedChildElements
    );

    const pastedCanvasElement = <OrchestratedStage>(
        createPastedCanvasElement(
            duplicatedElement,
            canvasElementGuidMap,
            topCutOrCopiedGuid,
            bottomCutOrCopiedGuid,
            prev,
            next,
            parent,
            childIndex
        )
    );
    pastedCanvasElement.stageSteps = [];

    return {
        pastedCanvasElement,
        pastedChildElements: duplicatedChildElements
    };
}

/**
 * Function to create the duplicate Decision element
 *
 * @param {Object} decision - Decision element being copied
 * @param {String} newGuid - Guid for the new duplicated decision element
 * @param {String} newName - Name for the new duplicated decision element
 * @param {Object} childElementGuidMap - Map of child element guids to newly generated guids that will be used for
 * the duplicated child elements
 * @param {Object} childElementNameMap - Map of child element names to newly generated unique names that will be used for
 * the duplicated child elements
 * @param {Object} cutOrCopiedChildElements - Local copy of the cut ot copied canvas elements. Undefined in the case of duplication on Free Form Canvas
 * @return {Object} Returns an object containing the duplicated element and the duplicated childElements
 */
export function createDuplicateOrchestratedStage(
    orchestratedStage: OrchestratedStage,
    newGuid: UI.Guid,
    newName: string,
    childElementGuidMap: any,
    childElementNameMap: any,
    cutOrCopiedChildElements: object[]
): {
    duplicatedElement: OrchestratedStage;
    duplicatedChildElements: Map<UI.Guid, StageStep>;
} {
    const {
        duplicatedElement,
        duplicatedChildElements,
        updatedChildReferences,
        availableConnections
    } = duplicateCanvasElementWithChildElements(
        orchestratedStage,
        newGuid,
        newName,
        childElementGuidMap,
        childElementNameMap,
        cutOrCopiedChildElements,
        createStageStep
    );

    const updatedDuplicatedElement = Object.assign(duplicatedElement, {
        stageSteps: [],
        childReferences: updatedChildReferences,
        availableConnections
    });
    return {
        duplicatedElement: updatedDuplicatedElement,
        duplicatedChildElements: <Map<UI.Guid, StageStep>>duplicatedChildElements
    };
}

function createStageStepsWithReferences(
    originalItems: StageStep[]
): {
    items: StageStep[];
    childReferences: UI.ChildReference[];
} {
    let items: StageStep[] = [];
    let childReferences: UI.ChildReference[] = [];

    for (let i = 0; i < originalItems.length; i++) {
        const item: StageStep = createStageStep(originalItems[i]);
        items = [...items, item];
        childReferences = updateItemReferences(childReferences, item);
    }

    return {
        items,
        childReferences
    };
}

export function createOrchestratedStageWithItemReferences(stage: OrchestratedStage) {
    const newStage = baseCanvasElement(stage);

    const { stageSteps = [] } = stage;

    const connectors = createConnectorObjects(stage, newStage.guid, null);
    const connectorCount = connectors ? connectors.length : 0;

    const { items, childReferences } = createStageStepsWithReferences(stageSteps);

    Object.assign(newStage, {
        childReferences,
        connectorCount,
        maxConnections: 1,
        elementType,
        dataType: FLOW_DATA_TYPE.ORCHESTRATED_STAGE.value
    });

    return baseCanvasElementsArrayToMap([newStage, ...items], connectors);
}

/**
 * OrchestratedStage from the property editor on close goes to the store
 * @param orchestratedStage
 */
export function createOrchestratedStageWithItemReferencesWhenUpdatingFromPropertyEditor(
    orchestratedStage: OrchestratedStage
) {
    const newOrchestratedStage = baseCanvasElement(orchestratedStage);
    const { stageSteps } = orchestratedStage;

    const { items, childReferences } = createStageStepsWithReferences(stageSteps);

    const { deletedSteps } = getDeletedStepsUsingStore(orchestratedStage, items);

    const deletedStepGuids = deletedSteps.map((step: StageStep) => {
        return step.guid;
    });

    Object.assign(newOrchestratedStage, {
        elementType,
        childReferences,
        maxConnections: 1
    });

    return {
        canvasElement: newOrchestratedStage,
        childElements: items,
        deletedChildElementGuids: deletedStepGuids,
        elementType: ELEMENT_TYPE.ORCHESTRATED_STAGE_WITH_MODIFIED_AND_DELETED_STEPS
    };
}

/**
 * Selector callback used for the orchestratedStageNode to provide data needed
 * for dynamic rendering on the canvas
 * @param guid
 */
export function getSteps(guid: UI.Guid): StageStep[] {
    const orchestratedStage = getElementByGuid<OrchestratedStage>(guid)!;

    return orchestratedStage.childReferences.map(
        (ref: UI.ChildReference): StageStep => {
            return <StageStep>{
                ...getElementByGuid(ref.childReference)!,
                // TODO: W-8051764: This will eventually need to be dynamic based on the step type
                stepTypeLabel: LABELS.workStepLabel
            };
        }
    );
}

export function getOrchestratedStageChildren(): UI.StringKeyedMap<any> {
    return {
        status: {
            label: LABELS.orchestratedStageStatus,
            name: 'Status',
            apiName: 'Status',
            dataType: FLOW_DATA_TYPE.STRING.value
        }
    };
}

export function getStageStepChildren(element: UI.Element): UI.StringKeyedMap<any> {
    // Explicit cast should be safe since we should only call this version
    // with StageSteps
    const step = (element as unknown) as StageStep;
    const comboboxitems: UI.StringKeyedMap<any> = {
        status: {
            label: LABELS.stageStepStatus,
            name: 'Status',
            apiName: 'Status',
            dataType: FLOW_DATA_TYPE.STRING.value
        }
    };

    let outputParameters: ParameterListRowItem[];
    if (step.outputParameters.length > 0) {
        // Use the already loaded output parameters
        outputParameters = step.outputParameters;
    } else {
        // check for asynchronously loaded output parameters for the associated action
        outputParameters = getParametersForInvocableAction({
            actionName: step.actionName,
            actionType: step.actionType,
            dataTypeMappings: []
        })
            .filter((parameter) => {
                return parameter.isOutput;
            })
            .map((outputParameter) => {
                return createOutputParameter({
                    ...outputParameter,
                    valueDataType: outputParameter.dataType
                });
            });
    }

    if (outputParameters && outputParameters.length > 0) {
        comboboxitems.output = {
            label: LABELS.stageStepOutput,
            name: 'Outputs',
            apiName: 'Outputs',
            dataType: FLOW_DATA_TYPE.ACTION_OUTPUT.value,
            isSpanningAllowed: true,
            getChildrenItems: () =>
                outputParameters.map((output: ParameterListRowItem) => ({
                    label: output.name,
                    name: output.name,
                    apiName: output.name,
                    dataType: output.valueDataType
                }))
        };
    }

    return comboboxitems;
}

/**
 * Note: When creating StageSteps during initial load, the output parameters are not
 * available.  They are injected asynchronously by preloadLib.loadParametersForStageStepsInFlow
 * @param step
 */
export function createStageStep(step: StageStep): StageStep {
    const baseStep = { ...step };

    // Default label
    // TODO: This is an incomplete version of the logic needed for full property editor
    // in panel support.  for example, this does not currently prevent duplicate guids
    // https://gus.lightning.force.com/lightning/r/ADM_Work__c/a07B0000007Q6YUIA0/view
    if (!baseStep.label && baseStep.parent) {
        const orchestratedStage = getElementByGuid<OrchestratedStage>(baseStep.parent)!;
        baseStep.label = format(
            LABELS.defaultStageStepName,
            orchestratedStage.childReferences.length + 1,
            orchestratedStage.label
        );
        baseStep.name = sanitizeDevName(baseStep.label);
    }

    // Currently, we only have one step type
    if (!baseStep.stepTypeLabel) {
        baseStep.stepTypeLabel = LABELS.workStepLabel;
    }

    const newStep = <StageStep>baseChildElement(baseStep, ELEMENT_TYPE.STAGE_STEP);

    const { entryConditions = [], action, inputParameters = [], outputParameters = [] } = step;

    if (action) {
        newStep.action = createActionCall(action);
    } else {
        newStep.action = createActionCall({
            actionName: step.actionName,
            actionType: step.actionType
        });
    }

    newStep.entryConditions = entryConditions.map<UI.Condition>(
        (condition) => <UI.Condition>createCondition(condition)
    );

    newStep.inputParameters = inputParameters.map((inputParameter) => createInputParameter(inputParameter));
    // Make sure valueDataType (expected by the ui) is set
    newStep.outputParameters = outputParameters.map((outputParameter) =>
        createOutputParameter({
            ...outputParameter,
            valueDataType: outputParameter.dataType
        })
    );

    newStep.dataType = FLOW_DATA_TYPE.STAGE_STEP.value;

    return { ...step, ...newStep };
}

export function createOrchestratedStageMetadataObject(
    orchestratedStage: OrchestratedStage,
    config = {}
): OrchestratedStage {
    const { childReferences } = orchestratedStage;

    // Hardcoded exit criteria for the step.  This will eventually be moved
    // to be backend
    const exitConditions = childReferences.map(({ childReference }) => {
        const step: StageStep = <StageStep>getElementByGuid(childReference);
        return {
            leftValueReference: `${step.name}.Status`,
            operator: RULE_OPERATOR.EQUAL_TO,
            rightValue: {
                stringValue: 'Completed'
            }
        };
    });

    const stageSteps = childReferences.map(({ childReference }) => {
        const step: StageStep = <StageStep>getElementByGuid(childReference);

        const entryConditionsMetadata = step.entryConditions.map((condition) =>
            createConditionMetadataObject(condition)
        );

        const inputParametersMetadata = step.inputParameters.map((p) => createInputParameterMetadataObject(p));

        return {
            ...baseChildElementMetadataObject(step, config),
            entryConditions: entryConditionsMetadata,
            actionName: step.action ? step.action.actionName : null,
            actionType: step.action ? step.action.actionType : null,
            inputParameters: inputParametersMetadata,
            description: step.description
        };
    });

    const newOrchestratedStage: OrchestratedStage = Object.assign(
        baseCanvasElementMetadataObject(orchestratedStage, config),
        {
            stageSteps,
            exitConditions
        }
    );

    return newOrchestratedStage;
}

function updateItemReferences(childReferences: any[], step: StageStep): UI.ChildReference[] {
    return [
        ...childReferences,
        {
            childReference: step.guid
        }
    ];
}

// TODO: Refactor with Decision and Wait functions here to use common code path
function getDeletedStepsUsingStore(originalOrchestratedStage: OrchestratedStage, newSteps: StageStep[] = []) {
    if (!originalOrchestratedStage) {
        throw new Error('Stepped stage is not defined');
    }
    const { guid } = originalOrchestratedStage;
    const orchestratedStageFromStore = getElementByGuid<OrchestratedStage>(guid);
    let stepReferencesFromStore;
    if (orchestratedStageFromStore) {
        stepReferencesFromStore = orchestratedStageFromStore.childReferences.map((ref) => ref.childReference);
    }

    const newStepGuids = newSteps.map((newStep: StageStep) => newStep.guid);

    let deletedSteps = [];

    if (stepReferencesFromStore) {
        deletedSteps = stepReferencesFromStore
            .filter((stepReferenceGuid) => {
                return !newStepGuids.includes(stepReferenceGuid);
            })
            .map((stepReference) => getElementByGuid(stepReference));
    }
    return { deletedSteps };
}

/**
 * Returns all items in the parent OrchestratedStage *other* than the item passed in.
 * If no parent orchestratedStage is found, an Error is thrown
 * @param guid
 */
export function getOtherItemsInOrchestratedStage(guid: UI.Guid): StageStep[] {
    const parent: OrchestratedStage | null = <OrchestratedStage>getElementsForElementType(
        ELEMENT_TYPE.ORCHESTRATED_STAGE
    ).find((orchestratedStage) => {
        return (orchestratedStage as OrchestratedStage).childReferences.find((ref) => ref.childReference === guid);
    });

    if (!parent) {
        throw Error('No parent OrchestratedStage found for StageStep ' + guid);
    }

    const siblingItems: StageStep[] = [];

    parent.childReferences.forEach((ref) => {
        if (ref.childReference !== guid) {
            siblingItems.push(getElementByGuid<StageStep>(ref.childReference)!);
        }
    });

    return siblingItems;
}
