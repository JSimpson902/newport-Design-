// @ts-nocheck
/*
 * Copyright 2018 salesforce.com, inc.
 * All Rights Reserved
 * Company Confidential
 */

import { api, LightningElement } from 'lwc';

export default class ModalBodyInternalData extends LightningElement {
    @api bodyTextOne;
    @api bodyTextTwo;
    @api listSectionHeader;
    @api listSectionItems;
}
