'use strict';
const thundra = require("@thundra/core")({ apiKey: `${process.env.thundra_api_key}` });

module.exports.handler = thundra((event, context, callback) => {
  console.log(JSON.stringify(event));

  callback(null, "ok");
});