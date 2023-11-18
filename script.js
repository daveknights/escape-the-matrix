const Engine = Matter.Engine,
    Render = Matter.Render,
    Bodies = Matter.Bodies,
    Body = Matter.Body
    Collision = Matter.Collision,
    Composites = Matter.Composites,
    Composite = Matter.Composite;
const engine = Engine.create();
const render = Render.create({
    canvas: document.querySelector('canvas'),
    engine: engine,
    options: {
        background: '#00110b',
        wireframes: false
    },
});
const ctx = render.canvas.getContext('2d');
const playerCategory = 0x0002;
const stages = {
    started: false,
    escaped: false,
    rescued: false
}
let xPosArray = [];
let codeStacks = [];
let pills = [];
let morpheuses = [];
let smiths = [];
let phones = [];
let gameStatus = 'escapeInfo';
let codeDrop = 0;
let pillDrop = 0;
let morpheusDrop = 0;
let smithDrop = 0;
let phoneDrop = 0;
let lastTime = 0;
let inTheMatrix = false;
let xPos = 53;
let neo = null;
// Create arrray with pre defined x value for code stacks
while (xPos < 753) {
    xPosArray.push(xPos);

    xPos += 50;
}

const randomXPos = () => xPosArray[Math.floor(Math.random() * (xPosArray.length))];

const randomSize = () => Math.floor(Math.random() * (10 - 5)) + 5;

const randomChar = () => Math.floor(Math.random() * 20) + 1;

const setText = (text, xPos) => {
    ctx.font = '24px Courier New';
    ctx.fillStyle = '#18ce6d';
    ctx.fillText(text, xPos, 200);
}

const setGameStatus = (stage, status) => {
    !stages[stage] && setTimeout(() => gameStatus = status, 2500);
    stages[stage] = true;
};
// Makes a wall or ground
const boundry = (x, y, w, h) => {
    return Bodies.rectangle(x, y, w, h, {
        isStatic: true,
        render: {
            fillStyle: '#021810'
        }
    });
}

const codeStack = size => Composites.stack(randomXPos(), -((24 * size) + 10), 1, size, 0, 0, (x, y) => {
    return Bodies.rectangle(x, y, 24, 24, {
        frictionAir: 0.05,
        collisionFilter: { mask: playerCategory },
        render: {
            sprite: {
                texture: `assets/char${randomChar()}.png`,
            }
        }
    });
});

const makeSprite = (friction, image, x, y, h, w, rand = false) => {
    const xpos = rand ? randomXPos() + 12 : x;
    const mask = image === 'mr-anderson' || image === 'neo' ? {} : { mask: playerCategory };
    return Bodies.rectangle(xpos, y, h, w, {
        frictionAir: friction,
        collisionFilter: mask,
        render: {
            sprite: {
                texture: `assets/${image}.png`,
            }
        },
        inertia: Infinity,
    }
)};

const checkForOffScreenAndCollision = (sprites, status) => {
    for (const sprite of sprites) {
        if (sprite.position.y > 600) {
            Composite.remove(engine.world, sprite);
            sprites.splice(0, 1);
        }

        if (Collision.collides(sprite, neo) !== null) {
            gameStatus = status;
        }
    }
};

