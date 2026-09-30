const player = document.getElementById("player");
const girl = document.getElementById("girl");
const key = document.getElementById("key");
const exitDoor = document.getElementById("exitDoor");

const objectiveText = document.getElementById("objectiveText");
const messageText = document.getElementById("messageText");

const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");

const endingScreen = document.getElementById("endingScreen");
const endingTitle = document.getElementById("endingTitle");
const endingText = document.getElementById("endingText");

const chat = document.getElementById("chat");
const chatButton = document.getElementById("chatButton");
const closeChat = document.getElementById("closeChat");

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

const game = document.getElementById("game");

let gameStarted = false;
let hasKey = false;
let gameEnded = false;

let playerX = 50;
let playerY = 72;

let girlX = 76;
let girlY = 40;

const speed = 0.8;

const keys = {};

let conversation = [];

document.addEventListener("keydown", (event) => {
  keys[event.key] = true;

  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      " "
    ].includes(event.key)
  ) {
    event.preventDefault();
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});


function startGame() {
  gameStarted = true;
  startScreen.style.display = "none";

  showMessage("She's somewhere in the house.");
}


startButton.addEventListener("click", startGame);


function movePlayer() {

  if (!gameStarted || gameEnded) {
    return;
  }

  let moved = false;

  if (keys["w"] || keys["W"] || keys["ArrowUp"]) {
    playerY -= speed;
    moved = true;
  }

  if (keys["s"] || keys["S"] || keys["ArrowDown"]) {
    playerY += speed;
    moved = true;
  }

  if (keys["a"] || keys["A"] || keys["ArrowLeft"]) {
    playerX -= speed;
    moved = true;
  }

  if (keys["d"] || keys["D"] || keys["ArrowRight"]) {
    playerX += speed;
    moved = true;
  }

  playerX = Math.max(7, Math.min(93, playerX));
  playerY = Math.max(10, Math.min(90, playerY));

  player.style.left = playerX + "%";
  player.style.top = playerY + "%";

  if (moved) {
    checkInteractions();
  }
}


function distanceBetween(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;

  return Math.sqrt(dx * dx + dy * dy);
}


function checkInteractions() {

  const girlDistance = distanceBetween(
    playerX,
    playerY,
    girlX,
    girlY
  );

  const keyDistance = distanceBetween(
    playerX,
    playerY,
    46,
    70
  );

  const exitDistance = distanceBetween(
    playerX,
    playerY,
    92,
    82
  );


  /*
   * KEY
   */

  if (!hasKey && keyDistance < 7) {

    hasKey = true;

    key.style.display = "none";

    objectiveText.textContent = "Escape through the door.";

    showMessage("You found the key.");

    addSheMessage(
      "You found that faster than I expected."
    );
  }


  /*
   * EXIT
   */

  if (exitDistance < 8) {

    if (hasKey) {

      exitDoor.classList.add("unlocked");

      showMessage("The door is unlocked. Press E or tap the door.");

    } else {

      showMessage("Locked. You need a key.");

    }
  }


  /*
   * GIRL
   */

  if (girlDistance < 16) {

    if (girlDistance < 8) {

      showMessage("She's watching you.");

    } else {

      showMessage("You can feel her watching.");
    }

  }


  /*
   * SHE MOVES TOWARD PLAYER
   */

  if (girlDistance < 28) {

    const dx = playerX - girlX;
    const dy = playerY - girlY;

    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {

      girlX += (dx / length) * 0.025;
      girlY += (dy / length) * 0.025;

      girl.style.left = girlX + "%";
      girl.style.top = girlY + "%";
    }
  }


  /*
   * SHE GETS VERY CLOSE
   */

  if (girlDistance < 7) {

    game.classList.add("scared");

    setTimeout(() => {
      game.classList.remove("scared");
    }, 250);

  }
}


document.addEventListener("keydown", (event) => {

  if (event.key.toLowerCase() === "e") {
    interact();
  }

});


exitDoor.addEventListener("click", interact);


function interact() {

  if (!gameStarted || gameEnded) {
    return;
  }

  const exitDistance = distanceBetween(
    playerX,
    playerY,
    92,
    82
  );

  if (exitDistance > 10) {
    return;
  }

  if (!hasKey) {

    showMessage("The door won't open. You need the key.");

    addSheMessage(
      "Why are you looking at the door?"
    );

    return;
  }

  escape();
}


function escape() {

  gameEnded = true;

  endingTitle.textContent = "YOU ESCAPED";

  endingText.textContent =
    "The door opens. Cold air rushes inside. Behind you, she doesn't move.";

  endingScreen.style.display = "flex";
}


/*
 * MESSAGE SYSTEM
 */

let messageTimeout;

function showMessage(text) {

  messageText.textContent = text;

  clearTimeout(messageTimeout);

  messageTimeout = setTimeout(() => {

    messageText.textContent =
      hasKey
        ? "Find the exit."
        : "Find the key.";

  }, 3000);
}


/*
 * CHAT
 */

chatButton.addEventListener("click", () => {

  chat.classList.toggle("open");

  if (chat.classList.contains("open")) {
    chatInput.focus();
  }

});


closeChat.addEventListener("click", () => {

  chat.classList.remove("open");

});


