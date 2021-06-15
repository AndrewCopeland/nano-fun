// Usage nano-number.ts wallet_id nano_account  

import { fail } from "assert/strict";
import { exec } from "child_process";
import { mainModule } from "process";
import fs from 'fs';


const axios = require('axios').default;
const wallet = process.argv[2]
const my_account = process.argv[3]
const url = "http://ip6-localhost:7072"
var height = -1
const data_dir = "./data/"
const winners_file = data_dir + "winners"
const winning_number_file = data_dir + "winning-number"
const game_number_file = data_dir + "game-number"


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
    var numbersLength = guessNumber(9)

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

function writeWinners(winners: string[]) {
    writeFile(winners_file, JSON.stringify(winners))
}

function writeWinningNumber(number: number) {
    writeFile(winning_number_file, number.toString())
}

function writeGameNumber(number: number) {
    writeFile(game_number_file, number.toString())
}
 
function readGameNumber(): number {
    var result = fs.readFileSync(game_number_file,'utf8');
    return Number(result)
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
    writeWinningNumber(winningNumber)
    writeWinners([])

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

        if (winners.length === 0) {
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

        writeWinners(winners)

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

function main() {
    setStartingHeight()
    execute()
    setInterval(function() {
        execute()
    }, 60 * 1000);
}

main()