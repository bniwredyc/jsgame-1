'use strict';

class Vector {
    constructor (x = 0, y = 0) {
        // в аргументы передаются числа, так что parseFloat можно убрать
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    }

    plus (vector) {
        if (!(vector instanceof Vector) && !(vector.constructor === Vector.constructor)) {
            throw (new Error('Можно прибавлять к вектору только вектор типа Vector'));
        }
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    times (multiplier) {
        return new Vector(this.x * multiplier, this.y * multiplier);
    }

    revert () {
        // не нужно мутировать объект Vector
        // это может послужить причиной ошибок,
        // которые будет сложно отловить
        // (здесь нужно вернуть новый объект с нужными x и y)
        this.x = -this.x;
        this.y = -this.y;
    }
}

class Actor {
    constructor (pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
        // зачем вторая часть проверок?
        if ((!(pos instanceof Vector) && !(pos.constructor === Vector.constructor)) || 
            (!(size instanceof Vector) && !(size.constructor === Vector.constructor)) || 
            (!(speed instanceof Vector) && !(speed.constructor === Vector.constructor))) {
            throw (new Error('Все параметры должны быть типа Vector или не заданы'));
        }
        this.pos = pos;
        this.size = size;
        this.speed = speed;
//        this.type = 'actor';
//        Object.defineProperty(this, 'type', { writable: false });
    }

    isIntersect (obj) {
        if (!(obj instanceof Actor) && !(obj.constructor === Actor.constructor)) {
            throw (new Error('Параметр должен быть типа Actor'));
        }
        if (obj === this) {
            return false;
        }
        // выражение можно обратить, если заменить операции на противоположные
        // || на &&, >= на < и <= на >
        if (obj.left >= this.right || 
            obj.right <= this.left || 
            obj.top >= this.bottom || 
            obj.bottom <= this.top) {
            return false;
        } 
        return true;
    }

    act () {

    }

    get left () {
        return this.pos.x;
    }

    get right () {
        return this.pos.x + this.size.x;
    }

    get top () {
        return this.pos.y;
    }

    get bottom () {
        return this.pos.y + this.size.y;
    }

    get type () {
        return 'actor';
    }
}

class Level {
    constructor (grid = [], actors = []) {
        // здесь можно создать копии массивов,
        // чтобы поля объекта нельзя было изменить извне
        this.grid = grid;
        this.actors = actors;
        this.status = null;
        this.finishDelay = 1;
    }

    get player () {
        // лучше задать в конструктре, ведь поле не меняется
        // стрелочную функцию можно записать короче (без фигурных скобок и return)
        return this.actors.find(obj => {return obj.type === "player"});
    }

    get height () {
        return this.grid.length;
    }

    get width () {
        // лучше посчитать один раз в конструкторе
        if (!Array.isArray(this.grid) || this.grid.length === 0) {
            return 0;
        }
        return this.grid.reduce((max, cur) => { return (cur.length > max ? cur.length : max) }, 0);
    }

    isFinished () {
        // скобки можно убрать
        return (this.status !== null && this.finishDelay <= 0);
    }

    actorAt (actor) {
        // непонятно зачем нужна вторая часть проверки
        if (!(actor instanceof Actor) && !(actor.constructor === Actor.constructor)) {
            throw (new Error('Параметр должен быть типа Actor'));
        }
        // можно короче, без {} и return
        return this.actors.find(obj => {return actor.isIntersect(obj);});
    }

    obstacleAt (pos, size) {
        if ((!(pos instanceof Vector) && !(pos.constructor === Vector.constructor)) || 
            (!(size instanceof Vector) && !(size.constructor === Vector.constructor))) {
            throw (new Error('Все параметры должны быть типа Vector'));
        }

        // это выражение нужно упростить
        if (pos.x > this.width ||
            pos.x + size.x > this.width ||
            pos.x < 0 ||
            pos.x + size.x < 0 ||
            pos.y < 0 || 
            pos.y + size.y < 0) {
            return 'wall';
        }

        // это нужно упростить
        if (pos.y > this.height ||
            pos.y + size.y > this.height) {
            return 'lava';
        }

        // округления лучше сделать выше
        // не нужно обходить всё игровое поле,
        // достаточно определить ячейки,
        // на которых располагается объект и обойти только их
        for (let x = 0; x <= Math.floor(size.x); x++) {
            for (let y = 0; y <= Math.floor(size.y); y++) {
                // значение присваиваться переменной один раз - лучше искользовать const
                let cur = this.grid[Math.floor(pos.y + y)][Math.floor(pos.x + x)];
                // тут можно просто if (cur) {
                if (cur !== undefined) {
                    return cur;
                }
            }
        }

        // лишняя строчка, функция и так возвращает undefined, если не указано иное
        return undefined;
    }

