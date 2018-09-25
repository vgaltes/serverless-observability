'use strict';

const Promise = require('bluebird');
const AWS = require('aws-sdk');
const sns = Promise.promisifyAll(new AWS.SNS());
const region = AWS.config.region;
const epsagon = require('@epsagon/epsagon');

epsagon.init({
  token: process.env.epsagon_token,
  appName: `${process.env.service}`,
  metadataOnly: false,
});


module.exports.handler = epsagon.lambdaWrapper(async function (event, context, callback) {
  console.log(JSON.stringify(event));
  console.log("service-c is a go");

  let topicArn = `arn:aws:sns:${region}:${process.env.accountId}:${process.env.service}${process.env.stage}`;
  let message = 'test';

  let req = {
    Message: message,
    TopicArn: topicArn
  };

  await sns.publishAsync(req);

  callback(null, "foo");
});