const play = time => {
    const outfit = gameStatus === 'escape' ? 'mr-anderson' : 'neo';
    !inTheMatrix && (neo = makeSprite(0.01, outfit, 400, 560, 44, 80));
    !inTheMatrix && Composite.add(engine.world, [neo, boundry(400, 600, 810, 1), boundry(-10, 300, 20, 600), boundry(810, 300, 20, 600)]);
    inTheMatrix = true;

    codeDrop += time - lastTime;
    !stages.escaped && (pillDrop += time - lastTime);
    stages.escaped && (morpheusDrop += time - lastTime);
    stages.rescued && (smithDrop += time - lastTime);
    stages.rescued && (phoneDrop += time - lastTime);

    if (codeDrop > 500) {
        const newStack = codeStack(randomSize());

        codeStacks.push(newStack);
        Composite.add(engine.world, newStack);

        codeDrop = 0;
    }

    if (codeStacks.length) {
        for (let [i, stack] of codeStacks.entries()) {

            if (stack.bodies[0].position.y > 600) {
                Composite.remove(engine.world, stack);
                codeStacks.splice(i, 1);
                i--;
            }

            for (const body in stack.bodies) {
                if (Collision.collides(stack.bodies[body], neo) !== null) {
                    gameStatus = 'notTheOne';
                }
            }
        }
    }

    if (!stages.escaped && pillDrop > 10000) {
        let newPill;
        let x = 25;

        neo.position.x < 400 && (x = 775);

        newPill = makeSprite(0.1, 'redPill', x, -50, 24, 50);

        pills.push(newPill);
        Composite.add(engine.world, newPill);

        pillDrop = 0;
    }

    pills.length && checkForOffScreenAndCollision(pills, 'rescueInfo');

    if (!stages.rescued && morpheusDrop > 10000) {
        let newMorpheus;
        let x = 25;

        neo.position.x < 400 && (x = 775);

        newMorpheus = makeSprite(0.1, 'morpheus', x, -80, 44, 80);

        morpheuses.push(newMorpheus);
        Composite.add(engine.world, newMorpheus);

        morpheusDrop = 0;
    }

    morpheuses.length && checkForOffScreenAndCollision(morpheuses, 'exitInfo');

    if (stages.rescued && smithDrop > 5000) {
        let newSmith = makeSprite(0.05, 'agent-smith', 0, -80, 44, 80, true);

        smiths.push(newSmith);
        Composite.add(engine.world, newSmith);

        smithDrop = 0;
    }

    smiths.length && checkForOffScreenAndCollision(smiths, 'notTheOne');

    if (stages.rescued && phoneDrop > 10000) {
        let newPhone;
        let position = 'left';
        let x = 25;

        if (neo.position.x < 400) {
            position = 'right';
            x = 775;
        }

        newPhone = makeSprite(0.1, `${position}-phone`, x, -80, 44, 80);

        phones.push(newPhone);
        Composite.add(engine.world, newPhone);

        phoneDrop = 0;
    }

    phones.length && checkForOffScreenAndCollision(phones, 'theOne')

    lastTime = time;
}

document.addEventListener('keydown', e => {
    const key = e.code;

    if (key === 'ArrowRight') {
        Body.applyForce(neo, {
            x: neo.position.x,
            y: neo.position.y
          }, {x: 0.075, y: 0});
    } else if (key === 'ArrowLeft') {
        Body.applyForce(neo, {
            x: neo.position.x,
            y: neo.position.y
          }, {x: -0.075, y: 0});
    }
});

function draw(time){
    Engine.update(engine, 1000/60);

    switch (gameStatus) {
        case 'escapeInfo':
            setText('Take the red pill to escape The Matrix', 126);
            setGameStatus('started', 'escape');
            break;
        case 'rescueInfo':
            Composite.clear(engine.world);
            inTheMatrix = false;
            codeStacks = [];
            pills = [];
            setText('Go back in and rescue Morpheus', 185);
            setGameStatus('escaped', 'rescue');
            break;
        case 'exitInfo':
            Composite.clear(engine.world);
            inTheMatrix = false;
            codeStacks = [];
            morpheuses = [];
            setText('Get to a phone to leave The Matrix', 155);
            setGameStatus('rescued', 'exit');
            break;
        case 'theOne':
            Composite.clear(engine.world);
            setText(`You're The One`, 300);
            break;
        case 'notTheOne':
            Composite.clear(engine.world);
            setText(`You're not The One`, 270);
            break;
        default:
            play(time);
            break;
    }

    window.requestAnimationFrame(draw);
}

Render.run(render);

window.requestAnimationFrame(draw);
