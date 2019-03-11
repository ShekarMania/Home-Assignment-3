// Handlers

// Dependencies
const helpers = require('./helpers');
const _data = require('./data');
const config = require('./config');
const https = require('https');

const handlers = {};

/*
 * HTML Handlers
 *
 */

// Index
handlers.index = function(data,callback){
  // Reject any request that isn't a GET
  if(data.method == 'get'){
    // Prepare data for interpolation
    var templateData = {
      'head.title' : 'Uptime Monitoring - Made Simple',
      'head.description' : 'We offer free, simple uptime monitoring for HTTP/HTTPS sites all kinds. When your site goes down, we\'ll send you a text to let you know',
      'body.class' : 'index'
    };
    // Read in a template as a string
    helpers.getTemplate('index',templateData,function(err,str){
      if(!err && str){
        // Add the universal header and footer
        helpers.addUniversalTemplates(str,templateData,function(err,str){
          if(!err && str){
            // Return that page as HTML
            callback(200,str,'html');
          } else {
            callback(500,undefined,'html');
          }
        });
      } else {
        callback(500,undefined,'html');
      }
    });
  } else {
    callback(405,undefined,'html');
  }
};

// Create Account
handlers.accountCreate = function(data,callback){
  // Reject any request that isn't a GET
  if(data.method == 'get'){
    // Prepare data for interpolation
    var templateData = {
      'head.title' : 'Create an Account',
      'head.description' : 'Signup is easy and only takes a few seconds.',
      'body.class' : 'accountCreate'
    };
    // Read in a template as a string
    helpers.getTemplate('accountCreate',templateData,function(err,str){
      if(!err && str){
        // Add the universal header and footer
        helpers.addUniversalTemplates(str,templateData,function(err,str){
          if(!err && str){
            // Return that page as HTML
            callback(200,str,'html');
          } else {
            callback(500,undefined,'html');
          }
        });
      } else {
        callback(500,undefined,'html');
      }
    });
  } else {
    callback(405,undefined,'html');
  }
};

// Create New Session
handlers.sessionCreate = function(data,callback){
  // Reject any request that isn't a GET
  if(data.method == 'get'){
    // Prepare data for interpolation
    var templateData = {
      'head.title' : 'Login to your account.',
      'head.description' : 'Please enter your phone number and password to access your account.',
      'body.class' : 'sessionCreate'
    };
    // Read in a template as a string
    helpers.getTemplate('sessionCreate',templateData,function(err,str){
      if(!err && str){
        // Add the universal header and footer
        helpers.addUniversalTemplates(str,templateData,function(err,str){
          if(!err && str){
            // Return that page as HTML
            callback(200,str,'html');
          } else {
            callback(500,undefined,'html');
          }
        });
      } else {
        callback(500,undefined,'html');
      }
    });
  } else {
    callback(405,undefined,'html');
  }
};

// Dashboard (View Menu)
handlers.showMenu = function(data,callback){
  // Reject any request that isn't a GET
  if(data.method == 'get'){
    // Prepare data for interpolation
    var templateData = {
      'head.title' : 'Dashboard',
      'body.class' : 'checksList'
    };
    // Read in a template as a string
    helpers.getTemplate('menu',templateData,function(err,str){
      if(!err && str){
        // Add the universal header and footer
        helpers.addUniversalTemplates(str,templateData,function(err,str){
          if(!err && str){
            // Return that page as HTML
            callback(200,str,'html');
          } else {
            callback(500,undefined,'html');
          }
        });
      } else {
        callback(500,undefined,'html');
      }
    });
  } else {
    callback(405,undefined,'html');
  }
};

// Favicon
handlers.favicon = function(data,callback){
  // Reject any request that isn't a GET
  if(data.method == 'get'){
    // Read in the favicon's data
    helpers.getStaticAsset('favicon.ico',function(err,data){
      if(!err && data){
        // Callback the data
        callback(200,data,'favicon');
      } else {
        callback(500);
      }
    });
  } else {
    callback(405);
  }
};

