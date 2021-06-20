// Usage nano-number.ts wallet_id nano_account  

import { fail } from "assert/strict";
import { exec } from "child_process";
import { mainModule } from "process";
import * as fs from 'fs';


const axios = require('axios').default;
const wallet = process.argv[2]
const my_account = process.argv[3]
const url = "http://ip6-localhost:7072"
var height = -1
var roll_over = BigInt(0)
const data_dir = "./data/"

const current_game_time = data_dir + "current-game-time"
const current_players_file = data_dir + "current-players"
const current_pot_file = data_dir + "current-pot"

const last_players_file = data_dir + "last-players"
const last_pot_file = data_dir + "last-pot"
const last_winners_file = data_dir + "last-winners"
const last_winning_number_file = data_dir + "last-winning-number"



// Utilities
function httpPost(address: string, body: any, successCallback: any, failureCallback: any) {
    const instance = axios.create({
        baseURL: address,
        timeout: 100000,
    });

    instance.post(address, body)
      .then(function (response) {
        if ('error' in response.data) {
            failureCallback(response)
            return
        }
        successCallback(response)
      })
      .catch(function (error) {
        failureCallback(error)
      });
}

function getAccountBalance(account: string, successCallback: any, failureCallback: any) {
    var body = {
        "action": "account_balance",
        "account": account
    }
    httpPost(url, body, successCallback, failureCallback)
}

function logError(message: any) {
    console.log("ERROR: " + JSON.stringify(message))
}

function log(message: string) {
    console.log("INFO: " + message)
}

function guessNumber(numbers) {
    return Math.floor(Math.random() * numbers) + 1;
}

function guessAlgo() {
    var numberRange = 9
    var numbers = []
    var numbersLength = guessNumber(3)
    log("Set Size: " + numbersLength.toString())

    for (var i = 0; i < numbersLength; i++) {
        numbers.push(guessNumber(numberRange))
    }

    for(var i = numberRange; i > 0; i--) {
        if (listContains(numbers, i)) {
            return i
        }
    }
    // Should never happen
    return 0
}

function listContains(list, contains) {
    for(let i of list){
        if (i === contains) {
            return true
        }
    }

    return false
}

function setStartingHeight() {
    // Height is hardcoded so us that as starting height
    if (height != -1) {
        return
    }

    getMyAccountBlockCount(response => {
        height = Number(response.data.block_count)
        log("Starting height is: " + height.toString())
    },
    error => {
        logError("Failed to set the starting height. " + error)
    })
    
}

function writeFile(path: string, contents: string) {
    fs.writeFileSync(path, contents)
}

function writeLastWinners(winners: string[]) {
    writeFile(last_winners_file, JSON.stringify(winners))
}

function writeLastWinningNumber(number: number) {
    writeFile(last_winning_number_file, number.toString())
}

function writeLastPlayers(players: any) {
    writeFile(last_players_file, JSON.stringify(players))
}

function writeCurrentPlayers(players: any) {
    writeFile(current_players_file, JSON.stringify(players))
}

function writeCurrentGameTime(time: number) {
    writeFile(current_game_time, time.toString())
}

function writeCurrentPot(balance: number) {
    writeFile(current_pot_file, balance.toString())
}

function writeLastPot(balance: number) {
    writeFile(last_pot_file, balance.toString())
}

// Nano number!
function execute() {
    log("STARTING")
    getMyAccountBlockCount(distributeWinnings, logError)
    log("ENDING")
}

function getMyAccountBlockCount(successCallback: any, failureCallback: any) {
    var body = {  
        "action": "account_block_count",
        "account": my_account
    }

    httpPost(url, body, successCallback, failureCallback)
}

function getMyAccountHistory(count: number, successCallback: any, failureCallback: any) {
    var body = {  
        "action": "account_history",
        "account": my_account,
        "count": count.toString()
    }

    httpPost(url, body, successCallback, failureCallback)
}

