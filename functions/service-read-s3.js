'use strict';
const thundra = require("@thundra/core")({ apiKey: `${process.env.thundra_api_key}` });

module.exports.handler = thundra(async function(event, context, callback) {
  console.log(JSON.stringify(event));
  console.log("service-read-s3 is a go");

  callback(null, "Everything is OK");
});
