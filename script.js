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
        // TODO: check for a play round function that needs to be removed when this function is invoked before attempting to remove a non-existent listener in bot gameplay
        displayController.getBoardUI().removeEventListener('click', playRound);
        if (checkWin()) {
            gameResult = `${getActivePlayer().getName()} won the game!`;
        } else if (gameboard.isBoardFilled()) {
            gameResult = 'Draw!';
        }

        displayController.displayEndResult();
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
            // Display final move with active player who played the winning move unchanged and not switched yet to next player
            displayController.updateDisplay();
            controller.endGame(playRound);
            return;
        };
        controller.switchTurn();
        displayController.updateDisplay();
        displayController.getBoardUI().removeEventListener('click', playRound);
        setTimeout(() => {
            controller.botPlays();

            isGameTerminableWithResult = controller.checkWin() || gameboard.isBoardFilled();
            if (isGameTerminableWithResult) {
                // Display final move with active player who played the winning move unchanged and not switched yet to next player
                displayController.updateDisplay();
                controller.endGame(playRound);
                return;
            };
            controller.switchTurn();
            displayController.updateDisplay();
            displayController.getBoardUI().addEventListener('click', playRound);
        }, 1500)
    };

    const playAllRounds = () => {
        if (controller.getActivePlayer().getType() === "human") {
            displayController.getBoardUI().addEventListener('click', playRound);
        } else {
            displayController.updateDisplay();
            // This initial bot play is unprompted and not triggered by fulfillment of a previous action, unlike within the tempo dictated by clicks and the human playing before hand
            setTimeout(() => {
                controller.botPlays();
                controller.switchTurn();
                displayController.updateDisplay();

                displayController.getBoardUI().addEventListener('click', playRound);
            }, 1500);
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
            // Display final move with active player who played the winning move unchanged and not switched yet to next player
            displayController.updateDisplay();
            controller.endGame(playRound);
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

    const playNextTurn = () => {
        setTimeout(() => {
            controller.botPlays();
            displayController.updateDisplay();
            let isGameTerminableWithResult = controller.checkWin() || gameboard.isBoardFilled();
            if (isGameTerminableWithResult) {
                controller.endGame(playNextTurn);
                displayController.enableButtons();
                return;
            }
            controller.switchTurn();
            // Update screen with logical board updated from bot move
            displayController.updateDisplay();
            // play turn only after this is done, terminating once terminable sort of like a recursive function
            playNextTurn();
        }, 1500);
    };

    const playAllRounds = () => {
        displayController.disableButtons()
        displayController.updateDisplay();
        playNextTurn();
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

    let player1ErrorMessages;
    let player2ErrorMessages;

    let humanPlayerRowInput, humanPlayerColInput;

    let boardDisplay = document.querySelector('.board');
    let replayButton = document.querySelector('.replay');
    let resetButton = document.querySelector('.reset');
    let playButton = document.querySelector('.play');
    let resultDisplay = document.querySelector('.game-result');
    let p1ErrorsDisplay = document.querySelector('.p1.error');
    let p2ErrorsDisplay = document.querySelector('.p2.error');

    // These error functions do not store game logic but control display on surface level DOM before launching into game
    const displayP1InputErrors = () => {
        p1ErrorsDisplay.textContent = player1ErrorMessages;
    };

    const displayP2InputErrors = () => {
        p2ErrorsDisplay.textContent = player2ErrorMessages;
    };

    const storePlayerInfo = () => {
        player1ErrorMessages = player2ErrorMessages = '';

        player1Type = document.querySelector('#p1-human').checked ? document.querySelector('#p1-human').value : document.querySelector('#p1-bot').value;
        player1Name = document.querySelector('#p1-name').value;
        player1Symbol = document.querySelector('#p1-x').checked ? document.querySelector('#p1-x').value : document.querySelector('#p1-o').value;

        if (player1Name.trim() === '') {
            player1ErrorMessages += '*Player 1 name cannot be left blank\r\n';
        }

        player2Type = document.querySelector('#p2-human').checked ? document.querySelector('#p2-human').value : document.querySelector('#p2-bot').value;
        player2Name = document.querySelector('#p2-name').value;
        player2Symbol = document.querySelector('#p2-x').checked ? document.querySelector('#p2-x').value : document.querySelector('#p2-o').value;

        if (player2Name.trim() === '') {
            player2ErrorMessages += '*Player 2 name cannot be left blank\r\n';
        }

        if (player1Symbol === player2Symbol) {
            player1ErrorMessages += '*Player tokens must be different\r\n';
            player2ErrorMessages += '*Player tokens must be different\r\n';
        }

        if (player1Name.trim() === player2Name.trim()) {
            player1ErrorMessages += '*Player names must be different\r\n';
            player2ErrorMessages += '*Player names must be different\r\n';
        }

        // Refresh display and show any errors even if none
        displayP1InputErrors();
        displayP2InputErrors();

        if (player1ErrorMessages || player2ErrorMessages) {
            return false;
        }

        return true;
    };

    const getPlayerInfo = () => {
        let player1Info = { type: player1Type, name: player1Name, symbol: player1Symbol };
        let player2Info = { type: player2Type, name: player2Name, symbol: player2Symbol };
        return { player1Info, player2Info };
    };

    const updateDisplay = () => {

        let board = gameboard.getBoard();
        resultDisplay.textContent = `${gameplayController.getActivePlayer().getName()}'s turn!`;

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
                if (cell.getValue() === getPlayerInfo().player1Info.symbol) {
                    cellButton.classList.add('player-one-move');
                } else if (cell.getValue() === getPlayerInfo().player2Info.symbol) {
                    cellButton.classList.add('player-two-move');
                }
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

    const displayEndResult = () => {
        resultDisplay.textContent = gameplayController.getResult();
    };

    const getCapturedPlayerInput = () => {
        return { col: humanPlayerColInput, row: humanPlayerRowInput }
    };

    const showForm = () => {
        let form = document.querySelector('form.players-info');
        // make form visible
        form.style.display = 'flex';
    };

    const hideForm = () => {
        let form = document.querySelector('form.players-info');
        // make form invisible
        form.style.display = 'none';
    };

    const showGameplaySession = () => {
        let gameplaySessionDisplay = document.querySelector('.gameplay-session');
        // make form invisible
        gameplaySessionDisplay.style.display = 'grid';
    };

    const hideGameplaySession = () => {
        let gameplaySessionDisplay = document.querySelector('.gameplay-session');
        // make form invisible
        gameplaySessionDisplay.style.display = 'none';
    };

    playButton.addEventListener('click', () => {
        enableButtons();
        // TODO: This store method should use the game session data as the controller does not have that data yet unless its the centralized controller storing the player info
        if (storePlayerInfo()) {
            hideForm();
            showGameplaySession();
            // The sessionExecuter is the highest module below the DOM controller that can start the gameplay process based off the input data
            sessionExecuter.startSession();
        }
    });

    const enableButtons = () => {
        replayButton.disabled = false;
        resetButton.disabled = false;
    };

    const disableButtons = () => {
        replayButton.disabled = true;
        resetButton.disabled = true;
    };

    replayButton.addEventListener('click', () => {
        showForm();
        hideGameplaySession();
    });

    resetButton.addEventListener('click', () => {
        sessionExecuter.startSession();
    });

    const getBoardUI = () => boardDisplay;

    return { getPlayerInfo, updateDisplay, getBoardUI, getCapturedPlayerInput, showForm, storePlayerInput, displayEndResult, disableButtons, enableButtons };
})();