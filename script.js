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
        console.log(board.map(row => row.map(cell => cell.getValue())));
    };

    
}();

function Cell() {
    let value = "";
    
    const isEmpty = () => {
        return value === "";
    }

    const writeMark = (mark) => {
        value = mark;
    }

    const getValue = () => {
        return value;
    }

    return {isEmpty, writeMark, getValue};
}