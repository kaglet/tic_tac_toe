// MULTIPLE INSTANCE OBJECTS (FACTORIES) //

function Cell() {
    let value = "";

    const isEmpty = () => {
        return value === "";
    }

    const writeToken = (token) => {
        value = token;
    }

    const getValue = () => value;

    return { isEmpty, writeToken, getValue };
}

function Player() {
    let score = 0;
    let token;
    let name;
    let type;

    const winRound = () => {
        score++;
    };

    const chooseToken = (chosenToken) => {
        token = chosenToken;
    };

    const getToken = () => token;

    const getName = () => name;

    const getType = () => type;

    const setName = (newName) => {
        name = newName;
    };

    const setType = (playerType) => {
        type = playerType;
    };

    return { winRound, chooseToken, getToken, getName, getType, setName, setType }
}

function Bot() {
    let player = Player();
    player.setType('bot');
    // All bot players can perform this action to place a random move on an open spot on board
    const playBotMove = () => {
        let availableCells = gameboard.getBoard().flat().filter(cell => cell.isEmpty());

        let min = 0;
        let max = availableCells.length - 1;
        randomCellPos = Math.floor(Math.random() * (max - min + 1)) + min;

        // Board is filled so there is no available cell to play to
        if (availableCells.length === 0) return;

        availableCells[randomCellPos].writeToken(player.getToken());
    };

    return Object.assign({}, player, { playBotMove });
}

function Human() {
    let player = Player();
    player.setType('human');

    return Object.assign({}, player);
}

// SINGLE INSTANCE OBJECTS (MODULE PATTERN SINGLETONS) //

// Bundles up (stores) and sets game session data
const gameSession = function () {
    let player1, player2;

    const createPlayers = () => {
        let player1Type = displayController.getPlayerInfo().player1Info.type;

        switch (player1Type) {
            case 'human':
                player1 = Human();
                break;
            case 'bot':
                player1 = Bot();
                break;
            default:
                break;
        }

        let player2Type = displayController.getPlayerInfo().player2Info.type;

        switch (player2Type) {
            case 'human':
                player2 = Human();
                break;
            case 'bot':
                player2 = Bot();
                break;
            default:
                break;
        }

        // set custom name
        player1.setName(displayController.getPlayerInfo().player1Info.name);
        player2.setName(displayController.getPlayerInfo().player2Info.name);

        // set custom token
        player1.chooseToken(displayController.getPlayerInfo().player1Info.symbol);
        player2.chooseToken(displayController.getPlayerInfo().player2Info.symbol);
    };

    const getSelectedPlayers = () => {
        return { player1, player2 };
    };

    return { getSelectedPlayers, createPlayers };
}();

const gameboard = function () {
    const cols = rows = 3;
    board = [];

    // Perform the first initialization with the once created cell objects to be reused for all game sessions, much like this gameboard
    for (let i = 0; i < rows; i++) {
        board[i] = [];
        for (let j = 0; j < cols; j++) {
            board[i].push(Cell());
        }
    }

    const resetBoard = () => {
        board.forEach((row) => {
            row.forEach((cell) => {
                cell.writeToken("");
            });
        });
    };

    const playMove = ({ row, col }, player) => {
        const isMoveValid = board[row][col].isEmpty();
        if (!isMoveValid) {
            alert('Move is invalid. Please try again');
            return false;
        };

        board[row][col].writeToken(player.getToken());
        return true;
    };

    const getBoard = () => board;

    const isBoardFilled = () => board.every(row => {
        return row.every(cell => {
            return !cell.isEmpty();
        });
    });

    return { playMove, getBoard, resetBoard, isBoardFilled };
}();

