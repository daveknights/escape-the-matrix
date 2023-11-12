const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Body = Matter.Body
    Events = Matter.Events,
    Collision = Matter.Collision,
    Composites = Matter.Composites,
    Composite = Matter.Composite;
const engine = Engine.create();
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        background: '#00110b',
        wireframes: false
    },
});
const playerCategory = 0x0002;
const xPosArray = [];
const codeStacks = [];
const pills = [];
let codeDrop = 0;
let pillDrop = 0;
let lastTime = 0;
let playing = true;
let xPos = 43;
// Create arrray with pre defined x value for code stacks
while (xPos < 734) {
    xPosArray.push(xPos);

    xPos += 30;
}

const randomXPos = () => xPosArray[Math.floor(Math.random() * (xPosArray.length - 1))];

const randomSize = () => Math.floor(Math.random() * (10 - 5)) + 5;

const randomChar = () => Math.floor(Math.random() * 20) + 1;
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

const pill = xPos => {
    return Bodies.rectangle(xPos, -50, 24, 50, {
        frictionAir: 0.1,
        collisionFilter: { mask: playerCategory },
        render: {
            sprite: {
                texture: 'assets/redPill.png',
            }
        }
    });
}

const player = Bodies.rectangle(400, 560, 50, 80, {
    inertia: Infinity,
    collisionFilter: {
        category: playerCategory,
    },
    render: {
        sprite: {
            texture: 'assets/neo.png',
        }
    }
});

Composite.add(engine.world, [player, boundry(400, 600, 810, 1), boundry(-10, 300, 20, 600), boundry(810, 300, 20, 600)]);

document.addEventListener('keydown', e => {
    const key = e.code;

    if (key === 'ArrowRight') {
        Body.applyForce(player, {
            x: player.position.x,
            y: player.position.y
          }, {x: 0.075, y: 0});
    } else if (key === 'ArrowLeft') {
        Body.applyForce(player, {
            x: player.position.x,
            y: player.position.y
          }, {x: -0.075, y: 0});
    }
});

Render.run(render);

function draw(time){
    Engine.update(engine, 1000/60);

    codeDrop += time - lastTime;
    pillDrop += time - lastTime;

    if (codeDrop > 250) {
        const newStack = codeStack(randomSize());

        codeStacks.push(newStack);
        Composite.add(engine.world, newStack);

        codeDrop = 0;
    }

    if (codeStacks.length) {
        for (let [i, stack] of codeStacks.entries()) {
            // Remove offscreen items
            if (stack.bodies[0].position.y > 600) {
                Composite.remove(engine.world, stack);
                codeStacks.splice(i, 1);
                i--;
            }
            // Stop animation on collision
            for (const body in stack.bodies) {
                if (Collision.collides(stack.bodies[body], player) !== null) {
                    Render.stop(render);
                    playing = false;
                }
            }
        }
    }
    // Drop pill every 10 seconds
    if (pillDrop > 10000) {
        let newPill;

        if (player.position.x > 400) {
            newPill = pill(25)
        } else {
            newPill = pill(775)
        }

         pills.push(newPill);
         Composite.add(engine.world, newPill);

        pillDrop = 0;
    }

    if (pills.length) {
        for (const pill of pills) {
            // Remove offscreen items
            if (pill.position.y > 600) {
                Composite.remove(engine.world, pill);
                pills.splice(0, 1);
            }
            // Stop animation on collision
            if (Collision.collides(pill, player) !== null) {
                Render.stop(render);
                playing = false;
            }
        }
    }

    lastTime = time;

    playing && window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);
