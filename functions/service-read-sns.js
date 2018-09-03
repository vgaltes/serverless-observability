'use strict';

const epsagon = require('@epsagon/epsagon');

epsagon.init({
    token: process.env.epsagon_token,
    appName: 'serverless-observability',
    metadataOnly: false,
});


module.exports.handler = epsagon.lambdaWrapper( async function(event, context, callback) {
  console.log(JSON.stringify(event));
  console.log("service-read-sns is a go");

  callback(null, "Everything is OK");
});
