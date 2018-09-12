'use strict';

const Promise = require('bluebird');
const AWS     = require('aws-sdk');
const sns     = Promise.promisifyAll(new AWS.SNS());
const region  = AWS.config.region;
const thundra = require("@thundra/core")({ apiKey: `${process.env.thundra_api_key}` });

module.exports.handler = thundra(async function(event, context, callback) {
  console.log(JSON.stringify(event));
  console.log("service-c is a go");

  let topicArn = `arn:aws:sns:${region}:${process.env.accountId}:serverless-observability-${process.env.stage}`;
  let message = 'test';

  let req = {
    Message: message,
    TopicArn: topicArn
  };
  
  await sns.publishAsync(req);

  callback(null, "foo");
});
