const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
const db = new sqlite3.Database('./elms.sqlite');

app.use(cors());
app.use(express.json());

const SECRET_KEY = 'your_secret_key_here';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    req.userId = decoded.id;
    next();
  });
};

// Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM tblemployees WHERE EmailId = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(400).json({ error: 'User not found' });

    bcrypt.compare(password, row.Password, (err, result) => {
      if (result) {
        const token = jwt.sign({ id: row.id }, SECRET_KEY, { expiresIn: 86400 }); // expires in 24 hours
        res.json({ auth: true, token: token, user: { id: row.id, name: row.FirstName + ' ' + row.LastName, email: row.EmailId } });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
  });
});

// Get all employees
app.get('/employees', verifyToken, (req, res) => {
  db.all('SELECT * FROM tblemployees', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Apply for leave
app.post('/leave', verifyToken, (req, res) => {
  const { LeaveType, ToDate, FromDate, Description } = req.body;
  db.run('INSERT INTO tblleaves (LeaveType, ToDate, FromDate, Description, Status, IsRead, empid) VALUES (?, ?, ?, ?, 0, 0, ?)',
    [LeaveType, ToDate, FromDate, Description, req.userId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

// Get leave requests for an employee
app.get('/leave', verifyToken, (req, res) => {
  db.all('SELECT * FROM tblleaves WHERE empid = ?', [req.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});