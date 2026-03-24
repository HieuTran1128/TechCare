const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const customerRoutes = require('./routes/customer.routes');
const repairTicketRoutes = require('./routes/repairTicket.routes');
const deviceRoutes = require('./routes/device.routes');
const partRoutes = require('./routes/part.routes');
const supplierRoutes = require('./routes/supplier.routes');
const kpiRoutes = require('./routes/kpi.routes');
const connectDB = require('./config/mongo')
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/ticket', repairTicketRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/kpi', kpiRoutes);

const PORT = process.env.PORT || 5000;
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
module.exports = app;