// Bundles up functionality that initializes and controls the flow and tempo of the overall game play from start, middle to end
const gameplayController = (() => {
    let player1, player2;
    let activePlayer;

    const setPlayersFromSessionData = () => {
        ({ player1, player2 } = gameSession.getSelectedPlayers());
        activePlayer = player1;
    };

    const switchTurn = () => {
        activePlayer = (activePlayer === player1) ? player2 : player1;
    };

    const getActivePlayer = () => activePlayer;

    const humanPlays = (e) => {
        displayController.storePlayerInput(e);

        let row = displayController.getCapturedPlayerInput().row;
        let col = displayController.getCapturedPlayerInput().col;

        if (gameboard.playMove({ row, col }, getActivePlayer()) === false) return false;
    };

    const botPlays = () => {
        // Play bot move in the special way a bot does it, not requiring the gameboard's playMove method
        getActivePlayer().playBotMove();
    };

    // Check if previous move resulted in a winning configuration occurring
    const checkWin = () => {
        let horizontalMidPosition = verticalMidPosition = 1;
        let boardArr = gameboard.getBoard();

        // Check comparison point is not empty to not match based off emptiness
        let middleIsNonEmpty;
        for (let i = 0; i < gameboard.getBoard().length; i++) {
            // Check horizontally (across rows)
            middleIsNonEmpty = !boardArr[i][horizontalMidPosition].isEmpty();
            let middleEqualsRight = boardArr[i][horizontalMidPosition].getValue() === boardArr[i][horizontalMidPosition + 1].getValue();
            let middleEqualsLeft = boardArr[i][horizontalMidPosition].getValue() === boardArr[i][horizontalMidPosition - 1].getValue();
            let rowHasMatchingTokens = middleIsNonEmpty && middleEqualsLeft && middleEqualsRight;
            if (rowHasMatchingTokens) {
                return true;
            }

            // Check vertically (across cols)
            middleIsNonEmpty = !boardArr[verticalMidPosition][i].isEmpty();
            let middleEqualsUp = boardArr[verticalMidPosition][i].getValue() === boardArr[verticalMidPosition - 1][i].getValue();
            let middleEqualsDown = boardArr[verticalMidPosition][i].getValue() === boardArr[verticalMidPosition + 1][i].getValue();
            let colHasMatchingTokens = middleIsNonEmpty && middleEqualsUp && middleEqualsDown;
            if (colHasMatchingTokens) {
                return true;
            }
        }

        // Check diagonally
        let middleCell = boardArr[verticalMidPosition][horizontalMidPosition];
        middleIsNonEmpty = !middleCell.isEmpty();
        let toBottomLeftDiag = middleIsNonEmpty && middleCell.getValue() === boardArr[0][2].getValue() && middleCell.getValue() === boardArr[2][0].getValue();
        let toBottomRightDiag = middleIsNonEmpty && middleCell.getValue() === boardArr[0][0].getValue() && middleCell.getValue() === boardArr[2][2].getValue();

        // Return final true or false if the last check fails
        return toBottomLeftDiag || toBottomRightDiag;
    };

    const endGame = (playRound) => {
        displayController.getBoardUI().removeEventListener('click', playRound);
        if (gameboard.isBoardFilled()) {
            gameResult = 'Draw!';
        } else {
            gameResult = `${getActivePlayer().getName()} won the game!`;
        }
        // Beyond this function terminate further logic if you can
    };

    const getResult = () => gameResult;

    return { switchTurn, getActivePlayer, setPlayersFromSessionData, humanPlays, botPlays, checkWin, endGame, getResult };
})();

let humanBotGameController = (() => {
    let controller = gameplayController;

    const playRound = (e) => {
        // Return if play is invalid without switching turn, to be successful on next initiation of play round function
        if (controller.humanPlays(e) === false) return;
        let isGameTerminableWithResult = controller.checkWin() || gameboard.isBoardFilled();
        if (isGameTerminableWithResult) {
            controller.endGame(playRound);
            // show final move
            displayController.updateDisplay();
            return;
        };
        controller.switchTurn();
        displayController.updateDisplay();

        controller.botPlays();

        isGameTerminableWithResult = controller.checkWin() || gameboard.isBoardFilled()
        if (isGameTerminableWithResult) {
            controller.endGame(playRound);
            // Display final move with active player who played the winning move unchanged and not switched yet to next player
            displayController.updateDisplay();
            return;
        };
        controller.switchTurn();
        displayController.updateDisplay();
    };

    const playAllRounds = () => {
        if (controller.getActivePlayer().getType() === "human") {
            displayController.getBoardUI().addEventListener('click', playRound);
        } else {
            // This initial bot play is unprompted and not triggered by fulfillment of a previous action, unlike within the tempo dictated by clicks and the human playing before hand
            controller.botPlays();
            controller.switchTurn();
            displayController.updateDisplay();

            displayController.getBoardUI().addEventListener('click', playRound);
        }
    };

    return Object.assign({}, controller, { playAllRounds });
})();

