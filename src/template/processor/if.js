/**
 * Base class for IF-* processors. provide some helper function.
 */
class SafirIfBaseProcessor extends SafirConditionalProcessor {

    static _tag_attribute_name = 'test';

    getHtmlCondition(node, name) {
        let attr = node.html_attributes.get(name);
        return node.get(attr);
    }

    getTmplCondition(node, name) {
        let attr = node.tmpl_attributes.get(name);
        return node.get(attr);
    }
}

/**
 * IF tag processor
 * @example
 * <sf:if test="show"> ... text ... </sf:if>
 * The text will be displayed if *show* is evaluated to true
 */
class SafirIfTagProcessor extends SafirIfBaseProcessor {
    static _name = 'if';
    process(node, target, parent_processor) {
        let cond = this.getHtmlCondition(node, SafirIfBaseProcessor._tag_attribute_name);
        this.process_if(node, target, parent_processor, cond, true);
    }
}

/**
 * IF-NOT tag processor
 * @example
 * <sf:if-not test="show"> ... text ... </sf:if-not>
 * The text will be displayed if *show* is evaluated to false
 */
class SafirIfNotTagProcessor extends SafirIfBaseProcessor {
    static _name = 'if-not';
    process(node, target, parent_processor) {
        let cond = this.getHtmlCondition(node, SafirIfBaseProcessor._tag_attribute_name);
        this.process_if(node, target, parent_processor, cond, false);
    }
}

// @TODO create an sf:else processor

/**
 * IF attribute processor
 * @example
 * <p sf:if="show"> ... text ... </p>
 * The element <p> and it's children will be displayed if *show* is evaluated to true
 */
class SafirIfAttributeProcessor extends SafirIfBaseProcessor {
    static _name = 'if';
    process(node, target, parent_processor) {
        let cond = this.getTmplCondition(node, SafirIfAttributeProcessor._name);
        node.tmpl_attributes.delete(SafirIfAttributeProcessor._name);
        this.process_if(node, target, parent_processor, cond, true);
    }
}

/**
 * IF-NOT attribute processor
 * @example
 * <p sf:if-not="show"> ... text ... </p>
 * The element <p> and it's children will be displayed if *show* is evaluated to false
 */
class SafirIfNotAttributeProcessor extends SafirIfBaseProcessor {
    static _name = 'if-not';
    process(node, target, parent_processor) {
        let cond = this.getTmplCondition(node, SafirIfNotAttributeProcessor._name);
        node.tmpl_attributes.delete(SafirIfNotAttributeProcessor._name);
        this.process_if(node, target, parent_processor, cond, false);
    }
}