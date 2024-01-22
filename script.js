// Multiple instance objects

function Cell() {
    let value = "";
    // Outside this function we do not have to care what defines emptiness. Instead it is known inside a cell's own internal implementation.
    // This therefore only has to be changed in one place for all objects that access this function.
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
    // TODO: Do something with the name, like use it in printings
    let name;

    const winRound = () => {
        score++;
    };

    const chooseToken = (chosenToken) => {
        token = chosenToken;
    };

    const getToken = () => token;

    return { winRound, chooseToken, getToken }
}

function Bot() {
    let player = Player();

    let name = "bot";
    let type = 'bot';

    // All bot players can perform this action to place random move on open spot on board
    const playBotMove = () => {
        // Reduce dimensionality of array and eliminate cells played on to produce a list of cell objects that have not been played on
        // Objects are assigned by reference so same objects in the 2D array are the same as the ones in this 1D array
        let availableCells = gameboard.getBoard().flat().filter(cell => cell.isEmpty());

        let min = 0;
        let max = availableCells.length - 1;
        randomCellPos = Math.floor(Math.random() * (max - min + 1)) + min;

        // If no available cells for bot to play on then board is filled and will be caught out
        if (availableCells.length === 0) return;

        availableCells[randomCellPos].writeToken(player.getToken());
    };

    const getName = () => name;

    const getType = () => type;

    const setName = (newName) => { name = newName };

    return Object.assign({}, player, { playBotMove, getName, setName, getType });
}

function Human() {
    let player = Player();

    let name = "human";
    let type = "human";

    const getName = () => name;

    const getType = () => type;

    const setName = (newName) => { name = newName };

    return Object.assign({}, player, { getName, setName, getType });
}

// Single instance objects

