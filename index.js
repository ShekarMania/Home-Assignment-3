// ENTRY FILE

const server = require('./lib/server');

// Define App
const app = {};

// app init
app.init = () => {
  // server init
  server.init();
};

app.init();
