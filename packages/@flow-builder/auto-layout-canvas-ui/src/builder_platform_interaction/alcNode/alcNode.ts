import { LightningElement, api } from 'lwc';
import { NodeType, NodeRenderInfo, NodeModel, FlowModel, Guid } from 'builder_platform_interaction/autoLayoutCanvas';
import { EditElementEvent, SelectNodeEvent } from 'builder_platform_interaction/events';
import { AlcSelectDeselectNodeEvent } from 'builder_platform_interaction/alcEvents';
import { classSet } from 'lightning/utils';
import { ICON_SHAPE, AutoLayoutCanvasMode, SELECTORS } from 'builder_platform_interaction/alcComponentsUtils';
import { LABELS } from './alcNodeLabels';
import { commonUtils } from 'builder_platform_interaction/sharedUtils';
const { format } = commonUtils;

enum ConditionOptions {
    DEFAULT_PATH = 'DEFAULT_PATH',
    NO_PATH = 'NO_PATH'
}

const DYNAMIC_COMPONENT_SELECTOR = 'dynamic-component';

/**
 * Autolayout Canvas Node Component
 */
export default class AlcNode extends LightningElement {
    _nodeInfo!: NodeRenderInfo;

    // @ts-ignore
    private dynamicNodeConstructor: Function | undefined;

    // @ts-ignore
    private dynamicNodeData: NodeModel;

    private dynamicNodeComp: string | undefined;

    private expanded = false;

    /**
     * The active element refers to the element currently being edited using the property editor panel
     */
    @api
    activeElementGuid;

    @api
    disableAddElements;

    @api
    disableDeleteElements;

    @api
    disableEditElements;

    @api
    get nodeInfo() {
        return this._nodeInfo;
    }

    /**
     * For dynamic node components, call their dynamicNodeComponentSelector
     * with the node guid.  This guarantees that the data refreshes on any
     * change to the node.
     */
    set nodeInfo(nodeInfo: NodeRenderInfo) {
        this._nodeInfo = nodeInfo;

        if (nodeInfo && nodeInfo.metadata.dynamicNodeComponent) {
            if (nodeInfo.metadata.dynamicNodeComponentSelector) {
                this.dynamicNodeData = nodeInfo.metadata.dynamicNodeComponentSelector(nodeInfo.guid);
            }

            this.processDynamicNodeComponent(nodeInfo.metadata.dynamicNodeComponent);
        }
    }

    @api
    canvasMode!: AutoLayoutCanvasMode;

    @api
    flowModel!: Readonly<FlowModel>;

    get labels() {
        return LABELS;
    }

    get isDefaultMode() {
        return this.canvasMode === AutoLayoutCanvasMode.DEFAULT;
    }

    get conditionOptionsForNode() {
        let conditionOptionsForNode;
        if (this.nodeInfo.conditionOptions) {
            conditionOptionsForNode = [
                ...this.nodeInfo.conditionOptions,
                {
                    label: this.nodeInfo.defaultConnectorLabel,
                    value: ConditionOptions.DEFAULT_PATH
                },
                {
                    label: this.labels.deleteAllPathsComboboxLabel,
                    value: ConditionOptions.NO_PATH
                }
            ];
        }
        return conditionOptionsForNode;
    }

    get rotateIconClass() {
        return this.nodeInfo.metadata.iconShape === ICON_SHAPE.DIAMOND
            ? 'rotated-icon-radius slds-icon-standard-decision'
            : '';
    }

    get svgClass() {
        let classes = '';
        if (this.nodeInfo.metadata.iconBackgroundColor) {
            classes = this.nodeInfo.metadata.iconBackgroundColor;
        }

        if (this.nodeInfo.metadata.iconShape === ICON_SHAPE.CIRCLE) {
            classes = `${classes} slds-icon__container_circle`;
        } else if (this.nodeInfo.metadata.iconShape === ICON_SHAPE.DIAMOND) {
            classes = `${classes} rotate-icon-svg`;
        }

        return classes;
    }

    get iconSize() {
        return this.nodeInfo.metadata.iconSize || 'large';
    }

    get showCheckboxInSelectionMode() {
        const { type } = this.nodeInfo.metadata;
        const isValidType =
            (this.canvasMode === AutoLayoutCanvasMode.RECONNECTION && type === NodeType.END) ||
            ![NodeType.START, NodeType.END, NodeType.ROOT].includes(type);

        return this.canvasMode !== AutoLayoutCanvasMode.DEFAULT && isValidType;
    }

    get shouldDisableCheckbox() {
        return this.nodeInfo && this.nodeInfo.config && !this.nodeInfo.config.isSelectable;
    }

    get checkboxIconName() {
        return this.nodeInfo.config && this.nodeInfo.config.isSelected ? 'utility:check' : 'utility:add';
    }

    get checkboxVariant() {
        return this.nodeInfo.config && this.nodeInfo.config.isSelected ? 'brand' : 'border-filled';
    }

    get textContainerClasses() {
        const shifted = this.isShifted;
        const hidden = this.nodeInfo.menuOpened;
        return classSet('slds-is-absolute text-container').add({
            shifted,
            hidden
        });
    }

