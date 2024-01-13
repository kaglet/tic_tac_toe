const gameboard = function () {
    const cols = rows = 3;
    board = [];

    for (let i = 0; i < rows; i++) {
        board[i] = [];
        for (let j = 0; j < cols; j++) {
            board[i].push("cell");            
        }
    }

    const printBoard = () => {
        board.map(row => row)
    };

    console.dir(board);
}();

function Cell() {
    let value = "";
    
    const isEmpty = () => {
        return value === "";
    }

    const writeValue = (val) => {
        value = val;
    }

    const getValue = () => {
        return value;
    }

    return {isEmpty, writeValue, getValue};
}