// Public assets
handlers.public = function(data,callback){
  // Reject any request that isn't a GET
  if(data.method == 'get'){
    // Get the filename being requested
    var trimmedAssetName = data.path.replace('public/','').trim();
    if(trimmedAssetName.length > 0){
      // Read in the asset's data
      helpers.getStaticAsset(trimmedAssetName,function(err,data){
        if(!err && data){

          // Determine the content type (default to plain text)
          var contentType = 'plain';

          if(trimmedAssetName.indexOf('.css') > -1){
            contentType = 'css';
          }

          if(trimmedAssetName.indexOf('.png') > -1){
            contentType = 'png';
          }

          if(trimmedAssetName.indexOf('.jpg') > -1){
            contentType = 'jpg';
          }

          if(trimmedAssetName.indexOf('.ico') > -1){
            contentType = 'favicon';
          }

          // Callback the data
          callback(200,data,contentType);
        } else {
          callback(404);
        }
      });
    } else {
      callback(404);
    }

  } else {
    callback(405);
  }
};

// JSON API HANDLERS

// Not Found Handler
handlers.notFound = (data, callback) => {
  callback(404, {'Error' : 'Not Found'});
}

handlers.users = (data, callback) => {
  const dataMethod = data.method;
  const isMethodAllowed = ['post', 'get'].indexOf(dataMethod);
  if (isMethodAllowed > -1) {
    handlers._users[dataMethod](data, callback);
  } else {
    callback(405);
  }
}

handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data,callback){
  // Check that all required fields are filled out
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if(firstName && lastName && phone && password && tosAgreement){
    // Make sure the user doesnt already exist
    _data.read('users',phone,function(err,data){
      if(err){
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if(hashedPassword){
          var userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          };

          // Store the user
          _data.create('users',phone,userObject,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not create the new user'});
            }
          });
        } else {
          callback(500,{'Error' : 'Could not hash the user\'s password.'});
        }

      } else {
        // User alread exists
        callback(400,{'Error' : 'A user with that phone number already exists'});
      }
    });

  } else {
    callback(400,{'Error' : 'Missing required fields'});
  }

};

// Required data: phone
// Optional data: none
handlers._users.get = function(data,callback){
  // Check that phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
        _data.read('users',phone,function(err,data){
          if(!err && data){
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword;
            callback(200,data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403,{"Error" : "Missing required token in header, or token is invalid."})
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};


handlers.login = (data, callback) => {
  const acceptableMethods = ['post'];
  const dataMethod = data.method;
  if (acceptableMethods.indexOf(dataMethod) > -1) {
    handlers._login[dataMethod](data, callback);
  } else {
    callback(405);
  }
}

handlers._login = {};

// Login - post
// Required data: email, Password
// Optional data: none
handlers._login.post = (data, callback) => {
  const email = typeof (data.payload.email) == 'string' && helpers.validateEmail(data.payload.email.trim()) ? data.payload.email.trim() : false;
  const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (email && password) {
    // Lookup the users who matches the email and password
    _data.read('users', email, (err, userData) => {
      if (!err && userData) {
        // cart password is correct
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.password) {
          // if password matches
          const randomToken = helpers.generateToken();
          if (randomToken) {
            // If valid token
            const tokenData = {
              'email': email,
              'id': randomToken,
              'expires': Date.now() + 1000 * 60 * 60 * 12
            }
            _data.create('tokens', randomToken, tokenData, (err) => {
              if (!err) {
                callback(null, tokenData);
              } else {
                callback(500, { 'Error': 'Error in creating token file' });
              }
            });
          }
        } else {
          callback(400, { 'Error': 'Password Didn\'t Match' });
        }
      } else {
        callback(500, { 'Error': 'Error in reading file' });
      }
    })
  } else {
    callback(400, { "Error": "Missing required field(s)" });
  }
}


handlers.logout = (data, callback) => {
  const acceptableMethods = ['delete'];
  const dataMethod = data.method;
  if (acceptableMethods.indexOf(dataMethod) > -1) {
    handlers._logout[dataMethod](data, callback);
  } else {
    callback(405);
  }
}

handlers._logout = {};

// delete
// Required data: id
// Optional data: none
handlers._logout.delete = (data, callback) => {
  const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;

  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        _data.delete('tokens', id, (err) => {
          if (!err) {
            callback(false);
          } else {
            callback(500, { 'Error': 'Some deleting file ' + id + '.json' });
          }
        })
      } else {
        callback(500, { 'Error': 'Some error while reading file ' + id + '.json' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
}

// Tokens
handlers.tokens = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data,callback);
  } else {
    callback(405);
  }
};

handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data,callback){
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if(phone && password){
    // Lookup the user who matches that phone number
    _data.read('users',phone,function(err,userData){
      if(!err && userData){
        // Hash the sent password, and compare it to the password stored in the user object
        var hashedPassword = helpers.hash(password);
        if(hashedPassword == userData.hashedPassword){
          // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
          var tokenId = helpers.generateToken(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'phone' : phone,
            'id' : tokenId,
            'expires' : expires
          };

          // Store the token
          _data.create('tokens',tokenId,tokenObject,function(err){
            if(!err){
              callback(200,tokenObject);
            } else {
              callback(500,{'Error' : 'Could not create the new token'});
            }
          });
        } else {
          callback(400,{'Error' : 'Password did not match the specified user\'s stored password'});
        }
      } else {
        callback(400,{'Error' : 'Could not find the specified user.'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field(s).'})
  }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function(data,callback){
  // Check that id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        callback(200,tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field, or field invalid'})
  }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function(data,callback){
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if(id && extend){
    // Lookup the existing token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Check to make sure the token isn't already expired
        if(tokenData.expires > Date.now()){
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          // Store the new updates
          _data.update('tokens',id,tokenData,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not update the token\'s expiration.'});
            }
          });
        } else {
          callback(400,{"Error" : "The token has already expired, and cannot be extended."});
        }
      } else {
        callback(400,{'Error' : 'Specified user does not exist.'});
      }
    });
  } else {
    callback(400,{"Error": "Missing required field(s) or field(s) are invalid."});
  }
};


// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data,callback){
  // Check that id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Delete the token
        _data.delete('tokens',id,function(err){
          if(!err){
            callback(200);
          } else {
            callback(500,{'Error' : 'Could not delete the specified token'});
          }
        });
      } else {
        callback(400,{'Error' : 'Could not find the specified token.'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

handlers._tokens.verifyToken = (id, email, callback) => {
  // Look up the token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // cart if token is of given user and is not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
}

// Handle Menu Items
handlers.menu = (data, callback) => {
  const email = typeof (data.queryStringObject.email) == 'string' && helpers.validateEmail(data.queryStringObject.email.trim())? data.queryStringObject.email.trim() : false;
  if (email) {
    // Get the token from the Headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        const menuItems = config.menuItems;
        callback(null, menuItems);
      } else {
        callback(403, { 'Error': 'Missing required token in header, or token is invalid' });
      }
    });
 } else {
    callback(400, { 'Error': 'Missing required fields' });
 }
}

// Define Cart Handler
handlers.cart = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  const dataMethod = data.method;
  if (acceptableMethods.indexOf(dataMethod) > -1) {
    handlers._cart[dataMethod](data, callback);
  } else {
    callback(405);
  }
}

// Define container of sub-methods
handlers._cart = {}

// cart - post
// Required data: itemId, itemName
// Optional data: none
handlers._cart.post = (data, callback) => {
  const itemId = typeof (data.payload.itemId) === 'number' && config.menuItems[data.payload.itemId] ? data.payload.itemId : false;

  if (itemId) {
    // Get the token from the Headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        _data.read('tokens', token, (err, tokenData) => {
          if (!err && tokenData) {
            const userEmail = tokenData.email;

            handlers._tokens.verifyToken(token, userEmail, (tokenIsValid) => {
              if (tokenIsValid) {

                const cartId = helpers.generateToken();

                // Create the cart object and include in user's phone
                const cartObject = {
                  'id': cartId,
                  'userEmail': userEmail,
                  'items': [itemId]
                }

                _data.create('cart', cartId, cartObject, (err) => {
                  if (!err) {
                    // Return the data about new cart
                    callback(null, cartObject);
                  } else {
                    callback(500, { 'Error': 'Could not create new cart' });
                  }
                });
              } else {
                callback(403, { 'Error': 'Missing required token in header, or token is invalid' })
              }
            });

          } else {
            callback(403);
          }
        });


  } else {
    callback(400, { 'Error': 'Missing required inputs, or inputs are invalid' });
  }

}


