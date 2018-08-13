let AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
let uuid = require('uuidv4');

exports.handler = function (event, context, callback) {
    let response = {
        "statusCode": 201,
        "headers": {
            "Access-Control-Allow-Origin": "*"
        },
        "body": "{}"
    }

    let orderId = uuid();//new order id

    console.log("Creating order", orderId);

    let Item = JSON.parse(event.body);
    Item.verified = false;
    Item.order_id = orderId;

    ddb.put({
        TableName: 'btofac',
        Item: Item
    }).promise().then(function (data) {
        response.body = JSON.stringify({
            order_id: orderId
        });
        callback(null, response);
    }).catch(function (err) {
        console.error("Error in creating order", orderId, err);
        response.body = "Error in creating order : " + orderId;
        response.statusCode = 500;
        callback(null, response);
    });
}