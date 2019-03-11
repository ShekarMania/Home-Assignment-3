/*
*
* Helpers File
*
*/
// Dependencies
const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');
const path = require('path');
const fs = require('fs');
const helpers = {};

helpers.parseJsonToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
}

helpers.validateEmail = (email) => {
  let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

// Create a SHA256 hash
helpers.hash = (str) => {
  if (typeof(str) == 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha1', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
}

// Generate Random String
helpers.generateToken = (strLength = 20) => {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    possibleChars = 'abcdefghijklomnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789';
    randomString = '';
    let i = 1;
    while (i <= strLength) {
      randomString += possibleChars.charAt(Math.floor(Math.random() * Math.floor(possibleChars.length)));
      i++;
    }
    return randomString;
  } else {
    return false;
  }
}

helpers.makeStripeTransaction = (email, amount, callback) => {
  // Validate parameters
  email = typeof (email) == 'string' && helpers.validateEmail(email.trim()) ? email.trim() : false;
  amount = typeof (amount) == 'number' ? amount : false;

  if (email && amount) {

    // Create the order object and include in user's phone
    const orderPostData = {
      'amount': amount,
      'currency': 'usd',
      'source': 'tok_amex',
      'description': `Charge for ${email}`,
      'receipt_email': email
    }

    // Need to serialize to send in post request
    const stringOrderPostData = querystring.stringify(orderPostData);

    // // An object of options to indicate where to post to
    const postOptions = {
      "method": "POST",
      'protocol': "https:",
      "hostname": 'api.stripe.com',
      "path": '/v1/charges',
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "Authorization": "Bearer " + config.stripeApiKey
      }
    };

    // Instantiate the request object
    let req = https.request(postOptions, function (res) {
      // Grab the status of the sent request
      const status = res.statusCode;
      // Callback successfully if the request went through
      if([200,201].indexOf(status) == -1) {
        callback(status, {'Error': 'Status code returned was ' + status});
      }
      // Returning 301
      let chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        let body = Buffer.concat(chunks);
        callback(status, {'Response': JSON.parse(body.toString())});
      });
    });

    req.on('error', function (e) {
      callback(e);
    });

    // write data to request body
    req.write(stringOrderPostData);
    req.end();
  } else {
    callback('Given parameters were missing or invalid');
  }
}


helpers.sendMailgunEmail = (email, receiptUrl, callback) => {
  // Validate parameters
  email = typeof (email) == 'string' && helpers.validateEmail(email.trim()) ? email.trim() : false;
  receiptUrl = typeof (receiptUrl) == 'string' ? receiptUrl : false;
  console.log(email, receiptUrl);

  if (email && receiptUrl) {

    // Create the order object and include in user's phone
    const payload = {
      'from': config.mailgun.from,
      'to': config.mailgun.to,
      'subject': 'Transaction Email [Mailgun]',
      'html': `Hello ${email},<br><br>
              Please find this receipt link for recent transaction via stripe API.<br>
              Receipt link: <a href="${receiptUrl}">${receiptUrl}</a><br><br>Thanks,<br>Nodejs Developer`
    }

    // Need to serialize to send in post request
    const stringpayload = querystring.stringify(payload);

    // An object of options to indicate where to post to
    const postOptions = {
      protocol: 'https:',
      hostname: config.mailgun.host,
      method: 'POST',
      path: `/v3/${config.mailgun.domainName}/messages`,
      auth: `${config.mailgun.authUsername}:${config.mailgun.privateKey}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringpayload),
      },
    };
    debugger;
    // Instantiate the request object
    let req = https.request(postOptions, function (res) {
      // Grab the status of the sent request
      const status = res.statusCode;
      console.log(status);
      // Callback successfully if the request went through
      if ([200, 201].indexOf(status) == -1) {
        callback(status, { 'Error': 'Status code returned was ' + status });
      }
      // Returning 301
      let chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        let body = Buffer.concat(chunks);
        console.log('response end: ', body.toString());
        callback(status, { 'Response': JSON.parse(body.toString()) });
      });
    });

    // Add payload to the request.
    req.write(stringpayload);

    req.on('error', function (e) {
      callback(400, {'Error': e});
    });


    req.end();
  } else {
    callback(400, {'Error': 'Given parameters were missing or invalid'});
  }
}

helpers.getTemplate = (templateName, data, callback) => {
  templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
  data = typeof(data) == 'object' ? data : {}
  if(templateName){
    let templatesDir = path.join(__dirname,'/../templates/');
    fs.readFile(templatesDir+templateName+'.html','utf8',(err,str) => {
      if(!err && str && str.length > 0){
        // do interpolation
        let finalString = helpers.interpolate(str,data)
        callback(false,finalString)
      } else {
        callback('No Template could be found')
      }
    })
  } else {
    callback('A valid template name is not specified')
  }
}

// Add the universal header and footer to a string, and pass provided data object to header and footer for interpolation
helpers.addUniversalTemplates = function(str,data,callback){
  str = typeof(str) == 'string' && str.length > 0 ? str : ''
  data = typeof(data) == 'object' && data !== null ? data : {}
  // Get the header
  helpers.getTemplate('_header',data,function(err,headerString){
    if(!err && headerString){
      // Get the footer
      helpers.getTemplate('_footer',data,function(err,footerString){
        if(!err && footerString){
          // Add them all together
          let fullString = headerString+str+footerString;
          callback(false,fullString);
        } else {
          callback('Could not find the footer template')
        }
      });
    } else {
      callback('Could not find the header template')
    }
  })
}

helpers.interpolate = (str,data) => {
  str = typeof(str) == 'string' && str.trim().length > 0 ? str : ''
  data = typeof(data) == 'object' ? data : {}

  // Add the templateGlobals to the data object, prepending their key name with "global."
  for(var keyName in config.templateGlobals){
    if(config.templateGlobals.hasOwnProperty(keyName)){
      data['global.'+keyName] = config.templateGlobals[keyName]
    }
  }
  // For each key in the data object, insert its value into the string at the corresponding placeholder
  for(var key in data){
      if(data.hasOwnProperty(key) && typeof(data[key] == 'string')){
        var replace = data[key];
        var find = '{'+key+'}';
        str = str.replace(find,replace);
      }
  }
  return str;
}

// Get the contents of a static (public) asset
helpers.getStaticAsset = function(fileName,callback){
  fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
  if(fileName){
    var publicDir = path.join(__dirname,'/../public/');
    fs.readFile(publicDir+fileName, function(err,data){
      if(!err && data){
        callback(false,data);
      } else {
        callback('No file could be found');
      }
    });
  } else {
    callback('A valid file name was not specified');
  }
};

module.exports = helpers;
