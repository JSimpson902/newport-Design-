import { Element, api } from 'engine';

/**
 * Dummy lightning button component for use by Jest tests
 *
 * @ScrumTeam Process UI
 * @author Jesenia Garcia-Rovetta
 * @since 214
 */
export default class LightningCombobox extends Element {
@api name;
@api value;
@api label;
@api disabled;
@api options;
}
