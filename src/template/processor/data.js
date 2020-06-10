/**
 * Attache current context data to the DOM element
 */
class SafirDataAttributeProcessor extends SafirBaseProcessor {
    static _name = 'attach-data';

    process(node, target, parent_processor) {
        // Delete this to prevent infinite loop
        node.tmpl_attributes.delete(SafirDataAttributeProcessor._name);
        node.append_data = true;
        parent_processor.process(node, target);
    }
}