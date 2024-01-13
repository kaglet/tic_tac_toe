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

    const playMove = ({row, col}, player) => {
        const isMoveValid = board[row][col].getValue === "";
        if (!isMoveValid) return;

        board[row][col] = player
    };

    const getBoard = () => {
        return board;
    };

    return {printBoard, playMove, getBoard};
}();

const gameController = function () {

}();

function Cell() {
    let value = "";
    
    const isEmpty = () => {
        return value === "";
    }

    const writeToken = (token) => {
        value = token;
    }

    const getValue = () => {
        return value;
    }

    return {isEmpty, writeToken, getValue};
}

function Player() {
    let score = 0;
    let token;
    let playerNumber;

    const winRound = () => {
        score++;
    };

    const chooseToken = (chosenToken) => {
        token = chosenToken;
    };

    return {winRound, chooseToken}
}

function Bot() {
    let {winRound, chooseToken} = Player();
    
    return {winRound, chooseToken};
}

function Human() {
    let {winRound, chooseToken} = Player();

    return {winRound, chooseToken};
}