// These are sub-controller modules that extend the main game play controller //
let humanHumanGameController = (() => {
    let controller = gameplayController;

    const playRound = (e) => {
        // Return if play is invalid without switching turn, to be successful on next initiation of play round function
        if (controller.humanPlays(e) === false) return;
        let isGameTerminableWithResult = controller.checkWin() || gameboard.isBoardFilled();
        if (isGameTerminableWithResult) {
            controller.endGame(playRound);
            // Display final move with active player who played the winning move unchanged and not switched yet to next player
            displayController.updateDisplay();
            return;
        };
        controller.switchTurn();
        // Display next player in turn and previous player's move on board
        displayController.updateDisplay();
    };

    const playAllRounds = () => {
        displayController.getBoardUI().addEventListener('click', playRound);
    };

    return Object.assign({}, controller, { playAllRounds });
})();

let botBotGameController = (() => {
    let controller = gameplayController;

    const playRound = () => {
        const turnCount = 2;
        for (let i = 0; i < turnCount; i++) {
            controller.botPlays();

            let isGameTerminableWithResult = controller.checkWin() || gameboard.isBoardFilled();
            if (isGameTerminableWithResult) {
                return true;
            }
            controller.switchTurn();
            // Update screen with logical board updated from bot move
            displayController.updateDisplay();
        }
    };

    const playAllRounds = () => {

        do {
        } while (!playRound());

        controller.endGame(playRound);
        // Display final move with active player who played the winning move unchanged and not switched yet to next player
        displayController.updateDisplay();
    };

    return Object.assign({}, controller, { playAllRounds });
})();

// Initializes a new session with player data captured and executes the respective chosen gameplay controller to start the game
let sessionExecuter = (() => {
    const startSession = () => {
        // Ensure gameboard is reset from previous round
        gameboard.resetBoard();

        // TODO: Possibly refactor to reduce the redundancy of the game session having to create methods now instead of earlier as a service invoked by the DOM method
        /* 
        This function sets players for current session as stored from DOM storage method 
        although they could directly be stored from DOM the first time in storage method, 
        calling the other method of the gameSession services.
        */
        gameSession.createPlayers();
        let { player1, player2 } = gameSession.getSelectedPlayers();
        if (player1.getType() === 'human' && player2.getType() === 'human') {
            playHumanHumanGame();
        } else if (player1.getType() === 'bot' && player2.getType() === 'bot') {
            playBotBotGame();
        } else if ((player1.getType() === 'human' && player2.getType() === 'bot') || (player1.getType() === 'bot' && player2.getType() === 'human')) {
            playHumanBotGame();
        }
    };

    const playHumanBotGame = () => {
        // TODO: Potentially remove the need for another set players for game session function since there are now 3 stages for this when there could only be one
        /* Because again, setting players for this controller from the session from the DOM seems redundant */
        humanBotGameController.setPlayersFromSessionData();
        displayController.updateDisplay();
        humanBotGameController.playAllRounds();
    };

    const playHumanHumanGame = () => {
        humanHumanGameController.setPlayersFromSessionData();
        displayController.updateDisplay();
        humanHumanGameController.playAllRounds();
    };

    const playBotBotGame = () => {
        botBotGameController.setPlayersFromSessionData();
        displayController.updateDisplay();
        botBotGameController.playAllRounds();
    };

    return { startSession };
})();

