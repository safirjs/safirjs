class BootstrapEditableFormHelper extends SafirView {
    constructor(selector, options) {
        super(selector, options);
        this.addToggleListener();
        this.addEditableListener();
    }

    addEditableListener() {
        let elements = this.elt.querySelectorAll('.form-control-editable');
        if (elements.length > 0) {
            let form = this;
            elements.forEach(function (element, index) {
                element.addEventListener('click', form.showEditable.bind(form));
            });
        }
    }

    addToggleListener() {
        let trigger = this.elt.querySelector('.form-editable-toggle');
        trigger.addEventListener('click', this.onToggleClick.bind(this));
    }

    onToggleClick() {
        this.showEditable();
    }

    showEditable() {
        let elements = this.elt.querySelectorAll('.form-control-editable');
        this.showEditableFormControls(elements);

        let editable = this.elt.querySelectorAll('.form-edit-only');
        if (editable.length > 0) {
            editable.forEach(function (element, index) {
                element.classList.remove('form-edit-only');
            });
        }

        let display = this.elt.querySelectorAll('.form-display-only');
        if (display.length > 0) {
            display.forEach(function (element, index) {
                element.classList.add('d-none');
            });
        }
    }

    showEditableFormControls(elements) {
        if (elements.length > 0) {
            elements.forEach(function (element, index) {
                element.classList.remove('form-control-plaintext');
                element.classList.add('form-control');
                element.readOnly = false;
            });
        }
    }
}