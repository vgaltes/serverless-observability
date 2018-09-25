'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const utils = require('./utils');
const AWS = require('aws-sdk');
const sns = Promise.promisifyAll(new AWS.SNS());
const s3 = Promise.promisifyAll(new AWS.S3());
const dynamodb = Promise.promisifyAll(new AWS.DynamoDB.DocumentClient());
const AWSXRay = require('aws-xray-sdk');
const lambda = new AWS.Lambda();
const region = AWS.config.region;
const BUCKET_NAME = process.env.BUCKET_NAME;


let publishSNS = function (segment) {
  return new Promise((resolve, reject) => {
    console.log("publishing to sns");

    let doPublish = async function (subsegment) {
      let topicArn = `arn:aws:sns:${region}:${global.accountId}:serverless-observability-xray-${process.env.stage}`;
      let message = 'test';

      let req = {
        Message: message,
        TopicArn: topicArn
      };

      subsegment.addAnnotation('topic', topicArn);
      subsegment.addMetadata('message', message);

      await sns.publishAsync(req);
      subsegment.close();

      resolve();
    }

    AWSXRay.captureAsyncFunc("## publishing to SNS", doPublish, segment);
  });
};

let invokeLambda = segment => {
  return new Promise((resolve, reject) => {
    console.log('invoking Lambda function');

    let doInvoke = async function (subsegment) {
      let funcName = `${process.env.service}-${process.env.stage}-service-c`;

      subsegment.addAnnotation('function', funcName);

      let req = {
        FunctionName: funcName,
        InvocationType: "RequestResponse",
        Payload: ""
      };

      const resp = await lambda.invoke(req).promise();

      const respBody = resp.Payload.toString('utf8');
      subsegment.addMetadata('responseBody', respBody);

      subsegment.close();

      resolve();
    }

    AWSXRay.captureAsyncFunc("## invoking Lambda service-c", doInvoke, segment);
  });
};

let accessDynamoDB = (segment) => {
  return new Promise((resolve, reject) => {
    console.log("accessing dynamo db");

    let doAccess = async function (subsegment) {
      let table = `serverless-observability-xray-${process.env.stage}`;
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

      subsegment.addAnnotation('table', table);
      subsegment.addAnnotation('id', id);
      subsegment.addMetadata('value', value);

      await Promise.all([
        dynamodb.getAsync(getReq),
        dynamodb.putAsync(putReq)
      ]);

      subsegment.close();

      resolve();
    }

    AWSXRay.captureAsyncFunc("## accessing DynamoDB", doAccess, segment);
  });
};

let accessS3 = (segment) => {
  return new Promise((resolve, reject) => {
    console.log("accessing s3");

    let doAccess = async function (subsegment) {
      let bucket = BUCKET_NAME;
      let key = `${global.requestId}.txt`;
      let body = 'test';

      subsegment.addAnnotation('bucket', bucket);
      subsegment.addAnnotation('key', key);
      subsegment.addMetadata('body', body);

      let putReq = {
        Body: body,
        Bucket: bucket,
        Key: key
      };

      await s3.putObjectAsync(putReq);

      subsegment.close();

      resolve();
    };

    AWSXRay.captureAsyncFunc("## accessing S3", doAccess, segment);
  });
};

let callServiceB = (n, segment) => {
  return new Promise((resolve, reject) => {
    console.log("calling service b");

    let doCall = async function (subsegment) {
      subsegment.addAnnotation('path', '/dev/demo/service-b');

      let resp = await utils.request('GET', global.hostname, '/dev/demo/service-b');

      console.log(resp);
      let body = JSON.parse(resp);

      subsegment.addMetadata('message', body.message);

      subsegment.close();

      resolve(body.message);
    };

    AWSXRay.captureAsyncFunc("## calling service-b via http", doCall, segment);
  });
};

module.exports.handler = async function (event, context, callback) {
  console.log(JSON.stringify(event));
  console.log(JSON.stringify(context));

  global.hostname = event.headers.Host;
  global.accountId = event.requestContext.accountId;
  global.requestId = event.requestContext.requestId;

  let segment = AWSXRay.getSegment();

  let n = _.get(event, 'queryStringParameters.n', 0);

  if (n <= 1) {
    await publishSNS(segment);
    await accessS3(segment);
    await accessDynamoDB(segment);
    await invokeLambda(segment);
    let message = await callServiceB(n, segment);
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
};