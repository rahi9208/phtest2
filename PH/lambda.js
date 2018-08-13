let AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
let md5 = require('md5');
let queryString = require('query-string');

exports.handler = function (event, context, callback) {

    let response = {
        "isBase64Encoded": true,
        "statusCode": 200,
        "headers": {
            "headerName": "headerValue"
        },
        "body": "..."
    }

    let params = queryString.parse(event.body);
    let secret = process.env.PH_SECRET;

    let md5sig = (md5(
        params.merchant_id + params.order_id + params.payhere_amount + params.payhere_currency + params.status_code + (md5(secret)).toUpperCase()
    )).toUpperCase();

    let verified = md5sig === params.md5sig && params.status_code === '2' && params.payhere_currency === 'LKR'
        && (params.payhere_amount === "5000.00" || params.payhere_amount === "3000.00");

    console.log("Saving Item", params, verified);

    //save new order
    ddb.update({
        TableName: 'btofac',
        Key: {
            'order_id': params.order_id
        },
        ExpressionAttributeNames: {
            '#verified': 'verified',
            '#phr': 'payhere_response'
        },
        ExpressionAttributeValues: {
            ':verified': verified,
            ':phr': params
        },
        UpdateExpression: 'set #verified = :verified, #phr = :phr'
    }).promise().then(function (data) {
        console.log("Successfully updated order", params.order_id);
        callback(null, response);
    }).catch(function (err) {
        //handle error
        console.error("Error in updating order", params.order_id, err);
        callback(null, response);
    });
}