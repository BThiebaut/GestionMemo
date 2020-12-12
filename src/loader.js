function Loader(container){
    this.container = container;
    this.configName = "";
    this.jsonResponse = null;
    this.appVue = null;
    
    this.apiUrlConfig = 'https://memo.thiebaut.me/api.php';
    self = this;

    this.escapeHtml = function(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    };
    
    this.app = function(){
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        
        self.configName = urlParams.get('memo');
        if (self.configName === null){
            self.configName = "";
        }

        self.appVue = new Vue({
            el : self.container,
            data : {
                config : null,
                configList : null,
                searchcategory : "",
                searchvalue : "",
                noresult : false,
                memoName : "",
                username : "",
                password : "",
                authError : false,
                authVisible : false,
                cacheAuth : false,
                addInput : "",
                addInputCat : "",
                addCat : false,
            },
            mounted : function(){
                if (localStorage.username) {
                    this.username = localStorage.username;
                }
                if (localStorage.password) {
                    this.password = localStorage.password;
                }
                this.promptUser();
            },
            methods: {
                logout : function(){
                    delete localStorage.username;
                    delete localStorage.password;
                    window.location.reload();
                },
                getFetchHeader : function(){
                    var tthis = this;
                    return new Headers({
                        'X-AUTH-TOKEN': btoa(tthis.username + ':' + tthis.password), 
                        'Content-Type': 'text/plain',
                    });
                },
                promptUser : function(){
                    if (this.username !== '' && this.password !== ''){
                        this.cacheAuth = true;
                        this.validateUser();
                    }else {
                        jQuery('#authModal').modal({
                            backdrop: 'static'
                        });
                        this.authVisible = true;
                    }
                },
                validateUser : function(){
                    var url = self.apiUrlConfig;
                    var tthis = this;
                    if (tthis.username !== "" && tthis.password !== ""){
                        fetch(url, {
                            methods : 'GET',
                            headers : tthis.getFetchHeader()
                        })
                        .then(res => res.json())
                        .then(ok => {
                            localStorage.username = tthis.username;
                            localStorage.password = tthis.password;
                            tthis.cacheAuth = true;
                            tthis.authError = false;
                            jQuery('#authModal').modal('hide');
                            tthis.authVisible = false;
                            tthis.loadConfig();
                        }).catch(err => {
                            tthis.authError = true;
                            if (!tthis.authVisible){
                                tthis.authVisible = true;
                                jQuery('#authModal').modal({
                                    backdrop: 'static'
                                });
                            }
                        })
                    }
                },
                sortConfig : function(){
                    var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                    var buffer = Object.assign({}, this.config);
                    var keys = [];
                    for (var i in buffer){
                        keys[i] = i;
                    }
                    
                    var newBuffer = {};
                    keys = keys.sort(collator.compare);
                    for(var h in keys){
                        newBuffer[h] = buffer[h];
                    }

                    this.config = newBuffer;
                },
                loadConfig : function(){
                    var url = self.apiUrlConfig+'?memo=' + self.configName;
                    var tthis = this;
                    fetch(url, {
                        method : 'GET',
                        headers : tthis.getFetchHeader()
                    })
                    .then(function(response) {
                        return response.json();
                    })
                    .then(function(jsonResponse) {
                        if (self.configName !== ""){
                            let result = {};
                            tthis.memoName = jsonResponse.name;
                            for(var i in jsonResponse.datas){
                                var val = jsonResponse.datas[i];
                                result[i] = {
                                    value  : i,
                                    initial: i,
                                    edit   : false,
                                    childs : {},
                                    deleted: false,
                                    add: false,
                                };

                                for (var j in val){
                                    var child = val[j];
                                    result[i].childs[j] = {
                                        value  : child,
                                        initial: child,
                                        edit   : false,
                                        deleted: false,
                                    };
                                }
                            }
                            tthis.config = result;
                        }else {
                            tthis.configList = jsonResponse;
                        }
                        self.jsonResponse = jsonResponse;
                        
                    });
                },
                search : function(cat){
                    var prop = 'search' + cat;
                    this.noresult = false;
                    $('.filterable').removeClass('d-none');
                    $('.filterable').removeClass('keep');
                    var search = self.escapeHtml(this[prop].toLowerCase());
                    if (search){
                        var selector = '.search-'+ cat +'[data-value*="'+ search +'"]';
                        var matchs = $(selector);
                        if (matchs.length > 0){
                            matchs.addClass('keep');
                            $('.filterable.search-'+ cat).not('.keep').addClass('d-none');
                            $('.filterable.search-'+ cat).not('.keep').each(function(idx, item){
                                if ($(item).parent().parent().find('.keep').length == 0){
                                    $(item).parent().parent().addClass('d-none');
                                }
                            });
                        }else {
                            this.noresult = true;
                        }
                        
                    }
                },
                edit : function(e, model){
                    model.edit = true;
                    $(e.target).parent().parent().find('input').focus();
                },
                submit : function(e, model){
                    var tthis = this;
                    if(e.keyCode == 27){
                        model.edit = false;
                        model.value = ""+model.initial;
                    }else if (e.keyCode == 13) {
                        model.value = model.value.trim();
                        model.initial = ""+model.value;
                        model.edit = false;
                        this.processPut().then(res => {
                            vNotify.success({text : 'Modification enregistrée', title : 'Succès'});
                        }).catch(err => {
                            vNotify.error({text : 'Erreur lors de l\'enregistrement', title : 'Erreur'});
                        });
                    }
                },
                deleteInput : function(e, category, child){
                    let confirm = window.confirm("Sûr ?");
                    if (confirm){
                        if (typeof child !== typeof void(0)){
                            child.deleted = true;
                        }else {
                            category.deleted = true;
                        }
                        this.processPut().then(res => {
                            vNotify.success({text : 'Suppression effectuée', title : 'Succès'});
                        }).catch(err => {
                            vNotify.error({text : 'Erreur lors de la suppression', title : 'Erreur'});
                        });;
                    }
                },
                toggleAddInput : function(category){
                    if (typeof category !== typeof void(0)){
                        category.add = !category.add;
                        this.addInput = "";
                    }else {
                        this.addCat = !this.addCat;
                        this.addInputCat = "";
                    }
                },
                add : function(e, category){

                    if(e.keyCode == 27){
                        this.toggleAddInput(category);
                    }else if (e.keyCode != 13) {
                        return;
                    }
                    var buffer = Object.assign({}, this.config);
                    
                    if (typeof category !== typeof void(0)){
                        if (this.addInput == ""){
                            return;
                        }
                        this.addInput = this.addInput.trim();
                        if (typeof this.config[category].childs[this.addInput] !== typeof void(0)){
                            vNotify.error({text : 'Cette catégorie existe déjà', title : 'Erreur'});
                            return;
                        }
                        
                        buffer[category].childs[this.addInput] = {
                            value  : this.addInput,
                            initial: this.addInput,
                            edit   : false,
                            deleted: false,
                        };
                    }else {
                        if (this.addInputCat == ""){
                            return;
                        }
                        this.addInputCat = this.addInputCat.trim();
                        if (typeof buffer[this.addInputCat] !== typeof void(0)){
                            vNotify.error({text : 'Cette catégorie existe déjà', title : 'Erreur'});
                            return;
                        }
                        buffer[this.addInputCat] = {
                            value  : this.addInputCat,
                            initial: this.addInputCat,
                            edit   : false,
                            deleted: false,
                            childs : {},
                        };
                    }
                    this.addInput = "";
                    this.config = buffer;
                    this.$forceUpdate();
                    this.toggleAddInput(category);
                    this.processPut().then(res => {
                        vNotify.success({text : 'Entrée ajoutée', title : 'Succès'});
                    }).catch(err => {
                        vNotify.error({text : 'Erreur lors de l\'ajout', title : 'Erreur'});
                    });;
                },
                processPut : function(){
                    let datas = {};
                    let tthis = this;
                    for(let i in this.config){
                        let cat = this.config[i];
                        if (!cat.deleted){
                            datas[cat.value] = [];
    
                            for(let j in cat.childs){
                                let val = cat.childs[j];
                                if (!val.deleted){
                                    datas[cat.value].push(val.value);
                                }
                            }
                        }
                    }
                    var json = {
                        name : self.jsonResponse.name,
                        datas : datas
                    };
                    
                    var url = self.apiUrlConfig+'?memo=' + self.configName;
                    return fetch(url, {
                        method: 'PUT',
                        body : JSON.stringify(json),
                        headers : tthis.getFetchHeader()
                    }).then(res => res.status);

                },
                copy : function(e){
                    console.log(e.target.innerText);
                    //document.execCommand("copy");
                }
            },
        })
    };
    
}

window.Loader = Loader;