    /**
     * Set the class for the icon container.
     * 2 classes exist for the highlight because of different icon size and multiple connectors linked to the icon.
     *
     * @returns String of classes for the icon container
     */
    get iconContainerClasses() {
        let vClassSet = classSet('icon-container').add({
            'menu-opened': this.nodeInfo.menuOpened || this.expanded
        });

        if (this.nodeInfo.config.isHighlighted) {
            vClassSet = vClassSet.add({
                'highlighted-container': this.nodeInfo.config.isHighlighted
            });
            if (this.isShifted) {
                vClassSet = vClassSet.add({
                    'highlighted-container-multioutput': this.nodeInfo.config.isHighlighted
                });
            }
        }

        return vClassSet.toString();
    }

    get dynamicNodeClasses() {
        return classSet(DYNAMIC_COMPONENT_SELECTOR)
            .add({
                expanded: this.expanded
            })
            .add(this.dynamicNodeComp?.split('/')[1]);
    }

    get isShifted() {
        return (this.nodeInfo.flows || []).length > 0 || this.nodeInfo.faultFlow != null;
    }

    get nodeLabel() {
        let label = this.nodeInfo.label;
        // Start has a dynamic label that is set in the metadata.
        if (!label && this.nodeInfo.metadata.type === NodeType.START) {
            label = this.nodeInfo.metadata.description;
        }
        return label;
    }

    get iconAriaLabel() {
        // Use description in metadata as label for element whose label is not set (start node for example)
        const label = this.nodeInfo.label ? this.nodeInfo.label : this.nodeInfo.metadata.description;
        return format(this.labels.ariaLabelNode, this.nodeInfo.metadata.elementType, label);
    }

    get showElementType() {
        return this.nodeInfo.metadata.type !== NodeType.END;
    }

    get hasIncomingGoto() {
        return this.nodeInfo.node && this.nodeInfo.node.incomingGoTo && this.nodeInfo.node.incomingGoTo.length > 0;
    }

    get incomingGoToLabel() {
        return format(this.labels.incomingGoToLabel, this.nodeInfo.node?.incomingGoTo?.length);
    }

    /** ***************************** Helper Functions */

    /**
     * Import the constructor and update the component params
     *
     * Note: all of this needs to happen in a single tick, otherwise the component
     * constructor and params could be out of sync (old constructor with new params
     * or new constructor with old params)
     *
     * @param comp dynamic node component
     */
    // eslint-disable-next-line @lwc/lwc/no-async-await
    async processDynamicNodeComponent(comp: string): Promise<void> {
        // TODD: include node attributeInfo

        if (comp) {
            // eslint-disable-next-line lwc-core/no-dynamic-import, lwc-core/no-dynamic-import-identifier
            const module = await import(comp);

            this.dynamicNodeConstructor = module.default;
            this.dynamicNodeComp = comp;
        }
    }

    /** ***************************** Public Functions */

    @api
    focus() {
        const selector = !this.isDefaultMode ? '.selection-checkbox' : 'builder_platform_interaction-alc-menu-trigger';
        this.template.querySelector(selector).focus();
    }

    @api
    findNode(guid: Guid) {
        const xLazy = this.template.querySelector(SELECTORS.xLazy);
        return xLazy.findNode(guid);
    }

    /** ***************************** Event Handlers */

    /**
     * Handles the edit element event and fires SelectNodeEvent
     *
     * When 'single click updates the store' is implemented in the future,
     * this.nodeInfo.config.isSelected inside the event can be read
     * by handlers at different levels to learn about the historical selection
     * status even after the store is updated
     *
     * @param event - clicked event coming from alcMenuTrigger.js
     */
    handleButtonClick(event: Event) {
        event.stopPropagation();
        const { type } = this.nodeInfo.metadata;
        if (this.canvasMode === AutoLayoutCanvasMode.DEFAULT && type !== NodeType.END) {
            const nodeSelectedEvent = new SelectNodeEvent(
                this.nodeInfo.guid,
                undefined,
                this.nodeInfo.config.isSelected
            );
            this.dispatchEvent(nodeSelectedEvent);
        }
    }

    /**
     * Handles double click on the node and dispatches the EditElementEvent
     *
     * @param event - double click event fired on double clicking the node
     */
    handleOnDblClick(event: Event) {
        event.stopPropagation();
        const { type } = this.nodeInfo.metadata;
        if (type !== NodeType.START && type !== NodeType.END && this.canvasMode === AutoLayoutCanvasMode.DEFAULT) {
            this.dispatchEvent(new EditElementEvent(this.nodeInfo.guid));
        }
    }

    /**
     * Handles the click on the selection checkbox and dispatches an event to toggle
     * the selected state of the node.
     *
     * @param event - click event fired when clicking on the selection checkbox
     */
    handleSelectionCheckboxClick = (event: Event) => {
        event.stopPropagation();
        const toggleNodeSelectionEvent = new AlcSelectDeselectNodeEvent(
            this.nodeInfo.guid,
            this.nodeInfo.config.isSelected
        );
        this.dispatchEvent(toggleNodeSelectionEvent);
    };

    /**
     * Handles the toggling of the popover menu component.
     *
     * @param event - the event fired when popover toggled
     */
    handlePopoverToggled(event) {
        this.expanded = event.detail.opened;
    }
}
