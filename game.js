'use strict';

class Vector {
    constructor (x = 0, y = 0) {
        this.x = x;
        this.y = y;
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

}

class Fireball {

}

class HorizontalFireball extends Fireball {

}

class VerticalFireball extends Fireball {

}

class FireRain extends Fireball {

}

class Coin {

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