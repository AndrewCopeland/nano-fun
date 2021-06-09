import { deserialize } from "v8";

const axios = require('axios').default;
const account = process.argv[2]

function httpPost(address: string, body: any, successCallback: any, failureCallback: any) {
    const instance = axios.create({
        baseURL: address,
        timeout: 10000,
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

function rawToNANO(raw: BigInt) {
    var asString = raw.toString()

    if (asString.length > 30) {
        var dif = asString.length - 30
        var decimal = asString.substring(dif, asString.length)
        var integer = asString.substring(0, dif)
        return integer + "." + decimal
    }

    if (asString.length == 30) {
        return "." + asString
    }

    // pad 0s because it is less the .1 nano
    asString = asString.padStart(30, '0');
    return "." + asString
}

function countReceivedAmounts(response: any) {
    var blocks = response.data.history
    var amount = BigInt(0)

    blocks.forEach(block => {
        if ( block['type'] === 'receive') {
            amount += BigInt(block['amount'])
        } 
    });

    console.log(account + "has received " + rawToNANO(amount) + " NANO")
}

function accountHistoryError(error: any) {
    console.log("Error has occured:")
    console.log(error.data)
}

function main() {
    var address = "http://localhost:7076"

    var body = {  
        "action": "account_history",
        "account": account,
        "count": "-1"
    }

    httpPost(address, body, countReceivedAmounts, accountHistoryError)
}

main()