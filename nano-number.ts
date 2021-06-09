// Usage nano-number.ts wallet_id nano_account  

import { fail } from "assert/strict";
import { exec } from "child_process";
import { mainModule } from "process";

const axios = require('axios').default;
const wallet = process.argv[2]
const my_account = process.argv[3]
const url = "http://localhost:7076"
var height = 25

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
    console.log("ERROR: " + message)
}

function log(message: string) {
    console.log("INFO: " + message)
}

function guessNumber(numbers: number) {
    return Math.floor(Math.random() * numbers) + 1;
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


    var winningNumber = guessNumber(2)
    var winningRaw = BigInt(winningNumber.toString() + "000000000000000000000000000")
    var winners = []
    var receivedAmount = BigInt(0)

    log("Winning Amount: " + winningRaw.toString())

    httpPost(url, body, function(response) {
        var blocks = response.data.history
        blocks.forEach(block => {
            if ( block['type'] === 'receive') {
                var amount = BigInt(block['amount'])
                var account = block['account']
                log("Account: " + account)
                log("Amount: " + amount.toString())
                receivedAmount += amount
                if (amount == winningRaw) {
                    log("amount and winning raw equal")

                    // make sure duplicate winners not allowed. 
                    for(let winner of winners){
                        if (winner === account) {
                            log("Duplicate account found " + account)
                            return
                        }
                    }

                    log("winner found " + account)
                    winners.push(account)
                }
            }
        });

        log("Received amount: " + receivedAmount.toString())
        log("Number of Winners: " + winners.length.toString())

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

    httpPost(url, body, function(response) {

        log("Successfully sent " + payment.toString() + " to " + account)
        log(JSON.stringify(response.data))

        getMyAccountBlockCount(function(response){
            var current_height = Number(response.data.block_count)
            height = current_height
            log("New game height is: " + height.toString())
        }, logError)

    },
    function(error) {
        logError("Failed to send payment to " + account)
        console.log(error)
    })


}

function main() {
    execute()
    setInterval(function() {
        execute()
    }, 60 * 1000);
}

main()