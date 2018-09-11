'use strict';

const iopipe = require('@iopipe/iopipe')({
  token: `${process.env.iopipe_token}`
});

module.exports.handler = iopipe(async function(event, context, callback) {
  console.log(JSON.stringify(event));
  console.log("service-read-dynamo is a go");

  callback(null, "Everything is OK");
});
