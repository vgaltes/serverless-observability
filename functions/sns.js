'use strict';

const iopipe = require('@iopipe/iopipe')({
  token: `${process.env.iopipe_token}`
});

module.exports.handler = iopipe((event, context, callback) => {
  console.log(JSON.stringify(event));

  callback(null, "ok");
});