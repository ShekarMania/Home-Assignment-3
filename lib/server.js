/*
*
* Server
*
*/
const http =  require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const helpers = require('./helpers');
const handlers = require('./handlers');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const server = {};

server.http = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});


server.init = () => {
  server.http.listen(process.env.PORT ? process.env.PORT : config.httpPort, () => {
    console.log('\x1b[32m%s\x1b[0m', `Server is listening up at port ${config.httpPort} and running ${config.envName}`);
  });
}

server.unifiedServer = (req, res) => {
  let payload = {};
  const parsedUrl = url.parse(req.url, true);
  const queryStringObject = parsedUrl.query;
  let path = parsedUrl.pathname;
  path = path.replace(/^\/+|\/$/g, '');
  const method = req.method.toLowerCase();
  const headers = req.headers;

  // Get Payload if any
  let buffer = '';
  const decoder = new StringDecoder('utf-8');
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });
  req.on('end', ()=>{
    buffer += decoder.end();

    // Construct Data
    const data = {
      'path': path,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    }

    let chosenHandler = typeof (server.router[path]) !== 'undefined' ? server.router[path] : handlers.notFound;

    // If the request is within the public directory use to the public handler instead
    chosenHandler = path.indexOf('public/') > -1 ? handlers.public : chosenHandler;

    chosenHandler(data, (statusCode, payload, contentType) => {
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      contentType = typeof(contentType) == 'string' ? contentType : 'json'

      let payloadString = '';
      if(contentType == 'json'){
        res.setHeader('Content-Type', 'application/json');
        payload = typeof(payload) == 'object' ? payload : {};
        payloadString = JSON.stringify(payload)
      }
      if(contentType == 'html'){
        res.setHeader('Content-Type', 'text/html');
        payloadString = typeof(payload) == 'string' ? payload : '';
      }
      
      if(contentType == 'favicon'){
        res.setHeader('Content-Type', 'image/x-icon');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
      }

      if(contentType == 'plain'){
        res.setHeader('Content-Type', 'text/plain');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
      }

      if(contentType == 'css'){
        res.setHeader('Content-Type', 'text/css');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
      }

      if(contentType == 'png'){
        res.setHeader('Content-Type', 'image/png');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
      }

      if(contentType == 'jpg'){
        res.setHeader('Content-Type', 'image/jpeg');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
      }

      res.writeHead(statusCode);
      res.end(payloadString);
      console.log('Response ', statusCode, payload, method, queryStringObject);
    });
  });
}

server.router = {
  '' : handlers.index,
  'account/create': handlers.accountCreate,
  'session/create': handlers.sessionCreate,
  'session/delete': handlers.sessionDeleted,
  'menu': handlers.showMenu,
  'cart': handlers.showCart,
  'public': handlers.public,
  'favicon': handlers.favicon,
  'api/users' : handlers.users,
  'api/tokens': handlers.tokens,
  'api/login' : handlers.login,
  'api/logout': handlers.logout,
  'api/cart' : handlers.cart,
  'api/menu': handlers.menu,
  'api/order': handlers.order
}

module.exports = server;
