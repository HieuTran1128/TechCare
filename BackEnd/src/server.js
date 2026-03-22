require('dotenv').config();
require('./jobs/invitation-expire.job');
const http = require('http');
const app = require('./app');
const connectDB = require('./config/mongo');
const { createChatSocket } = require('./socket/chat.socket');

const PORT = process.env.PORT || 3000;

connectDB();

const httpServer = http.createServer(app);
createChatSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
