'use strict';

const epsagon = require('@epsagon/epsagon');

epsagon.init({
  token: process.env.epsagon_token,
  appName: `${process.env.service}`,
  metadataOnly: false,
});


module.exports.handler = epsagon.lambdaWrapper(async function (event, context, callback) {
  console.log(JSON.stringify(event));
  console.log("service-read-dynamo is a go");

  callback(null, "Everything is OK");
});