let displayController = (() => {
    let player1Type;
    let player1Name;
    let player1Symbol;

    let player2Type;
    let player2Name;
    let player2Symbol;

    let humanPlayerRowInput, humanPlayerColInput;

    let boardDisplay = document.querySelector('.board');
    let replayButton = document.querySelector('.replay');
    let playButton = document.querySelector('.play');
    let dialog = document.querySelector('dialog');
    let resultDisplay = document.querySelector('.game-result');

    const storePlayerInfo = () => {
        player1Type = document.querySelector('#p1-human').checked ? document.querySelector('#p1-human').value : document.querySelector('#p1-bot').value;
        player1Name = document.querySelector('#p1-name').value;
        player1Symbol = document.querySelector('#p1-x').checked ? document.querySelector('#p1-x').value : document.querySelector('#p1-o').value;

        player2Type = document.querySelector('#p2-human').checked ? document.querySelector('#p2-human').value : document.querySelector('#p2-bot').value;
        player2Name = document.querySelector('#p2-name').value;
        player2Symbol = document.querySelector('#p2-x').checked ? document.querySelector('#p2-x').value : document.querySelector('#p2-o').value;
        // TODO: Make sure player 1 and 2 symbols differ else do not allow to move on beyond in play method so we have to retry the store method
        // TODO: Make sure a name for each is entered and field is not empty
        // TODO: Show these results as part of error shower object in display controller that logs the errors like my previous sign up project, for the player where the error is relevant so a player 1 and 2 error logger
        // TODO: Mark name as required field in the HTML
    };

    const getPlayerInfo = () => {
        let player1Info = { type: player1Type, name: player1Name, symbol: player1Symbol };
        let player2Info = { type: player2Type, name: player2Name, symbol: player2Symbol };
        return { player1Info, player2Info };
    };

    const updateDisplay = () => {
        let turnDisplay = document.querySelector('.turn');

        let board = gameboard.getBoard();
        turnDisplay.textContent = `${gameplayController.getActivePlayer().getName()}'s turn!`;

        while (boardDisplay.firstChild) {
            boardDisplay.removeChild(boardDisplay.lastChild);
        }

        // TODO: For each cell already there in the board display, simply update its value don't do this rerender of new objects. Have initial board creation and render of permanent UI board that is not to be changed
        board.forEach((row, i) => {
            row.forEach((cell, j) => {
                const cellButton = document.createElement("button");
                cellButton.classList.add("cell");
                // Set custom data attributes that are easily accessible from a DOM target
                cellButton.dataset.row = i;
                cellButton.dataset.column = j;
                cellButton.textContent = cell.getValue();
                boardDisplay.appendChild(cellButton);
            })
        });
    };

    const storePlayerInput = (event) => {
        const selectedColumn = event.target.dataset.column;
        const selectedRow = event.target.dataset.row;

        // On click of an element not a cell on the board store no player input for cell selected
        if (!selectedColumn || !selectedRow) return;

        humanPlayerRowInput = selectedRow;
        humanPlayerColInput = selectedColumn;
    };

    const getCapturedPlayerInput = () => {
        return { col: humanPlayerColInput, row: humanPlayerRowInput }
    };

    const showEndDialog = () => {
        resultDisplay.textContent = `The winner is ${gameplayController.getResult()}`;
        dialog.showModal();
    };

    const hideEndDialog = () => {
        dialog.close();
    };

    const showForm = () => {
        let form = document.querySelector('form.players-info');
        // make form visible
        form.style.display = 'block';
    };

    const hideForm = () => {
        let form = document.querySelector('form.players-info');
        // make form invisible
        form.style.display = 'none';
    };

    const showBoard = () => {
        let board = document.querySelector('.board');
        // make form invisible
        board.style.display = 'grid';
    };

    const hideBoard = () => {
        let board = document.querySelector('.board');
        // make form invisible
        board.style.display = 'none';
    };

    playButton.addEventListener('click', () => {
        // TODO: This store method should use the game session data as the controller does not have that data yet unless its the centralized controller storing the player info
        storePlayerInfo();
        hideForm();
        showBoard();
        // The sessionExecuter is the highest module below the DOM controller that can start the gameplay process based off the input data
        sessionExecuter.startSession();
    });

    replayButton.addEventListener('click', () => {
        showForm();
        hideBoard();
    });

    const getBoardUI = () => boardDisplay;

    return { getPlayerInfo, updateDisplay, getBoardUI, getCapturedPlayerInput, showForm, storePlayerInput };
})();

// Can other objects care about the details of the implementation? I.e. can this job better be outsourced somewhere else so a centralised location. 
// When you create players get the info from the DOM service not as a parameters, that is what making it restrictive means, it doesn't mean exchange of info between services is not possible
// parameters to provide data are unnecessary when you have services from other objects to provide data

// Intermediate steps might not be needed
// TODO: Optionally set winner player via internal method to know who's name to display and it is not dependent on the previous functionality of who was switched to the active player at game's end
// TODO: Create better return output e.g. playMove can return false to help other functions break and return even though it doesn't seem like a boolean function even if early escape with condition returns make sense and need a true/false return
// If this logic is enforced though you do not need to worry about small things like this. but they are nice maintenance points.

// the different modules can extract temporary visual data from the DOM services provided by the displayController
// then get data from game session where its really permanently stored and decoupled from the impermanent and volatile DOM that only displays data and is reliable for nothing else

// Adding one object to link to each other in providing services helps decoupling. You can give the other object data from anywhere and it will feed nicely to the rest of the system. 