let AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

var api_key = process.env.MAIL_KEY;
var domain = 'backtofaculty.com';
var mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });

function createHtmlResponse(valid, Item = {}, orderId) {
    let invalidResponse = `<p>Payment not processed or invalid payment. Reference number : ${orderId}</p>`;
    let validResponse = `<div>
    <h1>This is your ticket</h1>
    <h2>${Item.items}</h2>
    <h3>LKR ${Item.amount} - ${Item.has_spouse ? "Couple Ticket" : "Single Ticket"}</h3>
    <p>${Item.first_name} ${Item.last_name} ${Item.has_spouse ? 'with ' + Item.spouse_name : ''}</p>
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${Item.order_id}"/>
    <p>${Item.order_id}</p>
    <p>Bookmark or print this page. Bring this entire page with you to the event.</p>
</div>`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Back To Faculty - Ticket</title>
</head>
<body>
${valid ? validResponse : invalidResponse}
</body>
</html>`
}

exports.handler = function (event, context, callback) {

    let response = {
        "isBase64Encoded": true,
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-type": "text/html",
            "charset": "utf-8"
        },
        "body": "{}"
    }

    let orderId = event.queryStringParameters.order_id;

    console.log("Fetching order", orderId);

    ddb.get({
        TableName: 'btofac',
        Key: { 'order_id': orderId }
    }).promise().then(function (data) {
        console.log("Fectched order", orderId, data);
        //send mail
        var ticketHtml = createHtmlResponse(data.Item && data.Item.verified, data.Item, orderId);
        var emailData = {
            from: 'Back to Faculty <tickets@backtofaculty.com>',
            to: data.Item.email,
            subject: 'Back to Faculty e-Ticket',
            html: ticketHtml
        };
        mailgun.messages().send(emailData, function (error, body) {
            console.log(error,body);
        });
        response.body = ticketHtml;
        callback(null, response);
    }).catch(function (err) {
        console.error("Error in fecting order", orderId, err);
        response.body = "Error in fetching order";
        callback(null, response);
    });
}