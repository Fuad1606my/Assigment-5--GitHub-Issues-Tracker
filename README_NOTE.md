# README_NOTE_5_Question_answer

## 1) What is the difference between var, let, and const?

`var` is the old way to declare variables in JavaScript. It can be re-declared and updated, and it does not respect block scope like `if` or `for`. Because of that, it can create confusion in bigger programs.

`let` is a modern way to declare a variable. It can be updated, but it cannot be declared again in the same scope. It follows block scope, so it is safer than `var` in most situations.

`const` is also block scoped, but its value cannot be reassigned after declaration. We use it when a variable should stay fixed. For objects and arrays, the reference stays fixed, but inner values can still change.

## 2) What is the spread operator (...)?

The spread operator is written as `...` and it is used to copy or expand values from an array or object. It helps make code shorter and cleaner.

Example uses:
- copying an array
- merging two arrays
- copying object properties
- passing array values as separate arguments in a function

It is very useful when working with modern JavaScript because it avoids a lot of manual work.

## 3) What is the difference between map(), filter(), and forEach()?

`map()` creates a new array by changing every item from the original array. We use it when we want transformed output.

`filter()` also creates a new array, but it only keeps the items that pass a condition.

`forEach()` just loops through the array and runs code for each item, but it does not return a new array like `map()` and `filter()`.

So in simple words:
- `map()` changes items
- `filter()` selects items
- `forEach()` runs code on items

## 4) What is an arrow function?

An arrow function is a shorter way to write a function in JavaScript. It uses `=>` syntax. It makes code more compact and is very common in modern JavaScript.

Example:
```js
const sum = (a, b) => a + b;
```

Arrow functions are useful for small functions, callbacks, and array methods. One important thing is that arrow functions do not have their own `this` like regular functions.

## 5) What are template literals?

Template literals are strings written with backticks instead of quotes. They allow us to insert variables or expressions directly inside a string using `${}`.

Example:
```js
const name = 'Fahim';
const message = `Hello, ${name}`;
```

They are useful for dynamic text and multi-line strings. They make string writing easier and more readable than old style concatenation.
