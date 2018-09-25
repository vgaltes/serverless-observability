'use strict';

const epsagon = require('@epsagon/epsagon');

epsagon.init({
  token: process.env.epsagon_token,
  appName: `${process.env.service}`,
  metadataOnly: false,
});


module.exports.handler = epsagon.lambdaWrapper((event, context, callback) => {
  console.log(JSON.stringify(event));

  callback(null, "ok");
});