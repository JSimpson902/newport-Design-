import actionFlowComponentDescription  from '@salesforce/label/FlowBuilderLeftPanelElements.actionFlowComponentDescription';
import createDataOperationDescription from '@salesforce/label/FlowBuilderLeftPanelElements.createDataOperationDescription';
import deleteDataOperationDescription from '@salesforce/label/FlowBuilderLeftPanelElements.deleteDataOperationDescription';
import updateDataOperationDescription from '@salesforce/label/FlowBuilderLeftPanelElements.updateDataOperationDescription';
import lookupDataOperationDescription from '@salesforce/label/FlowBuilderLeftPanelElements.lookupDataOperationDescription';
import decisionLogicDescription from '@salesforce/label/FlowBuilderLeftPanelElements.decisionLogicDescription';
import decisionLogicLabel from '@salesforce/label/FlowBuilderLeftPanelElements.decisionLogicLabel';
import newActionLabel  from '@salesforce/label/FlowBuilderElementConfig.newActionLabel';
import screenComponentDescription from '@salesforce/label/FlowBuilderLeftPanelElements.screenComponentDescription';
import screenComponentLabel from '@salesforce/label/FlowBuilderLeftPanelElements.screenComponentLabel';
import waitLogicDescription from '@salesforce/label/FlowBuilderLeftPanelElements.waitLogicDescription';
import waitLogicLabel from '@salesforce/label/FlowBuilderLeftPanelElements.waitLogicLabel';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { ElementType } from 'builder_platform_interaction/autoLayoutCanvas';


export default [
    {
        section: 'Interaction',
        type: ElementType.DEFAULT,
        icon: 'standard:screen',
        label: screenComponentLabel,
        value: ELEMENT_TYPE.SCREEN,
        elementType: ELEMENT_TYPE.SCREEN,
        description: screenComponentDescription,
        canHaveFaultConnector: false,
        supportsMenu: true
    },
    {
        section: 'Interaction',
        type: ElementType.DEFAULT,
        icon: 'standard:lightning_component',
        iconBackgroundColor: 'background-navy',
        label: newActionLabel,
        value: ELEMENT_TYPE.ACTION_CALL,
        elementType: ELEMENT_TYPE.ACTION_CALL,
        description: actionFlowComponentDescription,
        canHaveFaultConnector: true,
        supportsMenu: true
    },
    {
        section: 'Flow Control',
        type: ElementType.BRANCH,
        icon: 'standard:decision',
        iconShape: 'diamond',
        label: decisionLogicLabel,
        value: ELEMENT_TYPE.DECISION,
        elementType: ELEMENT_TYPE.DECISION,
        description: decisionLogicDescription,
        canHaveFaultConnector: false,
        supportsMenu: true
    },
    {
        section: 'Flow Control',
        type: ElementType.BRANCH,
        icon: 'standard:waits',
        label: waitLogicLabel,
        value: ELEMENT_TYPE.WAIT,
        elementType: ELEMENT_TYPE.WAIT,
        description: waitLogicDescription,
        canHaveFaultConnector: true,
        supportsMenu: true
    },
    {
        section: 'Data Operation',
        type: ELEMENT_TYPE.RECORD_CREATE,
        icon: 'standard:record_create',
        label: ELEMENT_TYPE.RECORD_CREATE,
        value: ELEMENT_TYPE.RECORD_CREATE,
        elementType: ELEMENT_TYPE.RECORD_CREATE,
        description: createDataOperationDescription,
        canHaveFaultConnector: true,
        supportsMenu: true
    },
    {
        section: 'Data Operation',
        type: ELEMENT_TYPE.RECORD_UPDATE,
        icon: 'standard:record_update',
        label: ELEMENT_TYPE.RECORD_UPDATE,
        value: ELEMENT_TYPE.RECORD_UPDATE,
        elementType: ELEMENT_TYPE.RECORD_UPDATE,
        description: lookupDataOperationDescription,
        canHaveFaultConnector: true,
        supportsMenu: true
    },
    {
        section: 'Data Operation',
        type: ELEMENT_TYPE.RECORD_LOOKUP,
        icon: 'standard:record_lookup',
        label: ELEMENT_TYPE.RECORD_LOOKUP,
        value: ELEMENT_TYPE.RECORD_LOOKUP,
        elementType: ELEMENT_TYPE.RECORD_LOOKUP,
        description: updateDataOperationDescription,
        canHaveFaultConnector: true,
        supportsMenu: true
    },
    {
        section: 'Data Operation',
        type: ELEMENT_TYPE.RECORD_DELETE,
        icon: 'standard:record_delete',
        label: ELEMENT_TYPE.RECORD_DELETE,
        value: ELEMENT_TYPE.RECORD_DELETE,
        elementType: ELEMENT_TYPE.RECORD_DELETE,
        description: deleteDataOperationDescription,
        canHaveFaultConnector: true,
        supportsMenu: true
    },
    {
        section: null,
        type: ElementType.START,
        icon: 'standard:default',
        label: 'Start',
        value: ELEMENT_TYPE.START_ELEMENT,
        elementType: ELEMENT_TYPE.START_ELEMENT,
        description: null,
        canHaveFaultConnector: false
    }
];