// Bundles up (stores) and sets game session data
const gameSession = function () {
    let player1, player2;

    // When you create players get the info from the DOM service not as a parameters, that is what making it restrictive means, it doesn't mean exchange of info between services is not possible
    // then it needs something from the outside and its not closed to itself for other services that access it too
    // parameters to provide data are unnecessary when you have services from other objects to provide data
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

        player1.setName(displayController.getPlayerInfo().player1Info.name);
        player2.setName(displayController.getPlayerInfo().player2Info.name);

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

    // a single final initialization with the cell objects that will always be used
    for (let i = 0; i < rows; i++) {
        board[i] = [];
        for (let j = 0; j < cols; j++) {
            board[i].push(Cell());
        }
    }

    const resetBoard = () => {
        board.forEach((row, i) => {
            row.forEach((col, j) => {
                board[i][j].writeToken("");
            });
        });
    };

    const printBoard = () => {
        const valueBoard = board.map(row => row.map(cell => cell.getValue()));
        for (let i = 0; i < valueBoard.length; i++) {
            console.log(`[${valueBoard[i].toString()}]`);
        }
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

    return { printBoard, playMove, getBoard, resetBoard, isBoardFilled };
}();

// Bundles up functionality that initializes and controls the flow of the overall gameplay session
const gameplayController = function () {
    let player1, player2;
    let activePlayer

    const setPlayersFromSessionData = () => {
        ({ player1, player2 } = gameSession.getSelectedPlayers());
        activePlayer = player1;
    };

    const switchTurn = () => {
        activePlayer = (activePlayer === player1) ? player2 : player1;
    };

    // print round and that relevant info explicitly not via GUI which first extracts info like board, and active player, and does it all in the GUI to "print" instead of here
    const printRound = () => {
        gameboard.printBoard();
    };

    const getActivePlayer = () => activePlayer;

    const humanPlays = (e) => {
        displayController.storePlayerInput(e);
        // get data from store just entered on click and call human plays after so I don't have to get through too many parameter passes
        let row = displayController.getCapturedPlayerInput().row;
        let col = displayController.getCapturedPlayerInput().col;
        console.log(`It is the following player\'s turn: ${getActivePlayer().getName()}`);

        if (gameboard.playMove({ row, col }, getActivePlayer()) === false) return false;

        console.log(`Placing ${getActivePlayer().getName()}'s token`);
        printRound();
    };

    const botPlays = () => {
        console.log(`It is the following player\'s turn: ${getActivePlayer().getName()}`);
        console.log(`Placing ${getActivePlayer().getName()}'s token`);
        getActivePlayer().playBotMove();
        printRound();
    }

    // check if previous move resulted in a winning configuration occurring
    const checkWin = () => {
        let horizontalMidPosition = verticalMidPosition = 1;
        let boardArr = gameboard.getBoard();

        let middleIsNonEmpty;
        for (let i = 0; i < gameboard.getBoard().length; i++) {
            // check horizontally (across rows)
            middleIsNonEmpty = !boardArr[i][horizontalMidPosition].isEmpty();
            let middleEqualsRight = boardArr[i][horizontalMidPosition].getValue() === boardArr[i][horizontalMidPosition + 1].getValue();
            let middleEqualsLeft = boardArr[i][horizontalMidPosition].getValue() === boardArr[i][horizontalMidPosition - 1].getValue();
            let rowHasMatchingTokens = middleIsNonEmpty && middleEqualsLeft && middleEqualsRight;
            if (rowHasMatchingTokens) {
                return true;
            }

            // check vertically (across cols)
            middleIsNonEmpty = !boardArr[verticalMidPosition][i].isEmpty();
            let middleEqualsUp = boardArr[verticalMidPosition][i].getValue() === boardArr[verticalMidPosition - 1][i].getValue();
            let middleEqualsDown = boardArr[verticalMidPosition][i].getValue() === boardArr[verticalMidPosition + 1][i].getValue();
            let colHasMatchingTokens = middleIsNonEmpty && middleEqualsUp && middleEqualsDown;
            if (colHasMatchingTokens) {
                return true;
            }
        }

        // check diagonally
        // check comparison point is not empty to not match based off emptiness
        let middleCell = boardArr[verticalMidPosition][horizontalMidPosition];
        middleIsNonEmpty = !middleCell.isEmpty();
        let toBottomLeftDiag = middleIsNonEmpty && middleCell.getValue() === boardArr[0][2].getValue() && middleCell.getValue() === boardArr[2][0].getValue();
        let toBottomRightDiag = middleIsNonEmpty && middleCell.getValue() === boardArr[0][0].getValue() && middleCell.getValue() === boardArr[2][2].getValue();

        // return final true or false if the last check fails
        return toBottomLeftDiag || toBottomRightDiag;
    };

    const endGame = (playRound) => {
        displayController.getBoardUI().removeEventListener('click', playRound);
        // display game result
        // after playing all rounds announce game result
        if (gameboard.isBoardFilled()) {
            // draw
            gameResult = 'Draw!';
        } else {
            gameResult = `${getActivePlayer().getName()} won the game!`;
        }
        console.log(gameResult);
        // terminate any other logic to terminate game i.e. terminate playRounds like if any other person was to play next, just need to ensure this play rounds function is terminated and it is since event listener is removed and next form of logic won't be played yet I assume though it should be enforced in code that later shit does not occur
    };

    return { switchTurn, getActivePlayer, printRound, setPlayersFromSessionData, humanPlays, botPlays, checkWin, endGame };
}();

let humanBotGameController = (() => {
    let controller = gameplayController;

    const playRound = (e) => {
        controller.humanPlays(e);
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

        if (isGameTerminableWithResult) {
            controller.endGame(playRound);
            // show final move with active player unchanged and not switched yet
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
            // Unprompted and not triggered by fulfillment of a previous action
            // Do this bot play at the start before playing rounds in usual tempo dictated by clicks from here on and cancelled out by a win
            controller.botPlays();
            controller.switchTurn();
            displayController.updateDisplay();

            displayController.getBoardUI().addEventListener('click', playRound);
        }
    };

    return Object.assign({}, controller, { playAllRounds });
})();

// execute or just initialize functions for use later and return
let humanHumanGameController = (() => {
    let controller = gameplayController;

    const playRound = () => {
        const turnCount = 2;
        for (let i = 0; i < turnCount; i++) {
            controller.humanPlays(e);
            let isGameTerminableWithResult = controller.checkWin() || gameboard.isBoardFilled();
            if (isGameTerminableWithResult) {
                controller.endGame(playRound);
                // show final move
                displayController.updateDisplay();
                return;
            };
            controller.switchTurn();
            // make play then update screen with new player's turn after old player played
            displayController.updateDisplay();
        }
    };

    const playAllRounds = () => {
        displayController.getBoardUI().addEventListener('click', playRound);
    };

    return Object.assign({}, controller, { playAllRounds });
})();

let botBotGameController = (() => {
    let controller = gameplayController;

    // bot move will reflect in DOM on update screen, that's how it goes once it goes into storage for board changes it reflects
    const playRound = () => {
        const turnCount = 2;
        for (let i = 0; i < turnCount; i++) {
            controller.botPlays();
            // TODO: mark winner player to know who's name to display and it is not dependent on the functionality of the active player
            let isGameTerminableWithResult = controller.checkWin() || gameboard.isBoardFilled();
            if (isGameTerminableWithResult) {
                return true;
            }
            controller.switchTurn();
            displayController.updateDisplay();
        }
    };

    const playAllRounds = () => {
        
        do {
        } while (!playRound());

        controller.endGame(playRound);        
        // show final move
        displayController.updateDisplay();
    };

    return Object.assign({}, controller, { playAllRounds });
})();

let sessionExecuter = (() => {
    // the different modules can extract temporary visual data from the DOM services provided by the displayController
    // then get data from game session where its really permanently stored and decoupled from the impermanent and volatile DOM that only displays data and is reliable for nothing else
    const startSession = () => {
        // make sure gameboard is reset from previous round
        gameboard.resetBoard();
        // TODO: create players for session extracted/read from DOM for actual storage in the game session so nothing changes (simply one object via its services feeds to another object that was already used via its services)
        gameSession.createPlayers(); // we don't know its human/bot players before running this but this is the start of a new game and based off this we choose which to run
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
        // we can just play game from start
        // set players in session to be accessible for this gameplay session
        humanBotGameController.setPlayersFromSessionData();
        displayController.updateDisplay();
        humanBotGameController.playAllRounds();
    };

    const playHumanHumanGame = () => {
        // we can just play game from start
        // set players in session to be accessible for this gameplay session
        humanHumanGameController.setPlayersFromSessionData();
        displayController.updateDisplay();
        humanHumanGameController.playAllRounds();
    };

    const playBotBotGame = () => {
        // we can just play game from start
        // set players in session to be accessible for this gameplay session
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

    // if it hasn't yet switched player and its still stuck on current player in the event listener loop this is how you control retries
    let humanPlayerRowInput, humanPlayerColInput;

    let boardDisplay = document.querySelector('.board');
    let replayButton = document.querySelector('.replay');
    let playButton = document.querySelector('.play');

    // for now get info from there as is already done, get data from display controller next time if needed though (you can compose them in different ways as long as you use high level functions in object (module) they belong)
    // store player from DOM for later retrieval
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

        // TODO: For each cell already there in the board display, just update its value don't rerender new objects
        // Have initial board creation and render of permanent UI board that is not to be changed
        board.forEach((row, i) => {
            row.forEach((cell, j) => {
                const cellButton = document.createElement("button");
                cellButton.classList.add("cell");
                // Create a data attribute to identify the column
                // This makes it easier to pass into our `playRound` function 
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

        if (!selectedColumn || !selectedRow) return;

        humanPlayerRowInput = selectedRow;
        humanPlayerColInput = selectedColumn;
    };

    const getCapturedPlayerInput = () => {
        return { col: humanPlayerColInput, row: humanPlayerRowInput }
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

    //on click of button store player info (not available for use yet outside this object until the function is called and its better suited here in this object) or can use the storage of another service since this just controls UI
    playButton.addEventListener('click', () => {
        storePlayerInfo();
        // TODO: Implement this
        hideForm();
        showBoard();
        sessionExecuter.startSession();
    });

    replayButton.addEventListener('click', () => {
        showForm();
        hideBoard();
        // TODO: Optionally show form with previously entered details
        // play button click will start it all again
    });

    const getBoardUI = () => boardDisplay;

    // on click play round and do other stuff, can't be coupled together though has to be a unique service where DOM just reads and sends info to objects
    return { getPlayerInfo, updateDisplay, getBoardUI, getCapturedPlayerInput, showForm, storePlayerInput };
})();