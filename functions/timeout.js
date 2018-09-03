'use strict';

const epsagon = require('@epsagon/epsagon');

epsagon.init({
    token: process.env.epsagon_token,
    appName: 'serverless-observability',
    metadataOnly: false,
});


module.exports.handler = epsagon.lambdaWrapper( (event, context, callback) => {
  console.log(JSON.stringify(event));
  console.log("this is going to timeout...");
});