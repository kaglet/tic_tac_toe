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
    let type = "B";

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
    let type = "H";

    const getName = () => name;

    const getType = () => type;

    const setName = (newName) => { name = newName };

    return Object.assign({}, player, { getName, setName, getType });
}

// Single instance objects

// Bundles up (stores) and sets game session data
const gameSession = function () {
    let player1, player2;

    // TODO: Input player choice parameters to define players for the session here
    const createPlayers = () => {
        let player1Type = prompt("Choose player 1 type. Enter 'H' for human or 'B' for bot.", 'H');

        switch (player1Type) {
            case 'H':
                player1 = Human();
                break;
            case 'B':
                player1 = Bot();
                break;
            default:
                break;
        }

        let player2Type = prompt("Choose player 2 type. Enter 'H' for human or 'B' for bot.", 'B');

        switch (player2Type) {
            case 'H':
                player2 = Human();
                break;
            case 'B':
                player2 = Bot();
                break;
            default:
                break;
        }

        if (player1Type === 'H' && player2Type === 'H') {
            player1.setName('Player 1');
            player2.setName('Player 2');
        } else if (player1Type === 'H' && player2Type === 'B') {
            player1.setName('You');
            player2.setName('Bot');
        } else if (player1Type === 'B' && player2Type === 'H') {
            player1.setName('Bot');
            player2.setName('You');
        } else if (player1Type === 'B' && player2Type === 'B') {
            player1.setName('Bot 1');
            player2.setName('Bot 2');
        }

        player1.chooseToken('X');
        player2.chooseToken('O');
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

    const humanPlays = () => {
        let row, col;
        console.log(`It is the following player\'s turn: ${getActivePlayer().getName()}`);
        // Repeat play while move is not yet valid
        do {
            // get new input until input results in valid move
            row = +prompt("Enter row number to place token (numbering starts from 1).", '1') - 1;
            col = +prompt("Enter col number to place token (numbering starts from 1).", '1') - 1;
        } while (gameboard.playMove({ row, col }, getActivePlayer()) === false);

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

    return { switchTurn, getActivePlayer, printRound, setPlayersFromSessionData, humanPlays, botPlays, checkWin };
}();

let humanBotGameController = (() => {

    let controller = gameplayController;
    let gameResult = '';

    // Playing a single round will look different across controllers therefore it is not a shared method.
    // A round is defined as two turns taken between P1 and P2.
    // Across rounds this function always works to switch turns properly too.
    const playRound = () => {
        if (controller.getActivePlayer().getType() === "H") {
            controller.humanPlays();
            if (controller.checkWin()) return true;
            controller.switchTurn();

            // bot will play with methods assured to be accessible
            controller.botPlays();
            if (controller.checkWin()) return true;
            controller.switchTurn();
        } else {
            // TODO: Test playthrough with bot going first
            // bot will play with methods assured to be accessible
            controller.botPlays();
            if (controller.checkWin()) return true;
            controller.switchTurn();

            controller.humanPlays();
            if (controller.checkWin()) return true;
            controller.switchTurn();
        }
    };

    const playAllRounds = () => {
        do {
            if (gameboard.isBoardFilled()) break;
        } while (!playRound());

        // after playing all rounds announce game result
        if (gameboard.isBoardFilled()) {
            // draw
            gameResult = 'Draw!';
        } else {
            gameResult = `${controller.getActivePlayer().getName()} won the game!`;
        }
        console.log(gameResult);
    };

    return Object.assign({}, controller, { playAllRounds });
})();

// execute and return
let humanHumanGameController = (() => {
    let controller = gameplayController;

    const playRound = () => {
        let turnCount = 2;
        for (let i = 0; i < turnCount; i++) {
            controller.humanPlays();
            if (controller.checkWin()) return true;
            controller.switchTurn();
        }
    };

    const playAllRounds = () => {
        do {
            if (gameboard.isBoardFilled()) break;
        } while (!playRound());

        // after playing all rounds announce game result
        if (gameboard.isBoardFilled()) {
            // draw
            gameResult = 'Draw!';
        } else {
            gameResult = `${controller.getActivePlayer().getName()} won the game!`;
        }
        console.log(gameResult);
    };

    return Object.assign({}, controller, { playAllRounds });
})();

let botBotGameController = (() => {
    let controller = gameplayController;

    const playRound = () => {
        let turnCount = 2;
        for (let i = 0; i < turnCount; i++) {
            controller.botPlays();
            if (controller.checkWin()) return true;
            controller.switchTurn();
        }
    };

    // this function is composed of the function within this scope so it has to be here not in the above object inherited from
    const playAllRounds = () => {
        do {
            if (gameboard.isBoardFilled()) break;
        } while (!playRound());

        // after playing all rounds announce game result
        if (gameboard.isBoardFilled()) {
            // draw
            gameResult = 'Draw!';
        } else {
            gameResult = `${controller.getActivePlayer().getName()} won the game!`;
        }
        console.log(gameResult);
    };

    return Object.assign({}, controller, { playAllRounds });
})();

let sessionExecuter = (() => {
    const startSession = () => {
        // create players for session
        gameSession.createPlayers(); // we don't know its human/bot players before running this but this is the start of a new game and based off this we choose which to run
        let {player1, player2} = gameSession.getSelectedPlayers();
        if (player1.getType() === 'H' && player2.getType() === 'H') {
            playHumanHumanGame();
        } else if (player1.getType() === 'B' && player2.getType() === 'B') {
            playBotBotGame();
        } else if ((player1.getType() === 'H' && player2.getType() === 'B') || (player1.getType() === 'B' && player2.getType() === 'H')) {
            playHumanBotGame();
        }
    };

    const playHumanBotGame = () => {
        // we can just play game from start
        // set players to be accessible in gameplay session
        humanBotGameController.setPlayersFromSessionData();
        // this function is a property of it by inheritance in Object.assign()
        humanBotGameController.playAllRounds();
        gameboard.resetBoard();
    }

    const playHumanHumanGame = () => {
        // we can just play game from start
        // set players to be accessible in gameplay session
        humanHumanGameController.setPlayersFromSessionData();
        humanHumanGameController.playAllRounds();
        gameboard.resetBoard();
    }

    const playBotBotGame = () => {
        // we can just play game from start
        // set players to be accessible in gameplay session
        botBotGameController.setPlayersFromSessionData();
        botBotGameController.playAllRounds();
        gameboard.resetBoard();
    }

    return { startSession };
})();

// Execute multiple sessions
// Session executer might need to control DOM within sessions otherwise idk another way to do it as I do not see the need to decouple this
// Keep playing until user types no
do {
    sessionExecuter.startSession();
} while (prompt('Would you like to play again? Type Y for yes', 'Y') === 'Y');