    removeActor (actor) {
        // непонятная вторая часть проверки
        if (!(actor instanceof Actor) && !(actor.constructor === Actor.constructor)) {
            throw (new Error('Параметр должен быть типа Actor'));
        }
        let index = this.actors.indexOf(actor);
        if (index > -1) {
            this.actors.splice(index, 1);
            // результат выполнения функции нигде не используется,
            // так что можно не возвращать значение
            return true;
        }
        return false;
    }

    noMoreActors (type) {
        // можно короче с помощью метода some
        if (this.actors.find(obj => {return obj.type === type}) === undefined) {
            return true;
        } else {
            return false;
        }
    }

    playerTouched (type, actor) {
        if (this.status !== null) {
            return false;
        }
        if (!(actor === undefined) && !(actor instanceof Actor) && !(actor.constructor === Actor.constructor)) {
            throw (new Error('Второй параметр должен быть не задан или иметь тип Actor'));
        }
        if (type === 'lava' || type === 'fireball') {
            this.status = 'lost';
            return true;
        }
        if (type === 'coin') {
            this.removeActor(actor);
            if (this.noMoreActors('coin')) {
                this.status = 'won';
            }

            // из этого мтеода не нужно возвращать значение
            return true;
        }
        return false;
    }
}

class LevelParser {
    constructor (actorsDict) {
        // лучше использовать задание значения аргумента по-умолчанию
        if (actorsDict === undefined) {
            actorsDict = [];
        }
        this.actorsDict = actorsDict;
        this.symbols = {
            'x': 'wall',
            '!': 'lava'
        }
    }

    actorFromSymbol (symbol) {
        return this.actorsDict[symbol];
    }

    obstacleFromSymbol (symbol) {
        return this.symbols[symbol];
    }

    createGrid (strings) {
        // значение присваивается переменной 1 раз - лучше использовать const
        let result = [];
        // попробуйте упросить этот код, очень сложно разобрать что здесь происходит
        // по-моему можно переписать используея метод map 2 раза
        for (let stringsNumber in strings) {
            result[stringsNumber] = [];
            for (let symbolsNumber in strings[stringsNumber]) {
                if (strings !== undefined && 
                    strings[stringsNumber] !== undefined && 
                    strings[stringsNumber][symbolsNumber] !== undefined) {
                    let symbol = strings[stringsNumber][symbolsNumber];
                    if (this.actorFromSymbol(symbol) === undefined) {
                        result[stringsNumber][symbolsNumber] = this.obstacleFromSymbol(symbol);
                    }
                } else {
                    result[stringsNumber][symbolsNumber] = undefined;
                }
            }
        }
        return result;
    }

    createActors (strings) {
        // значение присваивается переменной 1 раз - лучше использовать const
        let result = [];
        // вместо in лучше исползьвать for или метод forEach
        for (let stringsNumber in strings) {
            for (let symbolsNumber in strings[stringsNumber]) {
                // выше идёт обход string а тут проверка
                if (strings !== undefined && 
                    strings[stringsNumber] !== undefined && 
                    strings[stringsNumber][symbolsNumber] !== undefined) {
                    let symbol = strings[stringsNumber][symbolsNumber];
                    let className = this.actorFromSymbol(symbol);
                    if (className !== undefined && typeof className === 'function') {
                        // значение присваивается переменной 1 раз - лучше использовать const
                        let newObject = new className(new Vector(symbolsNumber, stringsNumber));
                        // вторая половина проверки?
                        if ((newObject instanceof Actor) || (newObject.constructor === Actor.constructor)) {
                            result.push(newObject);
                        }
                    }
                }
            }
        }
        return result;
    }

