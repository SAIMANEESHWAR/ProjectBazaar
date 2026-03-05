export interface Concept {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  topic: string;
  explanation: string;
  codeExample: string;
  language: string;
}

export interface ConceptGroup {
  category: string;
  concepts: Concept[];
}

export const oopsConcepts: Concept[] = [
  {
    id: 'oop-1', title: 'Abstraction (Interface)', description: '100% Contract, no implementation details.',
    difficulty: 'Medium', category: 'Abstraction Concepts', topic: 'Abstraction',
    explanation: 'An Interface is a completely abstract structure. It only tells you *what* methods a class must have, but not *how* they work. A class \'implements\' an interface, meaning it signs a contract to provide the code for all the interface\'s methods. This is how Java achieves multiple inheritance (a class can sign multiple contracts).',
    codeExample: '```java\ninterface Player {\n    void play();\n    void pause();\n}\n\nclass VideoPlayer implements Player {\n    public void play() { System.out.println("Playing video"); }\n    public void pause() { System.out.println("Paused"); }\n}\n```',
    language: 'java',
  },
  {
    id: 'oop-2', title: 'Abstraction (Abstract Class)', description: 'Partial blueprint with some rules enforced.',
    difficulty: 'Medium', category: 'Abstraction Concepts', topic: 'Abstraction',
    explanation: 'An Abstract Class is a partially complete class. It can have both abstract methods (no body — must be overridden) and concrete methods (with body — optional to override). You cannot create an object of an abstract class directly. It serves as a base template for child classes.',
    codeExample: '```java\nabstract class Shape {\n    abstract double area();\n    void display() {\n        System.out.println("Area: " + area());\n    }\n}\n\nclass Circle extends Shape {\n    double radius;\n    Circle(double r) { this.radius = r; }\n    double area() { return Math.PI * radius * radius; }\n}\n```',
    language: 'java',
  },
  {
    id: 'oop-3', title: 'Class and Object', description: 'Blueprint vs. Actual Item.',
    difficulty: 'Easy', category: 'Basics Concepts', topic: 'Basics',
    explanation: 'A Class is a blueprint or template that defines the properties (fields) and behaviors (methods) of an entity. An Object is a concrete instance of that class — it occupies memory and has actual values. Think of a class as a cookie cutter and objects as the cookies made from it.',
    codeExample: '```java\nclass Car {\n    String brand;\n    int speed;\n\n    void accelerate() {\n        speed += 10;\n        System.out.println(brand + " speed: " + speed);\n    }\n}\n\nCar myCar = new Car();\nmyCar.brand = "Tesla";\nmyCar.accelerate(); // Tesla speed: 10\n```',
    language: 'java',
  },
  {
    id: 'oop-4', title: 'Constructors', description: 'Setup code that runs automatically.',
    difficulty: 'Easy', category: 'Basics Concepts', topic: 'Basics',
    explanation: 'A Constructor is a special method that is automatically called when you create an object using the `new` keyword. It initializes the object\'s fields. Java supports default constructors, parameterized constructors, and constructor overloading. If you don\'t define one, Java provides a no-arg default constructor.',
    codeExample: '```java\nclass Student {\n    String name;\n    int age;\n\n    Student(String name, int age) {\n        this.name = name;\n        this.age = age;\n    }\n}\n\nStudent s = new Student("Alice", 21);\n```',
    language: 'java',
  },
  {
    id: 'oop-5', title: 'Encapsulation', description: 'Data hiding and security.',
    difficulty: 'Easy', category: 'Encapsulation Concepts', topic: 'Encapsulation',
    explanation: 'Encapsulation is like a capsule that wraps code and data together. It restricts direct access to some of an object\'s components. Instead of letting anyone change your variables directly, you keep them \'private\' and provide public methods (getters/setters) to control how they are accessed. This protects your data from bad input.',
    codeExample: '```java\nclass Account {\n    private double balance; // Hidden data\n\n    public void deposit(double amount) {\n        if (amount > 0) { // Controlled access\n            balance += amount;\n        }\n    }\n}\n```',
    language: 'java',
  },
  {
    id: 'oop-6', title: 'Inheritance', description: 'Reuse code from a parent class.',
    difficulty: 'Easy', category: 'Inheritance Concepts', topic: 'Inheritance',
    explanation: 'Inheritance allows a class (child) to inherit properties and methods from another class (parent). The child class can use the parent\'s code directly, override it, or extend it with new functionality. This promotes code reuse and establishes an "is-a" relationship between classes.',
    codeExample: '```java\nclass Animal {\n    void eat() { System.out.println("Eating..."); }\n}\n\nclass Dog extends Animal {\n    void bark() { System.out.println("Woof!"); }\n}\n\nDog d = new Dog();\nd.eat();  // Inherited from Animal\nd.bark(); // Dog\'s own method\n```',
    language: 'java',
  },
  {
    id: 'oop-7', title: 'Polymorphism (Method Overloading)', description: 'Same name, different parameters.',
    difficulty: 'Easy', category: 'Polymorphism Concepts', topic: 'Polymorphism',
    explanation: 'Method Overloading (Compile-time Polymorphism) allows multiple methods in the same class to have the same name but different parameter lists. The compiler decides which method to call based on the arguments passed. This makes APIs cleaner and more intuitive.',
    codeExample: '```java\nclass Calculator {\n    int add(int a, int b) { return a + b; }\n    double add(double a, double b) { return a + b; }\n    int add(int a, int b, int c) { return a + b + c; }\n}\n\nCalculator calc = new Calculator();\ncalc.add(1, 2);       // calls int version\ncalc.add(1.5, 2.5);   // calls double version\n```',
    language: 'java',
  },
  {
    id: 'oop-8', title: 'Polymorphism (Method Overriding)', description: 'Same signature, different behavior.',
    difficulty: 'Medium', category: 'Polymorphism Concepts', topic: 'Polymorphism',
    explanation: 'Method Overriding (Runtime Polymorphism) occurs when a child class provides its own implementation of a method already defined in the parent class. The JVM decides at runtime which version to call based on the actual object type, not the reference type. This is the core of dynamic dispatch.',
    codeExample: '```java\nclass Shape {\n    void draw() { System.out.println("Drawing shape"); }\n}\n\nclass Circle extends Shape {\n    @Override\n    void draw() { System.out.println("Drawing circle"); }\n}\n\nShape s = new Circle();\ns.draw(); // "Drawing circle" - runtime polymorphism\n```',
    language: 'java',
  },
  {
    id: 'oop-9', title: 'Double Dispatch', description: 'Behavior depends on two types.',
    difficulty: 'Hard', category: 'Design Patterns Concepts', topic: 'Design Patterns',
    explanation: 'Double Dispatch is a technique where the method to be called depends on the runtime types of two objects, not just one. This is commonly used in the Visitor pattern. Since most OOP languages only support single dispatch natively, double dispatch is achieved through two successive method calls.',
    codeExample: '```java\ninterface Shape { void accept(ShapeVisitor v); }\ninterface ShapeVisitor { void visit(Circle c); void visit(Square s); }\n\nclass Circle implements Shape {\n    void accept(ShapeVisitor v) { v.visit(this); }\n}\n\nclass AreaCalculator implements ShapeVisitor {\n    void visit(Circle c) { /* calc circle area */ }\n    void visit(Square s) { /* calc square area */ }\n}\n```',
    language: 'java',
  },
  {
    id: 'oop-10', title: 'Composition over Inheritance', description: 'Building Lego vs. Melting Plastic.',
    difficulty: 'Hard', category: 'Design Principles Concepts', topic: 'Design Principles',
    explanation: 'Composition over Inheritance is a design principle that favors object composition (has-a) over class inheritance (is-a). Instead of extending a class to reuse its behavior, you include an instance of that class as a field. This provides more flexibility, avoids tight coupling, and makes code easier to change.',
    codeExample: '```java\n// Composition approach\nclass Engine {\n    void start() { System.out.println("Engine started"); }\n}\n\nclass Car {\n    private Engine engine = new Engine(); // has-a\n    void start() {\n        engine.start();\n        System.out.println("Car is ready");\n    }\n}\n```',
    language: 'java',
  },
  {
    id: 'oop-11', title: 'SOLID - Single Responsibility', description: 'One class, one job.',
    difficulty: 'Medium', category: 'Design Principles Concepts', topic: 'Design Principles',
    explanation: 'The Single Responsibility Principle states that a class should have only one reason to change. Each class should encapsulate one and only one aspect of the software\'s functionality. This makes classes smaller, more focused, and easier to test and maintain.',
    codeExample: '```java\n// Bad: one class doing too much\nclass UserService {\n    void createUser() { /* ... */ }\n    void sendEmail() { /* ... */ } // not its job!\n}\n\n// Good: separated responsibilities\nclass UserService {\n    void createUser() { /* ... */ }\n}\nclass EmailService {\n    void sendEmail() { /* ... */ }\n}\n```',
    language: 'java',
  },
  {
    id: 'oop-12', title: 'Static Keyword', description: 'Belongs to class, not object.',
    difficulty: 'Easy', category: 'Basics Concepts', topic: 'Basics',
    explanation: 'The static keyword means the member belongs to the class itself, not to any specific instance. Static variables are shared across all objects. Static methods can be called without creating an object. They cannot access instance variables directly.',
    codeExample: '```java\nclass Counter {\n    static int count = 0;\n\n    Counter() { count++; }\n\n    static int getCount() { return count; }\n}\n\nnew Counter();\nnew Counter();\nSystem.out.println(Counter.getCount()); // 2\n```',
    language: 'java',
  },
];

