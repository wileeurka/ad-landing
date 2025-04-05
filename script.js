const { Engine, Render, Runner, World, Bodies, Events, Body, Composite } =
  Matter;

const popup = document.querySelector(".modal");
const width = 640;
const height = 690;
let popupCount = 1;
const plinkoImg = document.querySelector(".plinko__img");
const plinkoGame = document.querySelector("#plinkoCanvas");
const containerRef = document.querySelector(".container");
const btn = document.querySelector(".start-btn");
const modalBtn = document.querySelector(".modal__btn");
const wheel = document.querySelector(".wheel");
const spinner = document.getElementById("wheel__spinner");

// Создание движка
const engine = Engine.create();
const { world } = engine;

// Создание рендера
const render = Render.create({
  element: document.querySelector(".container"),
  engine: engine,
  canvas: document.getElementById("plinkoCanvas"),
  options: {
    width,
    height,
    wireframes: false,
    background: "#00000000",
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

const pegRadius = 10;
const horizontalSpacing = 43;
let verticalSpacing = 46.8;

engine.world.gravity.y = 0.8;

const createPegs = () => {
  let numPegs = 2;
  let yOffset = 90;

  for (let row = 1; row <= 6; row++) {
    let xOffset = (width - (numPegs - 1) * horizontalSpacing) / 2;

    for (let col = 0; col < numPegs; col++) {
      let x = xOffset + col * horizontalSpacing;
      let y = yOffset + row * verticalSpacing;

      World.add(
        world,
        Bodies.circle(x, y, pegRadius, {
          isStatic: true,
          label: "pin",
          restitution: 0.5,
          friction: 0.3,
          render: {
            fillStyle: "#000000000",
            opacity: 1,
          },
        })
      );
    }

    if (row < 5) {
      numPegs++; // Увеличиваем на 1 до 6
    } else if (row === 5) {
      numPegs += 2; // Пропускаем 7 и сразу делаем 8
    }
  }
};

const createWalls = () => {
  const leftWall = Bodies.rectangle(-10, height / 2, 20, height, {
    isStatic: true,
    render: { fillStyle: "transparent" },
  });
  const rightWall = Bodies.rectangle(width + 10, height / 2, 20, height, {
    isStatic: true,
    render: { fillStyle: "transparent" },
  });
  World.add(world, [leftWall, rightWall]);
};

const createContainers = () => {
  const containerWidth = width / 5;
  const containerHeight = 20;
  const containerY = height - 260;

  for (let i = 0; i < 5; i++) {
    const x = i * containerWidth + containerWidth / 2;
    const container = Bodies.rectangle(
      x,
      containerY,
      containerWidth,
      containerHeight,
      {
        isStatic: true,
        label: `container-${i}`,
        render: {
          fillStyle: "#0000000000",
        },
      }
    );
    World.add(world, container);

    const containerElement = document.createElement("div");
    containerElement.classList.add(`container-${i}`);
    containerElement.classList.add("container-box");
    document.querySelector(".container").appendChild(containerElement);
  }
};

const addBall = (velocityX, velocityY) => {
  const ball = Bodies.circle(width / 2, 90, 10, {
    restitution: 0.8,
    friction: 0.2,
    frictionAir: 0.02,
    label: "Circle",
    collisionFilter: {
      group: -1,
      category: 0x0001,
      mask: 0x0001,
    },
    render: {
      sprite: {
        xScale: 1,
        yScale: 1,
        texture: "./images/plinko-ball.png",
      },
    },
  });

  Body.setVelocity(ball, { x: velocityX, y: velocityY });
  World.add(world, ball);
};

const releaseBalls = () => {
  const velocities = [{ x: 0.5, y: -1 }];

  velocities.forEach((velocity, index) => {
    setTimeout(() => {
      addBall(velocity.x, velocity.y);
    }, index * 500);
  });

  showModal();
};

const showModal = () => {
  setTimeout(() => {
    popup.classList.remove("hidden");
  }, 3250);
  setTimeout(() => {
    popup.classList.add("hidden");
    popupCount += 1;
    if (popupCount > 1) {
      openWheel();
    } else {
      window.location.href = offerUrl;
    }
  }, 9000);
};

createPegs();
createWalls();
createContainers();

let canClick = true;

document.addEventListener("click", () => {
  if (canClick) {
    canClick = false;
    releaseBalls();
  }
});

const playSound = (soundFile) => {
  const audio = new Audio(soundFile);
  audio.play();
};

const onBounceCollision = (event) => {
  const pairs = event.pairs;
  for (const pair of pairs) {
    const { bodyA, bodyB } = pair;
    if (bodyB.label.includes("Circle") && bodyA.label.includes("pin")) {
      playSound("./sounds/public_sounds_dot_2.mp3");

      const xPos = bodyA.position.x;
      const yPos = bodyA.position.y;
      let radius = pegRadius;
      let bounceEffect = null;
      let bounceTimer = setInterval(() => {
        if (bounceEffect !== null) {
          World.remove(world, bounceEffect);
        }
        bounceEffect = Bodies.circle(xPos, yPos, radius, {
          collisionFilter: { group: -2, category: 0x0002, mask: 0x0002 },
          render: {
            fillStyle: "#b1b1b1",
          },
          isStatic: true,
        });
        Composite.add(world, bounceEffect);
        radius = radius + pegRadius / 8;
        if (radius > pegRadius * 2.5) {
          World.remove(world, bounceEffect);
          clearInterval(bounceTimer);
        }
      }, 5);
    }

    if (bodyB.label.includes("Circle") && bodyA.label.includes("container")) {
      playSound("./sounds/public_sounds_reach_2.wav");
      World.remove(world, bodyB);
      const containerElement = document.querySelector(`.${bodyA.label}`);
      if (containerElement) {
        containerElement.classList.add("animate");
        setTimeout(() => {
          containerElement.classList.remove("animate");
        }, 1000);
      }
    } else if (
      bodyA.label.includes("Circle") &&
      bodyB.label.includes("container")
    ) {
      playSound("./sounds/public_sounds_reach_2.wav");
      World.remove(world, bodyA);
      const containerElement = document.querySelector(`.${bodyB.label}`);
      if (containerElement) {
        containerElement.classList.add("animate");
        setTimeout(() => {
          containerElement.classList.remove("animate");
        }, 1000);
      }
    }
  }
};

Events.on(engine, "collisionStart", onBounceCollision);

Engine.run(engine);
Render.run(render);

// Modal

btn.addEventListener("click", () => {
  if (popupCount > 1) {
    spin();
  }
});

modalBtn.addEventListener("click", () => {
  if (popupCount === 1) {
    popup.classList.add("hidden");
    popupCount += 1;
    openWheel();
  } else {
    window.location.href = offerUrl;
  }
});

const openWheel = () => {
  plinkoImg.style.display = "none";
  plinkoGame.style.display = "none";
  wheel.style.display = "block";
  containerRef.style.background = "none";
  btn.textContent = spinText;
  btn.classList.add("spin");
  document.querySelector(".bodyWrapper__img").style.display = "block";
  document.querySelector("body").classList.add("spin");
};

const spin = () => {
  spinner.classList.add("wheel__spinner_animated_1");
  document.querySelector(".modal__win-2").style.display = "block";
  setTimeout(function () {
    popup.classList.remove("hidden");
  }, 4100);
  setTimeout(() => {
    window.location.href = offerUrl;
  }, 8000);
};

// lang
let spinText = "SPIN";
document.addEventListener("DOMContentLoaded", function () {
  fetch("./translations.json")
    .then((response) => response.json())
    .then((translations) => {
      if (country === "{country}") country = "EN";

      const translation = translations[country];

      if (translation) {
        document.querySelector(".modal__label").innerHTML =
          translation.popupTitle;
        document.querySelector(".modal__win-1").innerHTML = translation.win1;
        document.querySelector(".modal__win-2").textContent = translation.win2;
        document.querySelector(".modal__cta").innerHTML = translation.cta;
        document.querySelector(".modal__btn").innerHTML =
          translation.popupButton;
        document.querySelector(".modal__info").textContent = translation.info;
        document.querySelector(".start-btn").textContent = translation.play;
        spinText = translation.spin;

        const wheelBonuses = document.querySelectorAll(".wheel__bonus span");
        translation.wheelBonuses.forEach((bonus, index) => {
          if (wheelBonuses[index]) {
            wheelBonuses[index].innerHTML = bonus;
          }
        });
      } else {
        console.error(`No translations found for country: ${country}`);
      }
    })
    .catch((error) => console.error("Error loading translations:", error));
});
