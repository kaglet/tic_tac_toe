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

    const getToken = () => token;

    return { winRound, chooseToken, getToken }
}

function Bot() {
    let player = Player();

    let name = "bot";
    let type = "bot";

    // function all bot players can perform is place random move on open spot on board
    const playBotMove = () => {
        // eliminate spaces played on
        // play in flattened/reduced cell array by criteria which is by reference so its ok if one of those cells in the 1D array are filled
        // they correspond to cells in the 3D array

        /* TODO:
           Reduce array to not show objects but to map them in result availableCells to string of values, same with 3D printing array
           I want a better format for printing 
        */
        let availableCells = gameboard.getBoard().flat().filter(cell => cell.isEmpty()); // Also reduce the dimensionality of the array

        let min = 0;
        let max = availableCells.length - 1;
        randomCellPos = Math.floor(Math.random() * (max - min + 1)) + min;

        console.log(`Placing ${name}'s token`);
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
        console.log(valueBoard);
    };

    const playMove = ({ row, col }, player) => {
        // returns and continues rest of programming logic is move is not valid whereas it should allow you to try until you have successfully played your move (so a repeat until an undefined is not returned)
        const isMoveValid = board[row][col].isEmpty();
        if (!isMoveValid) return;
        // To go with the above return true if move played and maybe an optional error message parameter to show in console until a valid message is shown

        board[row][col].writeToken(player.getToken());
    };

    const getBoard = () => board;

    return { printBoard, playMove, getBoard, resetBoard };
}();

// Bundles up functionality that initializes and controls the flow of the overall gameplay session
const gameplayController = function () {
    gameSession.createPlayers();
    let { player1, player2 } = gameSession.getSelectedPlayers();

    let activePlayer = player1;

    const switchTurn = () => {
        activePlayer = (activePlayer === player1) ? player2 : player1;
    };

    // print round and that relevant info explicitly not via GUI which first extracts info like board, and active player, and does it all in the GUI to "print" instead of here
    const printRound = () => {
        gameboard.printBoard();
    };

    const getActivePlayer = () => activePlayer;

    return { switchTurn, getActivePlayer, printRound };
};

let humanBotGameController = () => {
    let controller = gameplayController();

    // extra advantage is I can now easily reorder who plays first
    // who goes first (order controller), only for this checks if current player is human or bot and continues from there (decides order from start)
    const humanPlays = () => {
        console.log(`It is the following player\'s turn: ${activePlayer.getName()}`);
        let row = +prompt("Enter row number to place token (numbering starts from 1).", '1') - 1;
        let col = +prompt("Enter col number to place token (numbering starts from 1).", '1') - 1;

        console.log(`Placing ${controller.getActivePlayer().getName()}'s token`);
        gameboard.playMove({ row, col }, controller.getActivePlayer());
        controller.printRound();
    };

    const botPlays = () => {
        console.log(`It is the following player\'s turn: ${activePlayer.getName()}`);
        controller.getActivePlayer().playBotMove();
        controller.printRound();
    }
    // playing a single round will look different across controllers 
    // A round is defined as two turns taken between P1 and P2
    const playRound = () => {
        if (controller.getActivePlayer()) {
            
        }
        humanPlays();
        // TODO: check for win before switching turn!
        controller.switchTurn();

        botPlays();

        // TODO: Depending on bot is player 1 or 2 it depends if it is playing first or not, if you start flow and switch turns it will auto-take care of it

        // Bot move will play but not by selecting a row and col but rather writing into an empty cell then calling print
        // This is why its important that the print new round method be separate in this case not coupled with the play move

        // If the object is for a bot then this method will be available, it should not be an assumption but enforced and ensured in code
        
        // switch turn before calling print round
        controller.switchTurn();

        // TODO: I would like to print round without announcing someone else's turn for the new round which matters for win condition too
        
        // could decide score and winner if you needed that
    };

    // TODO: Can call takeAllTurnsPlaying from the individual takeTurn function
    const playAllRounds = () => {
        // rounds can be more than 3 and its until win so we can implement a win checker on the game controller itself, think its the best place
        const roundNumber = 1;
        // TODO: Test with more number of rounds since it works on one but with a trailing printing of the round whereas I need to check win condition and end early before handing it over to next player and telling them its them to play for next round
        // no need to switch turn only to print next round, turn switch must happen after new round is shown and win condition is not met yet
        for (let i = 0; i < roundNumber; i++) {

        }
    };

    return Object.assign({}, controller, { playRound, playAllRounds });
};

let humanHumanGameController = () => {
    let controller = gameplayController();

    return Object.assign({}, controller);
};

let botBotGameController = () => {
    let controller = gameplayController();

    return Object.assign({}, controller);
};

// Execute human-bot gameplay which is the hardest gameplay case imo, the other cases use subsets of this functionality in repetition. 
// This is the hardest case of human and bot. For others just use an if statement for whoever the next player type is, its either or.
// Then choose which function to execute based on the active player type: "player" or "bot". Call this function on the game session itself.
// The game session is responsible for capturing this information and executing the game after (after the event listeners on the screen controller are pressed I guess). 
humanBotGameController().playAllRounds();