    parse (strings) {
        return new Level(this.createGrid(strings), this.createActors(strings));
    }
}

class Fireball extends Actor {
    constructor (pos = new Vector(0, 0), speed = new Vector(0, 0)) {
        // лишние проверки
        if (!(pos instanceof Vector) && !(pos.constructor === Vector.constructor) && 
            !(speed instanceof Vector) && !(speed.constructor === Vector.constructor)) {
            throw (new Error('Параметры должен быть типа Vector или не заданы'));
        }
        super(pos, new Vector(1, 1), speed);
    }

    get type () {
        return 'fireball';
    }

    getNextPosition (time = 1) {
        return this.pos.plus(this.speed.times(time));
    }

    handleObstacle () {
        this.speed.revert();
    }

    act (time, level) {
        // лучше const
        let nextPosition = this.getNextPosition(time);
        // может быть, если нашли препятсвие, то позицию менять не надо
        if (level.obstacleAt(nextPosition, this.size) !== undefined) {
            this.handleObstacle();
        }
        this.pos = nextPosition;
    }
}

class HorizontalFireball extends Fireball {
    constructor (pos = new Vector(0, 0)) {
        if (!(pos instanceof Vector) && !(pos.constructor === Vector.constructor) &&
            // speed?
            !(speed instanceof Vector) && !(speed.constructor === Vector.constructor)) {
            throw (new Error('Параметры должен быть типа Vector или не заданы'));
        }
        super(pos, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    constructor (pos = new Vector(0, 0)) {
        if (!(pos instanceof Vector) && !(pos.constructor === Vector.constructor) &&
            // speed?
            !(speed instanceof Vector) && !(speed.constructor === Vector.constructor)) {
            throw (new Error('Параметры должен быть типа Vector или не заданы'));
        }
        super(pos, new Vector(0, 2));
    }
}

class FireRain extends Fireball {
    constructor (pos = new Vector(0, 0)) {
        if (!(pos instanceof Vector) && !(pos.constructor === Vector.constructor) &&
            // speed?
            !(speed instanceof Vector) && !(speed.constructor === Vector.constructor)) {
            throw (new Error('Параметры должен быть типа Vector или не заданы'));
        }
        super(pos, new Vector(0, 3));
        this.startingPos = pos;
    }

    handleObstacle () {
        this.pos = this.startingPos;
    }
}

class Coin extends Actor {
    constructor (pos = new Vector(0, 0)) {
        if (!(pos instanceof Vector) && !(pos.constructor === Vector.constructor)){
            throw (new Error('Параметры должен быть типа Vector или не заданы'));
        }
        super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6), new Vector(0, 0));
        this.startingPos = this.pos;
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = Math.random() * 2 * Math.PI;
    }

    get type () {
        return 'coin';
    }

    updateSpring (time = 1) {
        this.spring += this.springSpeed * time;
    }

    getSpringVector () {
        return new Vector(0, Math.sin(this.spring) * this.springDist);
    }

    getNextPosition (time = 1) {
        this.spring += this.springSpeed * time;
        return this.startingPos.plus(this.getSpringVector());
    }

    act (time) {
        this.pos = this.getNextPosition(time);
    }

}

class Player extends Actor {
    // почему coord, а не pos?
    constructor (coord = new Vector(0, 0)) {
        if (!(coord instanceof Vector) && !(coord.constructor === Vector.constructor)) {
            throw (new Error('Параметр должен быть типа Vector'));
        }
        super(coord.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
    }

    get type () {
        return 'player';
    }
}

const actorDict = {
  '@': Player,
  'o': Coin,
  '|': VerticalFireball,
  'v': FireRain,
  '=': HorizontalFireball
}

function startGame() {
    const parser = new LevelParser(actorDict);

    loadLevels()
        .then(jsonSchemas => {return runGame(JSON.parse(jsonSchemas), parser, DOMDisplay)})
        .then(status => {return confirm('Вы выиграли, сыграем еще раз?');}) // очень хорошо :)
        .then(result => {if (result) startGame();})
        .catch(error => console.log(error));
}

startGame();