function distributeWinnings(response: any) {
    var current_height = Number(response.data.block_count)
    if (current_height < height) {
        logError("Current height is less the game height. This should not happen")
        return
    }

    if (current_height == height) {
        logError("Current height is the same as the game height, no one played or transactions are pending")
        return
    }

    var difference = current_height - height
    if (difference == 1) {
        logError("Game will not play because only 1 party is participating")
        return
    }

    var body = {  
        "action": "account_history",
        "account": my_account,
        "count": difference.toString()
    }

    var winningNumber = guessAlgo()
    var winningRaw = BigInt(winningNumber.toString() + "00000000000000000000000000000")
    var winners = []
    var players = []
    var receivedAmount = BigInt(0)

    log("Winning Amount: " + winningRaw.toString())
    writeLastWinningNumber(winningNumber)
    writeLastWinners([])
    writeCurrentGameTime(Date.now())

    httpPost(url, body, function(response) {
        var blocks = response.data.history
        blocks.forEach(block => {
            if ( block['type'] === 'receive') {
                var amount = BigInt(block['amount'])
                var account = block['account']
                receivedAmount += amount
                
                if (listContains(players, account)) {
                    log("Duplicate account found " + account)
                    return
                }
                players.push(account)

                log("Account: " + account)
                log("Amount: " + amount.toString())
                if (amount == winningRaw) {
                    log("winner found " + account)
                    winners.push(account)
                }
            }
        });

        log("Received amount: " + receivedAmount.toString())
        log("Number of Winners: " + winners.length.toString())
        writeLastPlayers(players)
        writeLastPot(Number(receivedAmount))

        if (winners.length === 0) {
            roll_over += receivedAmount
            log("NO WINNERS")
            getMyAccountBlockCount(response => {
                height = Number(response.data.block_count)
                log("New height = " + height)
            },
            error => {
                logError("Failure to get my account block count. " + error)
            })
            return
        }

        if (roll_over > 0) {
            receivedAmount += roll_over
        }

        writeLastWinners(winners)
        

        // At this point we should have a list of `winners` and the amount that has been recieved
        // Now we just need to figure out how to distribute
        var payment = receivedAmount / BigInt(winners.length)
        log("Payment being distributed: " + payment.toString())
        
        sendPayments(winners, payment)
    },
    function(error) {
        logError("Error occured while calculating/distributing payments:")
        logError(error);
    })
}

function sendPayments(accounts: string[], payment: BigInt) {
    accounts.forEach(account => {
        sendPayment(account, payment)
    });
}

function sendPayment(account: string, payment: BigInt) {
    var body = {
        "action": "send",
        "wallet": wallet,
        "source": my_account,
        "destination": account,
        "amount": payment.toString()
    }

    httpPost(url, body, response => {
        log("Successfully sent " + payment.toString() + " raw to " + account)
        log(JSON.stringify(response.data))

        getMyAccountBlockCount(response  => {
            var current_height = Number(response.data.block_count)
            height = current_height
            log("New game height is: " + height.toString())
        }, logError)

    },
    error => {
        logError("Failed to send payment to " + account)
        console.log(error)
    })
}

function stats() {
    log("Getting stats of current game")
    // Get my account balance and write to the current pot file
    getAccountBalance(my_account, response => {
        writeCurrentPot(Number(BigInt(response.data.balance) / BigInt('100000000000000000000000000000')))
    },
    error => {
        logError("Failed to get account balance for " + my_account + ". " + error)
    })

    // Get all current players of the game
    var currentPlayers = []
    getMyAccountBlockCount(response => {
        var currentHeight = Number(response.data.block_count)
        var difference = currentHeight - height
        // Make sure atleast one player is playing
        if (difference < 1) {
            writeCurrentPlayers(currentPlayers)
            return
        }

        getMyAccountHistory(difference, response => {
            var blocks = response.data.history
            blocks.forEach(block => {
                // Only care about receives
                if ( block['type'] !== 'receive') { 
                    return
                }

                var number = BigInt(block['amount']) / BigInt('100000000000000000000000000000')
                var account = block['account']
                var data = {
                    "account": account,
                    "number": number
                }

                currentPlayers.push(data)
            });

            writeCurrentPlayers(currentPlayers)
        },
        error => {
            logError("Failed to get my account history. " + error)
        })
    },
    error => {
        logError("Failed to get my account block count. " + error)
    })
}

function main() {
    setStartingHeight()
    execute()
    setInterval(function() {
        execute()
    }, 10 * 60 * 1000);

    stats()
    setInterval(() => {
        stats()
    }, 60 * 1000);
}

main()