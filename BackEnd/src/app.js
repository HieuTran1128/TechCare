const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const customerRoutes = require('./routes/customer.routes')
const repairTicketRoutes = require('./routes/repairTicket.routes')
const deviceRoutes = require('./routes/device.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',  
  credentials: true,              
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/ticket', repairTicketRoutes)
app.use('/api/devices', deviceRoutes);

module.exports = app;