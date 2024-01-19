// Multiple instance objects

function Cell() {
    let value = "";
    // outside this don't have to care what defines empty/emptiness, it knows inside its own implementation and so it is changed in only one place
    // his function is therefore useful
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
    let type = "bot";

    // function all bot players can perform is place random move on open spot on board
    const playBotMove = () => {
        // reduce dimensionality of array and eliminate cells played on to produce a list of cell objects that have not been played on
        // objects are assigned by reference so same objects in the 2D array are the same as the ones in this 1D array
        let availableCells = gameboard.getBoard().flat().filter(cell => cell.isEmpty());

        let min = 0;
        let max = availableCells.length - 1;
        randomCellPos = Math.floor(Math.random() * (max - min + 1)) + min;

        // if no available cells for bot to play on then board is filled and will be caught out
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
        // Read right to left as you work with immediately returned/evaluated results of execution
        // Take each cell and map to a single value and form a row array and return that
        // Then for each row map it to this new row array to form a new board array
        const valueBoard = board.map(row => row.map(cell => cell.getValue()));
        for (let i = 0; i < valueBoard.length; i++) {
            console.log(`[${valueBoard[i].toString()}]`);
        }
    };

    const playMove = ({ row, col }, player) => {
        // Returns and continues rest of programming logic is move is not valid whereas it should allow you to try until you have successfully played your move (so a repeat until an undefined is not returned)
        const isMoveValid = board[row][col].isEmpty();
        if (!isMoveValid) return;
        // To go with the above return true if move played and maybe an optional error message parameter to show in console until a valid message is shown

        board[row][col].writeToken(player.getToken());
    };

    const getBoard = () => board;

    // The result of row.every is a boolean true or false after its done throughout every cell consolidates the results of the tests.
    // Same happens when it moves on to board.every to take into the account the returned result of every row.
    // Note: Be mindful of the documented implementation, with the parameters and the return of the iteration functions.
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

    return { switchTurn, getActivePlayer, printRound, createPlayers: () => gameSession.createPlayers(), setPlayersFromSessionData };
}();

let humanBotGameController = (() => {
    // currently a new gameplay controller is created for each new game and I feel like there could be a better way by simply invoking the methods of the current controller after inheriting them but not auto running some others
    // for example simply creating the players we can inherit that default function and use it when
    // for inheritance we always need to create a new object in order to inherit though to assign as a property of the controller
    // TODO: Ask if there is a better way to do this
    // Maybe be reassigning controller we throw away the old reference so there is no wasted memory since that is only me speculation
    // for object inheritance this might the only way
    // Of course then these children should be single instance still setting and refreshing properties with getters and setters right?
    // instead of creating a brand new one each time
    // an object cannot inherit from a module so idk
    // its returns are available for inheritance though as they are objects so idk what you mean, by exposing themselves as objects and with closure they are like regular objects
    // just like a factor functions except you can create an object instance multiple times
    // you can get the object instance but it will still be a new object for the inherited object created via 
    // possibly set multiple times.
    // i need to set the returned assigned object with each new reset idk if I can do that
    // try think how you can set these controllers once because they should be single instance not a new controller per game, just readjust some of your logic and assumptions
    let controller = gameplayController;
    let gameResult = '';

    // extra advantage is I can now easily reorder who plays first
    // who goes first (order controller), only for this checks if current player is human or bot and continues from there (decides order from start)
    const humanPlays = () => {
        console.log(`It is the following player\'s turn: ${controller.getActivePlayer().getName()}`);
        let row = +prompt("Enter row number to place token (numbering starts from 1).", '1') - 1;
        let col = +prompt("Enter col number to place token (numbering starts from 1).", '1') - 1;

        console.log(`Placing ${controller.getActivePlayer().getName()}'s token`);
        gameboard.playMove({ row, col }, controller.getActivePlayer());
        controller.printRound();
    };

    // Bot move will play but not by selecting a row and col but rather writing into an empty cell then calling print
    // If the object is for a bot then this method will be available, it should not be an assumption but enforced and ensured in code
    const botPlays = () => {
        console.log(`It is the following player\'s turn: ${controller.getActivePlayer().getName()}`);
        console.log(`Placing ${controller.getActivePlayer().getName()}'s token`);
        controller.getActivePlayer().playBotMove();
        controller.printRound();
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
    // Playing a single round will look different across controllers therefore it is not a shared method.
    // A round is defined as two turns taken between P1 and P2.
    // Across rounds this function always works to switch turns properly too.
    const playRound = () => {
        if (controller.getActivePlayer().getType() === "human") {
            humanPlays();
            if (checkWin()) return true;
            controller.switchTurn();

            // bot will play with methods assured to be accessible
            botPlays();
            if (checkWin()) return true;
            controller.switchTurn();
        } else {
            // TODO: Test playthrough with bot going first
            // bot will play with methods assured to be accessible
            botPlays();
            if (checkWin()) return true;
            controller.switchTurn();

            humanPlays();
            if (checkWin()) return true;
            controller.switchTurn();
        }
    };

    const playAllRounds = () => {
        // TODO: Try to play all rounds and try a match
        // in console game will be suspended while playing out this repeated logic until exiting conditions are met
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

    return Object.assign({}, controller);
})();

let botBotGameController = (() => {
    let controller = gameplayController;

    return Object.assign({}, controller);
})();

let sessionExecuter = (() => {
    // for each session execute these commands
    const playHumanBotGame = () => {
        // create players for session
        humanBotGameController.createPlayers();
        // set players to be accessible in gameplay session
        humanBotGameController.setPlayersFromSessionData();
        humanBotGameController.playAllRounds();

        // TODO: Reset board through interface provided by this top level controller
    }

    return { playHumanBotGame };
})();

sessionExecuter.playHumanBotGame();
// Execute human-bot gameplay which is the hardest gameplay case imo, the other cases use subsets of this functionality in repetition. 
// This is the hardest case of human and bot. For others just use an if statement for whoever the next player type is, its either or.
// Then choose which function to execute based on the active player type: "player" or "bot". Call this function on the game session itself.
// The game session is responsible for capturing this information and executing the game after (after the event listeners on the screen controller are pressed I guess). 