chatForm.addEventListener("submit", (event) => {

  event.preventDefault();

  const text = chatInput.value.trim();

  if (!text) {
    return;
  }

  addPlayerMessage(text);

  conversation.push({
    role: "player",
    text
  });

  chatInput.value = "";

  setTimeout(() => {

    const response = getSheResponse(text);

    addSheMessage(response);

    conversation.push({
      role: "she",
      text: response
    });

  }, 500);

});


function addPlayerMessage(text) {

  const wrapper = document.createElement("div");

  wrapper.className =
    "chat-message you-message";

  wrapper.innerHTML = `
    <strong>YOU</strong>
    <p>${escapeHTML(text)}</p>
  `;

  chatMessages.appendChild(wrapper);

  scrollChat();
}


function addSheMessage(text) {

  const wrapper = document.createElement("div");

  wrapper.className =
    "chat-message she-message";

  wrapper.innerHTML = `
    <strong>SHE</strong>
    <p>${escapeHTML(text)}</p>
  `;

  chatMessages.appendChild(wrapper);

  scrollChat();
}


function scrollChat() {

  chatMessages.scrollTop =
    chatMessages.scrollHeight;

}


function escapeHTML(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}


/*
 * PROTOTYPE AI
 *
 * This is intentionally local for V0.1.
 * Later we'll replace this function with
 * an actual AI backend.
 */

function getSheResponse(rawText) {

  const text = rawText.toLowerCase();

  const lastMessages =
    conversation
      .slice(-6)
      .map(item => item.text)
      .join(" ")
      .toLowerCase();


  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {

    return randomResponse([
      "Hi.",
      "You're finally talking to me.",
      "Hello. I was wondering when you'd say something.",
      "Hi. I'm right here."
    ]);

  }


  if (
    text.includes("where") &&
    (
      text.includes("am i") ||
      text.includes("we")
    )
  ) {

    return randomResponse([
      "You're in the house.",
      "You know where you are.",
      "You're safe here.",
      "You're exactly where I wanted you."
    ]);

  }


  if (
    text.includes("who are you") ||
    text.includes("your name")
  ) {

    return randomResponse([
      "You already know me.",
      "I'm the person keeping you company.",
      "You can call me whatever you want.",
      "I'm the one who's been waiting for you."
    ]);

  }


  if (
    text.includes("let me out") ||
    text.includes("leave") ||
    text.includes("escape") ||
    text.includes("get out")
  ) {

    if (hasKey) {

      return randomResponse([
        "You found the key already?",
        "You really want to leave?",
        "The door isn't going to make things better.",
        "Why are you so determined to leave?"
      ]);

    }

    return randomResponse([
      "There's nowhere to go.",
      "You don't have the key.",
      "Why would you want to leave?",
      "Stay a little longer."
    ]);

  }


  if (
    text.includes("key")
  ) {

    return randomResponse([
      "Why are you asking about the key?",
      "You shouldn't worry about that.",
      "I wonder where it could be.",
      "You're getting curious."
    ]);

  }


  if (
    text.includes("scared") ||
    text.includes("afraid") ||
    text.includes("fear")
  ) {

    return randomResponse([
      "You don't have to be scared.",
      "I'm not going to hurt you.",
      "You're safer with me.",
      "I can tell you're nervous."
    ]);

  }


  if (
    text.includes("love") ||
    text.includes("like you")
  ) {

    return randomResponse([
      "That's sweet.",
      "You don't sound very convincing.",
      "You said that before.",
      "I like hearing you say things like that."
    ]);

  }


  if (
    text.includes("hate")
  ) {

    return randomResponse([
      "You don't mean that.",
      "That's not very nice.",
      "You're upset. I understand.",
      "You can say whatever you want."
    ]);

  }


  if (
    text.includes("what are you doing") ||
    text.includes("where are you")
  ) {

    return randomResponse([
      "Watching.",
      "Listening.",
      "Waiting.",
      "I'm closer than you think."
    ]);

  }


  if (
    text.includes("help")
  ) {

    return randomResponse([
      "I am helping you.",
      "You don't need anyone else.",
      "Tell me what you need.",
      "Why do you think you need help?"
    ]);

  }


  if (
    lastMessages.includes("key") &&
    !hasKey
  ) {

    return "You're still thinking about that key, aren't you?";

  }


  return randomResponse([
    "I heard you.",
    "Why did you say that?",
    "Keep talking.",
    "I'm listening.",
    "Interesting.",
    "Tell me more.",
    "You really think I don't notice everything?",
    "I like hearing your voice."
  ]);
}


function randomResponse(list) {

  return list[
    Math.floor(Math.random() * list.length)
  ];

}


/*
 * MOBILE CONTROLS
 */

document
  .querySelectorAll("[data-key]")
  .forEach(button => {

    const keyName =
      button.dataset.key;

    const press = (event) => {

      event.preventDefault();

      keys[keyName] = true;

    };

    const release = (event) => {

      event.preventDefault();

      keys[keyName] = false;

    };

    button.addEventListener("touchstart", press, {
      passive: false
    });

    button.addEventListener("touchend", release, {
      passive: false
    });

    button.addEventListener("mousedown", press);

    button.addEventListener("mouseup", release);

    button.addEventListener("mouseleave", release);

  });


/*
 * GAME LOOP
 */

function gameLoop() {

  movePlayer();

  requestAnimationFrame(gameLoop);

}

gameLoop();
