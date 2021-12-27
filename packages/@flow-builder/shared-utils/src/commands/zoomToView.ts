// @ts-nocheck
import zoomToViewCommandLabel from '@salesforce/label/FlowBuilderKeyboardInteractionLabels.zoomToViewCommandLabel';
import { BaseCommand } from './baseCommand';
const commandName = 'zoomtoview';
export class ZoomToViewCommand extends BaseCommand {
    /**
     * Command to zoom-to-view the canvas
     *
     * @param {Function} callback The function to invoke.
     */
    constructor(callback) {
        super(callback, commandName, zoomToViewCommandLabel, false);
    }
    static COMMAND_NAME = commandName;
}
