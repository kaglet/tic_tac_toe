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
    
    const playBotMove = () => {
        // eliminate spaces played on
        // play in flattened/reduced cell array by criteria which is by reference so its ok if one of those cells in the 1D array are filled
        // they correspond to cells in the 3D array

        let availableCells = gameboard.getBoard().forEach(row => row.filter(cell => cell.getValue() !== '')); // Also reduce the dimensionality of the array
        console.log(availableCells.some(row => row.length > 0));
    };

    const getName = () => name;

    const setName = (newName) => {name = newName}; 

    return { winRound, chooseToken, playBotMove, getName, setName };
}

function Human() {
    let { winRound, chooseToken } = Player();

    let name = "human";

    const getName = () => name;

    const setName = (newName) => {name = newName}; 

    return { winRound, chooseToken, getName, setName};
}

// Single instance objects

// Bundles up (stores) and sets game session data
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

    const getSelectedPlayers = () => {
        return {player1, player2};
    };

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

// Bundles up and controls the overall gameplay flow (state) and all functions have to do with that state
const gameplayController = function () {
    gameSession.createPlayers();
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

    // all controllers must execute this code anyway
    printRound();

    return { switchTurn, getActivePlayer, printRound };
};

// There are different gameplay flows so encapsulate the functionality for handling that in these functions that can be invoked when needed
// Gameplay flow and order may differ and once executed used (inherited too) functions can be used in different ones

let humanBotGameController = (() => {
    let controller = gameplayController();

    // expect the same properties in the object for the sake of destructuring otherwise it won't know what to destructure
    const playRound = ({row, col}) => {
        // announce their move
        console.log(`Placing ${controller.getActivePlayer()}'s token into row ${row} and column ${col}`);
        // play their move
        gameboard.playMove({ row, col }, controller.getActivePlayer());

        // show visually the new game state for the active player after calling play round for a player's move.
        controller.switchTurn();
        controller.printRound();

        // you'll call the function and play for the computer out of the available spaces instead of getting it from user input
        // TODO: Make needed computer/bot function to only play in available spaces.
    };

    // fire all round sets manually (3)
    const playAllRounds = () => {
        // rounds can be more than 3 and its until win so we can implement a win checker on the game controller itself, think its the best place
        const roundNumber = 1;
        for (let i = 0; i < roundNumber; i++) {
            let selectedRowNumber = +prompt("Enter row number to place token (numbering starts from 1).", '1') - 1;
            let selectedColNumber = +prompt("Enter col number to place token (numbering starts from 1).", '1') - 1;
            playRound({row: selectedRowNumber, col: selectedColNumber});
            // common function on controller available for all shared controller instances a shared inherited function for this instance
            controller.switchTurn();
            // computer auto plays

            // function all bot players can perform is place random move on open spot on board
            // if I match 3
            // Depending on bot is player 1 or 2 it depends if it is playing first or not, if you start flow and switch turns it will auto-take care of it
            
            playRound(controller.getActivePlayer().playBotMove()); // if its a bot then this method will be available, it should not be an assumption but enforced and ensured in code

            // could decide score and winner if you needed that
        }
    };

    return Object.assign({}, controller, {playRound, playAllRounds});
});

let humanHumanGameController = (() => {
    let controller = gameplayController();

    return Object.assign({}, controller);
});

let botBotGameController = (() => {
    let controller = gameplayController();

    return Object.assign({}, controller);
});

// this is the hardest case of human and bot or just use an if statement for whoever the next player type is, its either or
// then choose which function to execute based on the active player type: "player" or "bot"
humanBotGameController().playAllRounds();

// TODO: Check that it is a bot player type instance with the method present