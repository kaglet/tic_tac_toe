const gameboard = function () {
    const cols = rows = 3;
    board = [];

    for (let i = 0; i < rows; i++) {
        board[i] = [];
        for (let j = 0; j < cols; j++) {
            board[i].push(Cell());
        }
    }

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

        board[row][col] = player
    };

    const getBoard = () => board;;

    return { printBoard, playMove, getBoard };
}();

const menu = function() {
    const getSelectedPlayers = () => {
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
        return {player1, player2};
    };

    return {getSelectedPlayers};
}();

const gameController = function ({player1, player2}) {
    let player1;
    let player2;
    let activePlayer = player1;

    function switchTurn() {
        activePlayer = (activePlayer === player1) ? player2 : player1;
    }

    return {switchTurn};
};

// There are different gameplay flows so encapsulate the functionality for handling that in these functions that can be invoked when needed
function HumanBotGameController() {
    let controller = gameController();

    return Object.assign({}, controller);
}

function HumanHumanGameController() {
    let controller = gameController();

    return Object.assign({}, controller);
}

function BotBotGameController() {
    let controller = gameController();

    return Object.assign({}, controller);
}


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

    return { winRound, chooseToken };
}

function Human() {
    let { winRound, chooseToken } = Player();

    return { winRound, chooseToken };
}