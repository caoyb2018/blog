var createDiv = (function(){
    var instance = null;
    createDiv = function(html){
        if(!instance) {
            this.html = html;
            this.init();
            instance = this;
        }
        return instance;
    }
    createDiv.prototype.init = function(){
        var div = document.createElement('div');
        div.innerHTML = this.html;
        document.body.appendChild(div);
    }
    return createDiv;
})()