export const languageConcepts: Concept[] = [
  {
    id: 'lang-1', title: 'Variables and Data Types', description: 'Storing values in memory.',
    difficulty: 'Easy', category: 'Basics', topic: 'Language',
    explanation: 'Variables are containers for storing data values. Each variable has a type that determines what kind of data it can hold: int for integers, double for decimals, String for text, boolean for true/false. Java is statically typed — you must declare the type before using a variable.',
    codeExample: '```java\nint age = 25;\ndouble price = 9.99;\nString name = "Alice";\nboolean isActive = true;\n\nfinal int MAX_SIZE = 100; // constant\n```',
    language: 'java',
  },
  {
    id: 'lang-2', title: 'Control Flow Statements', description: 'Decision making in programs.',
    difficulty: 'Easy', category: 'Basics', topic: 'Language',
    explanation: 'Control flow statements allow your program to make decisions and repeat actions. if-else for branching, switch for multi-way selection, for/while/do-while for loops. The break statement exits a loop, continue skips to the next iteration.',
    codeExample: '```java\nfor (int i = 0; i < 5; i++) {\n    if (i % 2 == 0) {\n        System.out.println(i + " is even");\n    } else {\n        System.out.println(i + " is odd");\n    }\n}\n```',
    language: 'java',
  },
  {
    id: 'lang-3', title: 'Arrays and Collections', description: 'Storing multiple values.',
    difficulty: 'Easy', category: 'Data Structures', topic: 'Language',
    explanation: 'Arrays store fixed-size sequences of elements of the same type. Collections (ArrayList, HashMap, HashSet) are dynamic and provide more functionality. ArrayList is resizable, HashMap stores key-value pairs, HashSet stores unique elements.',
    codeExample: '```java\nint[] arr = {1, 2, 3, 4, 5};\n\nArrayList<String> list = new ArrayList<>();\nlist.add("Hello");\nlist.add("World");\n\nHashMap<String, Integer> map = new HashMap<>();\nmap.put("age", 25);\n```',
    language: 'java',
  },
  {
    id: 'lang-4', title: 'Exception Handling', description: 'Gracefully handling errors.',
    difficulty: 'Medium', category: 'Error Handling', topic: 'Language',
    explanation: 'Exception handling uses try-catch-finally blocks to gracefully manage runtime errors. Checked exceptions must be caught or declared. Unchecked exceptions (RuntimeException) don\'t require explicit handling. Custom exceptions can be created by extending Exception class.',
    codeExample: '```java\ntry {\n    int result = 10 / 0;\n} catch (ArithmeticException e) {\n    System.out.println("Cannot divide by zero!");\n} finally {\n    System.out.println("Always runs");\n}\n```',
    language: 'java',
  },
  {
    id: 'lang-5', title: 'Generics', description: 'Type-safe flexible code.',
    difficulty: 'Medium', category: 'Advanced', topic: 'Language',
    explanation: 'Generics enable types (classes and interfaces) to be parameters when defining classes, interfaces, and methods. This provides compile-time type safety and eliminates the need for casting. Bounded types restrict what types can be used as arguments.',
    codeExample: '```java\nclass Box<T> {\n    private T item;\n    void set(T item) { this.item = item; }\n    T get() { return item; }\n}\n\nBox<String> stringBox = new Box<>();\nstringBox.set("Hello");\nString val = stringBox.get(); // no casting needed\n```',
    language: 'java',
  },
  {
    id: 'lang-6', title: 'Lambda Expressions', description: 'Concise functional syntax.',
    difficulty: 'Medium', category: 'Advanced', topic: 'Language',
    explanation: 'Lambda expressions provide a concise way to represent anonymous functions. They enable functional programming in Java. The syntax is (parameters) -> expression. Lambdas work with functional interfaces (interfaces with a single abstract method).',
    codeExample: '```java\nList<String> names = Arrays.asList("Bob", "Alice", "Charlie");\n\n// Lambda for sorting\nnames.sort((a, b) -> a.compareTo(b));\n\n// Lambda with forEach\nnames.forEach(name -> System.out.println(name));\n```',
    language: 'java',
  },
];

export function groupByCategory(concepts: Concept[]): ConceptGroup[] {
  const map = new Map<string, Concept[]>();
  concepts.forEach((c) => {
    if (!map.has(c.category)) map.set(c.category, []);
    map.get(c.category)!.push(c);
  });
  return Array.from(map.entries()).map(([category, concepts]) => ({ category, concepts }));
}
