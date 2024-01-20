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

    // When you create players get the info from the DOM service not as a parameters, that is what making it restrictive means, it doesn't mean exchange of info between services is not possible
    // then it needs something from the outside and its not closed to itself for other services that access it too
    // parameters to provide data are unnecessary when you have services from other objects to provide data
    const createPlayers = () => {
        let player1Type = displayController.getPlayerInfo().player1Info().type;

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

        let player2Type = displayController.getPlayerInfo().player2Info().type;

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
        
        player1.setName(displayController.getPlayerInfo().player1Info().name);
        player2.setName(displayController.getPlayerInfo().player2Info().name);

        player1.chooseToken(displayController.getPlayerInfo().player1Info().symbol);
        player2.chooseToken(displayController.getPlayerInfo().player2Info().symbol);
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
    // the different modules can extract data from the DOM services provided by the displayController
    // then get data from game session where its really permanently stored and decoupled from the impermanent and volatile DOM that only displays data and is reliable for nothing else
    const startSession = () => {
        // TODO: create players for session extracted/read from DOM for actual storage in the game session so nothing changes
        gameSession.createPlayers(); // we don't know its human/bot players before running this but this is the start of a new game and based off this we choose which to run
        let { player1, player2 } = gameSession.getSelectedPlayers();
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

let displayController = (() => {
    let player1Type;
    let player1Name;
    let player1Symbol;

    let player2Type;
    let player2Name;
    let player2Symbol;

    let boardDisplay = document.querySelector('.board');

    // for now get info from there as is already done, get data from display controller next time if needed though (you can compose them in different ways as long as you use high level functions in object (module) they belong)
    const storePlayerInfo = () => {
        // don't set player data immediately here and couple with the code for the game session, just return it to there and continue as normal to make code maintainable
        // game session controls data storage here the UI is simply providing a service, its own
        player1Type = document.querySelector('.player.1.type').value;
        player1Name = document.querySelector('.player.1.name').value;
        player1Symbol = document.querySelector('.player.1.symbol').value;

        player2Type = document.querySelector('.player.2.type').value;
        player2Name = document.querySelector('.player.2.name').value;
        player2Symbol = document.querySelector('.player.2.symbol').value;
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

        // TODO: For each cell already there in the board display, just update its value don't rerender new objects
        // Render board squares
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

    const handleBoardClicks = (e) => {
        const selectedColumn = e.target.dataset.column;
        const selectedRow = e.target.dataset.row;

        if (!selectedColumn || !selectedRow) return;
    };

    // do above functions in order

    // execute an entire session with DOM control inside i.e. providing its services
    // controls flow automatically but I think it needs to be slightly different or in start session it controls disappearing of that form once trigger clicked and continues with the rest of the stuff
    // within sessionExecuter use DOM however you need to now to provide input, it's ok as long as you use an object's services however, coherently as you'd like
    // my worry was objects feeding back into each other to use each others services, they are still isolating but its not one way
    // it is restrictive for the display controller but its services are still used inevitably later
    do { // do this entire process hopefully with event listeners, as this DOM has nothing to do with the logic but running it from DOM if there is a trigger (like a click) or starting the process running without a trigger from the start unlike in the connectfour article
        sessionExecuter.startSession();
    } while (prompt('Would you like to play again? Type Y for yes', 'Y') === 'Y');

    // don't add this here I think but within session code
    boardDisplay.addEventListener('click', handleBoardClicks);

    //on click of button store player info (not available for use yet outside this object until the function is called and its better suited here in this object)
    // it's out of sync the event listeners but its ok, once this, only then can the other thing happen and that is how order is enforced so the next desired thing happens, only after this happens on this click
    let playButton = document.querySelector('.play');
    playButton.addEventListener('click', () => {
        storePlayerInfo();
        // TODO: Implement this
        hideForm();
    });

    // on click play round and do other stuff, can't be coupled together though has to be a unique service where DOM just reads and sends info to objects
    return {getPlayerInfo, updateDisplay, handleBoardClicks};
})();

// it's fine to be used in other objects controlling other things in this case because the data has to be obtained and passed from the controller to elsewhere permanent storage then used by other objects



// Execute multiple sessions
// Session executer might need to control DOM within sessions otherwise idk another way to do it as I do not see the need to decouple this
// Keep playing until user types no

// TODO: When starting a session we extract data so we still have some objects interact with DOM as per usual at the start

// Instead of an artificial play round last thing I need now is a human triggered play round based on the listeners. So it won't play round immediately, but the method will be tagged to always be available to move it forward until the end, no longer a predetermined momentum in any place
// I don't know because they didn't have a play all rounds, but why did I have it, to advance turns until a win condition in the gameboard data representation is detected
// Answer is he DOESN'T actually play it, not once, and not multiple rounds so I don't know how he would've encapsulated that. SO maybe encapsulate play round trigger, maybe he left it untriggered except for testing.
// But maybe just do as he did and wait to use play round on event listener and carry on from there. I do not want to throw away the enclosing play rounds or session executer though. I don't think you have to.
// in controlling the flow of the game I still have to play rounds and play the bot move after that (the player's move, so there is still a pattern of play and turn taking per players even with event listeners in how they are activated and deactivated, they controller can switch turns after every click in DOM making it automatically the next person's turn after the previous turn or input placing) and let it reflect in the DOM by using the DOM service
// There must be an equivalent for input placing then switch turn in our game except it is just input from console not from DOM, we should be able to tag the listener in somehow