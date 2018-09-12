'use strict';
const thundra = require("@thundra/core")({ apiKey: `${process.env.thundra_api_key}` });

module.exports.handler = thundra((event, context, callback) => {
  console.log(JSON.stringify(event));  

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'boo'      
    }),
  };

  callback(null, response);
});