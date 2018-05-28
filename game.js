'use strict';

class Vector {
    constructor (x = 0, y = 0) {
        this.x = parseInt(x);
        this.y = parseInt(y);
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
        if (this.x > 0) {
            this.x -= this.x * 2;
        } else {
            this.x += this.x * 2;
        }
        if (this.y > 0) {
            this.y -= this.y * 2;
        } else {
            this.y += this.y * 2;
        }
    }
}

class Actor {
    constructor (pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
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
        this.grid = grid;
        this.actors = actors;
        this.status = null;
        this.finishDelay = 1;
    }

    get player () {
        return this.actors.find(obj => {return obj.type === "player"});
    }

    get height () {
        return this.grid.length;
    }

    get width () {
        if (!Array.isArray(this.grid) || this.grid.length === 0) {
            return 0;
        }
        return this.grid.reduce((max, cur) => { return (cur.length > max ? cur.length : max) }, 0);
    }

    isFinished () {
        return (this.status !== null && this.finishDelay <= 0);
    }

    actorAt (actor) {
        if (!(actor instanceof Actor) && !(actor.constructor === Actor.constructor)) {
            throw (new Error('Параметр должен быть типа Actor'));
        }
        return this.actors.find(obj => {return actor.isIntersect(obj);});
    }

    obstacleAt (pos, size) {
        if ((!(pos instanceof Vector) && !(pos.constructor === Vector.constructor)) || 
            (!(size instanceof Vector) && !(size.constructor === Vector.constructor))) {
            throw (new Error('Все параметры должны быть типа Vector'));
        }
        if (pos.x > this.width ||
            pos.x + size.x > this.width ||
            pos.x < 0 ||
            pos.x + size.x < 0 ||
            pos.y < 0 || 
            pos.y + size.y < 0) {
            return 'wall';
        }
        if (pos.y > this.height ||
            pos.y + size.y > this.height) {
            return 'lava';
        }
        for (let x = 0; x <= Math.floor(size.x); x++) {
            for (let y = 0; y <= Math.floor(size.y); y++) {
                let cur = this.grid[Math.floor(pos.y + y)][Math.floor(pos.x + x)];
                if (cur !== undefined) {
                    return cur;
                }
            }
        }
        return undefined;
    }

    removeActor (actor) {
        if (!(actor instanceof Actor) && !(actor.constructor === Actor.constructor)) {
            throw (new Error('Параметр должен быть типа Actor'));
        }
        let index = this.actors.indexOf(actor);
        if (index > -1) {
            this.actors.splice(index, 1);
            return true;
        }
        return false;
    }

    noMoreActors (type) {
        if (this.actors.find(obj => {return obj.type === type}) === undefined) {
            return true;
        } else {
            return false;
        }
    }

    playerTouched (type, actor) {
        if (this.status !== null) {
            throw (new Error('Игра уже завершена'));
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
            return true;
        }
        return false;
    }
}

class LevelParser {
    constructor (actorsDict) {
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
        let result = [];
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
        let result = [];
        for (let stringsNumber in strings) {
            for (let symbolsNumber in strings[stringsNumber]) {
                if (strings !== undefined && 
                    strings[stringsNumber] !== undefined && 
                    strings[stringsNumber][symbolsNumber] !== undefined) {
                    let symbol = strings[stringsNumber][symbolsNumber];
                    let className = this.actorFromSymbol(symbol);
                    if (className !== undefined && typeof className === 'function') {
                        let newObject = new className(new Vector(symbolsNumber, stringsNumber));
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
        time = parseInt(time);
        return this.pos.plus(this.speed.times(time));
    }

    handleObstacle () {
        this.speed.revert();
    }

    act (time, level) {
        let nextPosition = this.getNextPosition(time);
        if (level.obstacleAt(nextPosition, this.size) === undefined) {
            this.pos = nextPosition;
        } else {
            this.handleObstacle();
        }
    }
}

class HorizontalFireball extends Fireball {
    constructor (pos = new Vector(0, 0)) {
        if (!(pos instanceof Vector) && !(pos.constructor === Vector.constructor) && 
            !(speed instanceof Vector) && !(speed.constructor === Vector.constructor)) {
            throw (new Error('Параметры должен быть типа Vector или не заданы'));
        }
        super(pos, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    constructor (pos = new Vector(0, 0)) {
        if (!(pos instanceof Vector) && !(pos.constructor === Vector.constructor) && 
            !(speed instanceof Vector) && !(speed.constructor === Vector.constructor)) {
            throw (new Error('Параметры должен быть типа Vector или не заданы'));
        }
        super(pos, new Vector(0, 2));
    }
}

class FireRain extends Fireball {
    constructor (pos = new Vector(0, 0)) {
        if (!(pos instanceof Vector) && !(pos.constructor === Vector.constructor) && 
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

    getNextPosition () {

    }

    act (time) {

    }

}

class Player extends Actor {
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