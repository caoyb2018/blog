function Person() {
    this.name = '123';
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

obj.__proto__ = Person.prototype
Person.call(obj, 'person1')

obj.say()//my name is person1

var person2 = new Person('person2')
var person3 = new Person('person3')

console.log(person2.say === person3.say) // true
console.log(person2.run === person3.run) // false