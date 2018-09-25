'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const utils = require('./utils');
const AWS = require('aws-sdk');
const sns = Promise.promisifyAll(new AWS.SNS());
const s3 = Promise.promisifyAll(new AWS.S3());
const dynamodb = Promise.promisifyAll(new AWS.DynamoDB.DocumentClient());
const lambda = new AWS.Lambda();
const region = AWS.config.region;
const BUCKET_NAME = process.env.BUCKET_NAME;
const thundra = require("@thundra/core")({ apiKey: `${process.env.thundra_api_key}` });

let publishSNS = () => {
  let topicArn = `arn:aws:sns:${region}:${global.accountId}:serverless-observability-thundra-${process.env.stage}`;
  let message = 'test';

  let req = {
    Message: message,
    TopicArn: topicArn
  };

  console.log("publishing to sns");

  return sns.publishAsync(req);
};

let invokeLambda = segment => {

  let funcName = `${process.env.service}-${process.env.stage}-service-c`;

  let req = {
    FunctionName: funcName,
    InvocationType: "RequestResponse",
    Payload: ""
  };

  console.log('invoking Lambda function');

  return lambda.invoke(req).promise();
};

let accessDynamoDB = () => {
  console.log("accessing dynamo db");

  let table = `${process.env.service}-${process.env.stage}`;
  let id = global.requestId;
  let value = `test-${id}`;
  let getReq = {
    TableName: table,
    Key: {
      id: value
    }
  };

  let putReq = {
    TableName: table,
    Item: {
      id: value,
    }
  };

  return Promise.all([
    dynamodb.getAsync(getReq),
    dynamodb.putAsync(putReq)
  ]);
};

let accessS3 = async () => {
  console.log("accessing s3");
  let bucket = BUCKET_NAME;
  let key = `${global.requestId}.txt`;
  let body = 'test';
  let getReq = {
    Bucket: bucket,
    Key: key
  };

  let putReq = {
    Body: body,
    Bucket: bucket,
    Key: key
  };

  return s3.putObjectAsync(putReq);
};

let callServiceB = (n) => {
  console.log("calling service b");
  return utils.request('GET', global.hostname, '/dev/demo/service-b')
    .then(resp => {
      console.log(resp);
      let body = JSON.parse(resp);
      return body.message;
    });
};

module.exports.handler = thundra(async function (event, context, callback) {
  console.log(JSON.stringify(event));
  console.log(JSON.stringify(context));

  global.hostname = event.headers.Host;
  global.accountId = event.requestContext.accountId;
  global.requestId = event.requestContext.requestId;

  let n = _.get(event, 'queryStringParameters.n', 0);

  if (n <= 1) {
    await publishSNS();
    await accessS3();
    await accessDynamoDB();
    await invokeLambda();
    let message = await callServiceB(n);
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: `service-b says ${message}`
      }),
    };

    callback(null, response);
  } else if (n <= 2) {
    console.log("service-a is going to call the timeout endpoint");
    await utils.request('GET', hostname, '/dev/demo/timeout');

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: `Timed out`
      })
    };

    callback(null, response);
  } else if (n <= 3) {
    console.log("service-a is going to call the error endpoint");
    await utils.request('GET', hostname, '/dev/demo/error');

    const response = {
      statusCode: 500,
      body: JSON.stringify({
        message: `Custom internal server error`
      })
    };

    callback(null, response);
  } else {
    console.log("service-a is going to call the error endpoint");
    await utils.request('GET', hostname, '/dev/demo/error');

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: `This shouldn't appear`
      }),
    };

    callback(null, response);
  }
});