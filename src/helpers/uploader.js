class SafirFileUploader {
    constructor(options) {

        this.target = document.getElementById(options.target);
        this.preview = document.getElementById(options.preview);
        this.template = document.getElementById(options.template);
        this.max_size = options.max_size || (1024 * 1024);
        this.max_count = options.max_count || 10;
        this.addTargetEventListener();
    }

    addTargetEventListener()
    {
        if(this.target) {
            this.target.addEventListener('change', this.loadPreview.bind(this));
        }
    }

    loadPreview()
    {
        let files = this.target.files;

        let template = new SafirTemplate(this.template);

        if(files.length > 0) {

            for (let i = 0; i < files.length && i < this.max_count; i++) {

                const file = files[i];

                // if (!file.type.startsWith('image/')){
                //     continue;
                // }

                let data = {index : i};

                if(file.size > this.max_size) {
                    data.valid_size = false;
                } else {
                    data.valid_size = true;
                }

                const reader = new FileReader();
                reader.onload = (function(_template, _preview, _data) { return function(e) {
                    _data.file_data = e.target.result;
                    _template.render(_preview, _data);

                }; })(template, this.preview, data);

                reader.readAsDataURL(file);
            }
        }
    }
}