// cart - get
// Required data: id
// Optional data: none
handlers._cart.get = (data, callback) => {
  const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;

  if (id) {
    _data.read('cart', id, (err, cartData) => {
      if (!err && cartData) {

        // Get the token from the Headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, cartData.userEmail, (tokenIsValid) => {
          if (tokenIsValid) {
            callback(200, cartData);
          } else {
            callback(403, { 'Error': 'Missing required token in header, or token is invalid' })
          }
        });

      } else {
        callback(404, { 'Error': 'Some error while reading file ' + id + '.json' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
}


// cart - put
// Required data: id, itemId, action
// Optional data: none
handlers._cart.put = (data, callback) => {
  // cart for the required field
  const id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;
  const action = typeof (data.payload.action) == 'string' && data.payload.action.trim().length > 0 ? data.payload.action.trim() : false;
  const itemId = typeof (data.payload.itemId) == 'number' && config.menuItems[data.payload.itemId] ? data.payload.itemId : false;

  // cart to make sure id is valid
  if (id && action && itemId) {
    // Lookup the cart
    _data.read('cart', id, (err, cartData) => {
      if (!err && cartData) {
        // Get the token from the Headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, cartData.userEmail, (tokenIsValid) => {
          if (tokenIsValid) {
            const itemPosition = cartData.items.indexOf(itemId);
            if (action == 'update') {
              if (itemId && itemPosition == -1) { // If itemId not exists before in cart
                cartData.items.push(itemId);
              } else {
                callback(400, { 'Error': 'Item id already exists in cart.' });
                return false;
              }
            } else if (action == 'delete') { // in case of delete
              if (itemId && itemPosition > -1) { // If itemId already exists in cart
                cartData.items.splice(itemPosition, 1)
              } else {
                callback(400, { 'Error': 'Item id not exists in cart.' });
                return false;
              }
            }
            _data.update('cart', id, cartData, (err) => {
              if (!err) {
                callback(200, cartData);
              } else {
                callback(500, { 'Error': 'Some error in updating file ' + id + '.json' });
              }
            });
          } else {
            callback(403, { 'Error': 'Missing required token in header, or token is invalid' })
          }
        });
      } else {
        callback(403, { 'Error': 'Missing required id, or id is invalid' })
      }
    });

  } else {
    callback(400, { 'Error': 'Missing required inputs, or inputs are invalid' });
  }


}

// cart - delete
// Required data: id
// Optional data: none
handlers._cart.delete = (data, callback) => {
  const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;

  if (id) {
    _data.read('cart', id, (err, cartData) => {
      if (!err && cartData) {
        // Get the token from the Headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, cartData.userEmail, (tokenIsValid) => {
          if (tokenIsValid) {
            _data.delete('cart', id, (err) => {
              if (!err) {
                callback(false);
              } else {
                callback(500, { 'Error': 'Some deleting file ' + id + '.json' });
              }
            });
          } else {
            callback(403, { 'Error': 'Missing required token in header, or token is invalid' });
          }
        });
      } else {
        callback(500, { 'Error': 'Some error while reading file ' + id + '.json' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
}


// Define Cart Handler
handlers.order = (data, callback) => {
  const acceptableMethods = ['post'];
  const dataMethod = data.method;
  if (acceptableMethods.indexOf(dataMethod) > -1) {
    handlers._order[dataMethod](data, callback);
  } else {
    callback(405);
  }
}

// Define container of sub-methods
handlers._order = {}

// order - post
// Required data: cartId
// Optional data: none
handlers._order.post = (data, callback) => {
  const cartId = typeof (data.payload.cartId) === 'string' && data.payload.cartId.trim().length > 0 ? data.payload.cartId : false;

  if (cartId) {
    // Validate Cart Id
    _data.read('cart', cartId, (err, cartData) => {
      if (!err && cartData) {
        const userEmail = cartData.userEmail;

        // Get the token from the Headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        _data.read('tokens', token, (err, tokenData) => {
          if (!err && tokenData) {

            // Get total price
            const reducer = (accumulator, currentValue) => accumulator + config.menuItems[currentValue].price;
            const amount = cartData.items.reduce(reducer);

            handlers._tokens.verifyToken(token, userEmail, (tokenIsValid) => {
              if (tokenIsValid) {

                // Make Stripe Sandbox Transaction
                helpers.makeStripeTransaction(userEmail, amount, (statusTransaction, responseTransaction) => {

                  if ([200, 201].indexOf(statusTransaction) == -1) {
                    callback(statusTransaction, responseTransaction);
                  } else {
                    // Send email to user
                    const receiptUrl = responseTransaction.Response.receipt_url;
                    helpers.sendMailgunEmail(userEmail, receiptUrl, (statusEmail, responseEmail) => {
                      callback(statusEmail, responseEmail);
                    });
                  }
                });

              } else {
                callback(401, { 'Unauthorized': 'Token is invalid' });
              }
            });

          } else {
            callback(403);
          }
        });

      } else {
        callback(403);
      }
    });

  } else {
    callback(400, { 'Error': 'Missing required inputs, or inputs are invalid' });
  }

}


module.exports = handlers;
