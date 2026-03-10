require('dotenv').config();
require('./jobs/invitation-expire.job');
const app = require('./app');
const connectDB = require('./config/mongo');

connectDB();

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running ' + (process.env.PORT));
});
