class LaravelRequest extends SafirHttpRequest {
    constructor(options) {
        super(options);
        let header = document.querySelector('meta[name="csrf-token"]');
        this.headers['Accept'] = 'application/json';
        if(header) {
            this.headers['X-CSRF-TOKEN'] = header.getAttribute('content');
        }

    }
}
class LaravelForm extends SafirForm {
    constructor(selector) {
        super(selector, LaravelRequest);
    }
}
