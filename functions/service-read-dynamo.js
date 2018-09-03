'use strict';

module.exports.handler = async function(event, context, callback) {
  console.log(JSON.stringify(event));
  console.log("service-read-dynamo is a go");

  callback(null, "Everything is OK");
};
