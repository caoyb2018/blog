// function Father(){
// 	this.property = true;
// }
// Father.prototype.getFatherValue = function(){
// 	return this.property;
// }
// function Son(){
// 	this.sonProperty = false;
// }
// //继承 Father
// Son.prototype = new Father();//Son.prototype被重写,导致Son.prototype.constructor也一同被重写
// Son.prototype.getSonVaule = function(){
// 	return this.sonProperty;
// }
// var instance = new Son();
// alert(instance.getFatherValue());//true


// function Father(){
//   this.colors = ["red","blue","green"];
//   this.run = function(){
//     console.log('run')
//   }
// }
// function Son(){
//   Father.call(this);//继承了Father,且向父类型传递参数
//   this.run = function(){
//     console.log('run1')
//   }
// }
// var instance1 = new Son();
// instance1.run()
// instance1.colors.push("black");
// console.log(instance1.colors);//"red,blue,green,black"

// var instance2 = new Son();
// console.log(instance2.colors);//"red,blue,green" 可见引用类型值是独立的

// function Father(name){
// 	this.name = name;
// 	this.colors = ["red","blue","green"];
// }
// Father.prototype.sayName = function(){
// 	console.log(this.name);
// };
// function Son(name,age){
// 	Father.call(this,name);//继承实例属性，第一次调用Father()
// 	this.age = age;
// }
// Son.prototype = Father.prototype;//继承父类方法,第二次调用Father()
// Son.prototype.sayAge = function(){
// 	console.log(this.age);
// }
// var instance1 = new Son("louis",5);
// instance1.colors.push("black");
// console.log(instance1.colors);//"red,blue,green,black"
// instance1.sayName();//louis
// instance1.sayAge();//5

// var instance1 = new Son("zhai",10);
// console.log(instance1.colors);//"red,blue,green"
// instance1.sayName();//zhai
// instance1.sayAge();//10

function Person(name) {
  this.name = name;
  this.run = function(){
      console.log('run')
  }
}

Person.prototype = {
  say(){
      console.log(`my name is ${this.name}`)
  }
}

let obj = {}

obj.__proto__ = new Person('person1')
// Person.call(obj, 'person1')

obj.say()//my name is person1

let firstFiber
let nextFiber = firstFiber
let shouldYield = false;
function performUnitOfWork(nextFiber) {
  return nextFiber.next
}
function workLoop(deadLine) {
  while(nextFiber && !shouldYield) {
    nextFiber = performUnitOfWork(nextFiber)
    shouldYield = deadLine.timeReaming < 1
  }
  requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop)