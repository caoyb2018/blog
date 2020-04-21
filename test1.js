//单例模式代码
// var Storage = (function(){
//     var instance = null;
//     var obj = {}
//     Storage = function(key, value){
//         if(!instance) {
//             this.init(key, value);
//             instance = this;
//         }
//         return instance;
//     }
//     Storage.prototype.init = function(key, value){
//         instance.setItem() = function(){
//             instance[key] = value
//         }
//         instance.getItem() = function(){
//             return instance[key]
//         }
//     }
//     return Storage;
// })()

// var CreateDiv = function(html) {
//     this.html = html;
//     this.init()
// }

// CreateDiv.prototype.init = function() {
//     var div = document.createElement('div');
//     div.innerHTML = this.html;
//     document.body.appendChild(div)
// }

// var ProxySingletonCreateDiv = (function() {
//     var instance = null;
//     return function(html) {
//         if(!instance) {
//             instance = new CreateDiv(html)
//         }
//         return instance;
//     }
// })()

// var div = function(html){
//     var div = document.createElement('div');
//     div.innerHTML=html;
//     return div
// }

// var button = function(html){
//     var button = document.createElement('button');
//     button.innerHTML=html;
//     return button
// }

// var getSingle = (function(){
//     var result = null;
//     return function(html) {
//         if(!result){
//            result = fn.apply(this, arguments)
//         }
//         return result
//     }
// })()

//策略模式代码

// var calculateBonus = function( performanceLevel, salary ) {
//     if(performanceLevel === 'S') {
//         return salary*4;
//     }else if(performanceLevel === 'A') {
//         return salary*3;
//     }else if(performanceLevel === 'B') {
//         return salary*2
//     }
// }

// var performanceS = {
//     calculate: function(salary) {
//         return salary*4
//     }
// }

// var performanceA = {
//     calculate: function(salary) {
//         return salary*3
//     }
// }

// var performanceB = {
//     calculate: function(salary) {
//         return salary*2
//     }
// }

// var Bonus = function(){
//     this.salary = null;
//     this.startegy = null;
// }

// Bonus.prototype.setSalary = function(salary) {
//     this.salary = salary
// }

// Bonus.prototype.setStartegy = function(startegy) {
//     this.startegy = startegy;
// }

// Bonus.prototype.getBonus = function(){
//     if(!this.salary || !this.startegy){
//         throw new Error()
//     }
//     return this.startegy.calculate(this.salary)
// }

// var startegy = {
//     "S": function(salary){
//         return salary*4
//     },
//     "A": function(salary){
//         return salary*3
//     },
//     "B": function(salary){
//         return salary*2
//     }
// }

// var calculateBonus = function(level, salary) {
//     return startegy[level](salary)
// }

//代理模式代码
// var Flower = function(){};

// var xiaoming = {
//     sendFlower: function(target) {
//         var flower = new Flower();
//         target.receiveFlower(flower)
//     }
// }

// var A = {
//     receiveFlower: function(flower){
//         console.log(`get${flower}`)
//     }
// }

// xiaoming.sendFlower(A)

// var Flower = function(){};

// var xiaoming = {
//     sendFlower: function(target) {
//         var flower = new Flower();
//         target.receiveFlower(flower)
//     }
// }

// var B = {
//     receiveFlower: function(flower) {
//         A.receiveFlower(flower)
//     }
// }

// var A = {
//     receiveFlower: function(flower){
//         console.log(`get${flower}`)
//     }
// }

// xiaoming.sendFlower(B)

// var Flower = function(){};

// var xiaoming = {
//     sendFlower: function(target) {
//         var flower = new Flower();
//         target.receiveFlower(flower)
//     }
// }

// var B = {
//     receiveFlower: function(flower) {
//         A.listenGoodMood(function(){
//             A.receiveFlower()
//         })
//     }
// }

// var A = {
//     receiveFlower: function(flower){
//         console.log(`get${flower}`)
//     },
//     listenGoodMood: function(fn) {
//         setTimeout(function(){
//             fn()
//         }, 1000)
//     }
// }

// xiaoming.sendFlower(B)

// var myImage = (function(){
//     var imgNode = document.createElement('img');
//     document.body.appendChild(imgNode);

//     return {
//         setSrc: function(src) {
//             imgNode.src = src
//         }
//     }
// })()

// var proxyImage =(function(){
//     var img = new Image;
//     img.onload = function(){
//         myImage.src= this.src
//     }
//     return {
//         setSrc: function(src){
//             myImage.setSrc('loading.gif')
//             img.src= src
//         }
//     }
// })()

// proxyImage.setSrc('test.png')

{/* <body>
    <input type='checkbox' id='1'></input>1
    <input type='checkbox' id='2'></input>2
    <input type='checkbox' id='3'></input>3
    <input type='checkbox' id='4'></input>4
    <input type='checkbox' id='5'></input>5
    <input type='checkbox' id='6'></input>6
    <input type='checkbox' id='7'></input>7
    <input type='checkbox' id='8'></input>8
    <input type='checkbox' id='9'></input>9
    <input type='checkbox' id='10'></input>10
</body>

var requestCheckBox = function(id){
    console.log(`${id}开始请求`)
}

var proxyRequestCheckBox = (function(){
    var cache = []
    var timer = null;
    return function(id) {
        cache.push(id)
        if(timer){
            return
        }
        timer = setTimeout(function(){
            requestCheckBox(cache.join(','))
            clearTimeout(timer)
            timer=null
            cache=[]
        },2000)
    }
})()

var checkbox = document.getElementsByTagName('input');

for(var i=0, c; c=checkbox[ i++ ];){
    c.onclick = function(){
        if(this.checked === true ) {
            proxyRequestCheckBox(this.id)
        }
    }
} */}

// var mult = function(){ //乘积
//     var a= 1;
//     for(var i=0, l= arguments.length; i<l; i++) {
//         a= a* arguments[i]
//     }
//     return a;
// }

// var plus = function(){//加和
//     var a=0;
//     for(var i=0, l=arguments.length; i<l; i++) {
//         a= a+ arguments[i]
//     }
//     return a;
// }

// var createProxyFactory = function(fn){
//     var cache = {};
//     return function(){
//         var args = Array.prototype.join.call( arguments, ',');
//         if(args in cache){
//             return cache[args]
//         }
//         return cache[args] = fn.apply(this, arguments)
//     }
// }

// var proxyMult = createProxyFactory(mult);
// var proxyPlus = createProxyFactory(plus);

// proxyMult(1,2,3,4)
// proxyMult(1,2,3,4)
// proxyPlus(1,2,3,4)
// proxyPlus(1,2,3,4)

//迭代器模式代码

[1,2,3,4].map((item, index)=>{
    console.log(`下标${index}`)
    console.log(`值${item}`)
})

