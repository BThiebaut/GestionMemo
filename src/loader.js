function Loader(container){
    this.container = container;
    this.configName = "";
    this.app = null;
    
    this.apiUrlConfig = 'https://memo.thiebaut.me/index.php';
    self = this;
    
    this.app = function(){
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        
        self.configName = urlParams.get('memo');
        if (self.configName === null){
            self.configName = "";
        }

        self.app = new Vue({
            el : self.container,
            data : {
                config : null,
                configList : null,
                searchcategory : "",
                searchvalue : "",
                noresult : false,
            },
            mounted : function(){
                this.loadConfig();
            },
            methods: {
                loadConfig : function(){
                    var url = self.apiUrlConfig+'?memo=' + self.configName;
                    var tthis = this;
                    fetch(url)
                    .then(function(response) {
                        return response.json();
                    })
                    .then(function(jsonResponse) {
                        if (self.configName !== ""){
                            let result = {};
                            for(var i in jsonResponse.datas){
                                var val = jsonResponse.datas[i];
                                result[i] = {
                                    value  : i,
                                    initial: i,
                                    edit   : false,
                                    childs : {}
                                };

                                for (var j in val){
                                    var child = val[j];
                                    result[i].childs[j] = {
                                        value  : child,
                                        initial: child,
                                        edit   : false,
                                    };
                                }
                            }
                            tthis.config = result;
                            console.log(tthis.config);
                        }else {
                            tthis.configList = jsonResponse;
                        }
                    });
                },
                search : function(cat){
                    var prop = 'search' + cat;
                    this.noresult = false;
                    $('.filterable').removeClass('d-none');
                    $('.filterable').removeClass('keep');
                    var search = this[prop].toLowerCase();
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
                    if(e.keyCode == 27){
                        model.edit = false;
                        model.value = ""+model.initial;
                    }else if (e.keyCode == 13) {
                        model.initial = ""+model.value;
                        model.edit = false;
                        this.processPut();
                    }
                },
                processPut : function(){
                    var datas = {};
                    for(var i in this.config){

                    }
                }
            },
        })
    };
    
}

window.Loader = Loader;