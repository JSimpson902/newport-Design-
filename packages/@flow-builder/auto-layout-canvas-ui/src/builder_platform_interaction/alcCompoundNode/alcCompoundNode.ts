import { LightningElement, api } from 'lwc';

import { NodeRenderInfo } from 'builder_platform_interaction/autoLayoutCanvas';
import {
    AutoLayoutCanvasMode,
    getAlcConnectorData,
    getAlcFlowData,
    getAlcNodeData
} from 'builder_platform_interaction/alcComponentsUtils';

/**
 *  Auto layout Canvas Compound Node
 *  This components renders a node, along with its branches, faults and connectors it may have
 */
export default class AlcCompoundNode extends LightningElement {
    @api
    node!: NodeRenderInfo;

    @api
    canvasMode!: AutoLayoutCanvasMode;

    @api
    disableAddElements;

    /**
     * The active element refers to the element currently being edited using the property editor panel
     */
    @api
    activeElementGuid;

    get simpleNode() {
        return getAlcNodeData(this.node);
    }

    get branches() {
        return (this.node.flows || []).map((flowInfo, i) => getAlcFlowData(flowInfo, this.node, i));
    }

    get logicConnectors() {
        return (this.node.logicConnectors || []).map(getAlcConnectorData);
    }

    get nextConnector() {
        const { nextConnector } = this.node;

        return nextConnector && getAlcConnectorData(nextConnector);
    }

    @api
    getNextConnector() {
        const nextConnector = this.nextConnector;
        if (nextConnector != null) {
            return this.template.querySelector(
                `builder_platform_interaction-alc-connector[data-key='${nextConnector.key}']`
            );
        }

        return undefined;
    }

    @api
    getNestedFlow(branchIndex: number) {
        return this.template.querySelectorAll('builder_platform_interaction-alc-flow')[branchIndex];
    }

    @api
    focus() {
        this.template.querySelector('builder_platform_interaction-alc-node').focus();
    }
}
