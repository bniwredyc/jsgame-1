'use strict';

class Vector {
    constructor (x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    plus (vector) {
        if (!(vector instanceof Vector)) {
            throw (new Error('Можно прибавлять к вектору только вектор типа Vector'));
        }
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    times (multiplier) {
        return new Vector(this.x * multiplier, this.y * multiplier);
    }

    revert () {
        return new Vector(-this.x, -this.y);
    }
}

class Actor {
    constructor (pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
        if (!(pos instanceof Vector) || 
            !(size instanceof Vector) || 
            !(speed instanceof Vector)) {
            throw (new Error('Все параметры должны быть типа Vector или не заданы'));
        }
        this.pos = pos;
        this.size = size;
        this.speed = speed;
    }

    isIntersect (obj) {
        if (!(obj instanceof Actor)) {
            throw (new Error('Параметр должен быть типа Actor'));
        }
        if (obj === this) {
            return false;
        }
        return (obj.left < this.right &&
            obj.right > this.left && 
            obj.top < this.bottom && 
            obj.bottom > this.top);
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
        if (!Array.isArray(grid) || !Array.isArray(actors)){
            throw (new Error('Параметры должны быть массивами'));
        }

        this.grid = grid.slice();
        this.actors = actors.slice();
        this.status = null;
        this.finishDelay = 1;

        this._width = Symbol('width');
        this[this._width] = this.grid.reduce((max, cur) => cur.length > max ? cur.length : max, 0);
    }

    get player () {
        return this.actors.find(obj => {return obj.type === "player"});
    }

    get width () {
        return this[this._width];
    }

    get height () {
        return this.grid.length;
    }

    isFinished () {
        return this.status !== null && this.finishDelay <= 0;
    }

    actorAt (actor) {
        if (!(actor instanceof Actor)) {
            throw (new Error('Параметр должен быть типа Actor'));
        }
        return this.actors.find(obj => actor.isIntersect(obj));
    }

    obstacleAt (pos, size) {
        if (!(pos instanceof Vector) || 
            !(size instanceof Vector)) {
            throw (new Error('Все параметры должны быть типа Vector'));
        }
        const minX = Math.min(pos.x, pos.x + size.x);
        const maxX = Math.max(pos.x, pos.x + size.x);
        const minY = Math.min(pos.y, pos.y + size.y);
        const maxY = Math.max(pos.y, pos.y + size.y);

        if (maxX > this.width ||
            minX < 0 ||
            minY < 0) {
            return 'wall';
        }
        if (maxY > this.height) {
            return 'lava';
        }

        for (let x = Math.floor(minX); x <= Math.floor(maxX); x++) {
            for (let y = Math.floor(minY); y <= Math.floor(maxY); y++) {
                const cur = this.grid[y][x];
                if (cur) {
                    if (cur === 'wall' && 
                        (x === maxX || y === maxY)){
                        continue;
                    }
                    return cur;
                }
            }
        }
    }

    removeActor (actor) {
        if (!(actor instanceof Actor)) {
            throw (new Error('Параметр должен быть типа Actor'));
        }
        const index = this.actors.indexOf(actor);
        if (index > -1) {
            this.actors.splice(index, 1);
        }
    }

    noMoreActors (type) {
        return !this.actors.some(obj => obj.type === type);
    }

    playerTouched (type, actor) {
        if (!(actor === undefined) && !(actor instanceof Actor)) {
            throw (new Error('Второй параметр должен быть не задан или иметь тип Actor'));
        }
        if (this.status === null) {
            if (type === 'lava' || type === 'fireball') {
                this.status = 'lost';
            }
            if (type === 'coin') {
                this.removeActor(actor);
                if (this.noMoreActors('coin')) {
                    this.status = 'won';
                }
            }
        }
    }
}

class LevelParser {
    constructor (actorsDict = new Object()) {
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
        return strings.map(line => line.split('').map(symbol => {
                if (!this.actorFromSymbol(symbol)) {
                    return this.obstacleFromSymbol(symbol);
                }
            }
        ));
    }

    createActors (strings) {
        const result = [];
        strings.forEach((string, stringNumber) => string.split('').forEach((symbol, symbolNumber) => {
            const className = this.actorFromSymbol(symbol);
            if (className && typeof className === 'function') {
                let newObject = new className(new Vector(symbolNumber, stringNumber));
                if (newObject instanceof Actor) {
                    result.push(newObject);
                }
            }
        }));
        return result;
    }

    parse (strings) {
        return new Level(this.createGrid(strings), this.createActors(strings));
    }
}

class Fireball extends Actor {
    constructor (pos = new Vector(0, 0), speed = new Vector(0, 0)) {
        if (!(pos instanceof Vector) && 
            !(speed instanceof Vector)) {
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
        this.speed = this.speed.revert();
    }

    act (time, level) {
        const nextPosition = this.getNextPosition(time);
        if (level.obstacleAt(nextPosition, this.size) !== undefined) {
            this.handleObstacle();
        } else {
            this.pos = nextPosition;
        }
    }
}

class HorizontalFireball extends Fireball {
    constructor (pos = new Vector(0, 0)) {
        super(pos, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    constructor (pos = new Vector(0, 0)) {
        super(pos, new Vector(0, 2));
    }
}

class FireRain extends Fireball {
    constructor (pos = new Vector(0, 0)) {
        super(pos, new Vector(0, 3));
        this.startingPos = pos;
    }

    handleObstacle () {
        this.pos = this.startingPos;
    }
}

class Coin extends Actor {
    constructor (pos = new Vector(0, 0)) {
        if (!(pos instanceof Vector)){
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
    constructor (pos = new Vector(0, 0)) {
        if (!(pos instanceof Vector)) {
            throw (new Error('Параметр должен быть типа Vector'));
        }
        super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
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
        .then(status => {return confirm('Вы выиграли, сыграем еще раз?');})
        .then(result => {if (result) startGame();})
        .catch(error => console.log(error));
}

startGame();