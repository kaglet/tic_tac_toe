// Multiple instance objects

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
    // TODO: Do something with the name, like use it in printings
    let name;

    const winRound = () => {
        score++;
    };

    const chooseToken = (chosenToken) => {
        token = chosenToken;
    };

    return { winRound, chooseToken }
}

function Bot() {
    let { winRound, chooseToken } = Player();

    let name = "bot";

    return { winRound, chooseToken };
}

function Human() {
    let { winRound, chooseToken } = Player();

    let name = "human";

    const getName = () => name;

    const setName = (newName) => {name = newName}; 

    return { winRound, chooseToken, getName, setName};
}

// Single instance objects

const gameSession = function() {
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

        let player2Type = prompt("Choose player 2 type. Enter 'H' for human or 'B' for bot.", 'H');

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
    };

    const getSelectedPlayers = () => {player1, player2};

    return {getSelectedPlayers, createPlayers};
}();

// One instance of the gameboard that we can clear later
// This single instance is global (no multiple instances) as opposed to the factory function being global
// If there can be one instance whose state we reset after instantiation then ok, it may better for memory if used as intended as one object for the entire state of the application 
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
                board[i][j].value = " ";
            });
        });
    };

    const printBoard = () => {
        // Read right to left as you work with immediately returned/evaluated results of execution
        // Take each cell and map to a single value and form a row array and return that
        // Then for each row map it to this new row array to form a new board array
        const valueBoard = board.map(row => row.map(cell => cell.getValue()));
        console.log(valueBoard);
    };

    const playMove = ({ row, col }, player) => {
        const isMoveValid = board[row][col].getValue === "";
        if (!isMoveValid) return;

        board[row][col] = player.token;
    };

    const getBoard = () => board;

    return { printBoard, playMove, getBoard, resetBoard };
}();

const gameplayController = function () {
    let {player1, player2} = gameSession.getSelectedPlayers();

    let activePlayer = player1;

    const switchTurn = () => {
        activePlayer = (activePlayer === player1) ? player2 : player1;
    };

    const printRound = () => {
        gameboard.printBoard();
        console.log(`It is the following player\'s turn: ${activePlayer.getName()} `);
    };

    const getActivePlayer = () => activePlayer;

    printRound();

    return { switchTurn, getActivePlayer, printRound };
}();

// There are different gameplay flows so encapsulate the functionality for handling that in these functions that can be invoked when needed
// Gameplay flow and order may differ and once executed used (inherited too) functions can be used in different ones

let humanBotGameController = () => {
    let controller = gameplayController();

    function playRound({ row, col }) {
        // announce their move
        console.log(`Placing ${controller.getActivePlayer()}'s token into row ${row} and column ${col}`);
        // play their move
        gameboard.playMove({row, col}, controller.getActivePlayer());

        // show visually the new game state for the active player after calling play round for a player's move.
        controller.switchTurn();
        controller.printRound();

        // you'll call the function and play for the computer out of the available spaces instead of getting it from user input
        // TODO: Make needed computer/bot function to only play in available spaces.
    }

    return Object.assign({}, controller, {playRound});
}

let humanHumanGameController = () => {
    let controller = gameplayController();

    return Object.assign({}, controller);
}

let botBotGameController = () => {
    let controller = gameplayController();

    return Object.assign({}, controller);
}