const express = require('express');
const connectDB = require('./db');
const morgan = require('morgan');
const cors = require('cors');

// import routes
const authRoutes = require('./routes/auth');

const app = express();

// Connect to database
connectDB();

app.get('/', (req, res) => res.send('API Running'));

//middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// routes middleware
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
