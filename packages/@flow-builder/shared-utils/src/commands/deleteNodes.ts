// @ts-nocheck
import { BaseCommand } from './baseCommand';
import deleteNodesCommandLabel from '@salesforce/label/FlowBuilderKeyboardInteractionLabels.deleteNodesCommandLabel';
const commandName = 'deletenodes';
export class DeleteNodesCommand extends BaseCommand {
    /**
     * Command to delete nodes in the canvas
     */
    constructor(callback) {
        super(callback, commandName, deleteNodesCommandLabel, false);
    }
    static COMMAND_NAME = commandName;
}
