const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./elms.sqlite');

db.serialize(() => {
  // Create admin table
  db.run(`CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserName TEXT NOT NULL,
    Password TEXT NOT NULL,
    updationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create tbldepartments table
  db.run(`CREATE TABLE IF NOT EXISTS tbldepartments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    DepartmentName TEXT,
    DepartmentShortName TEXT,
    DepartmentCode TEXT,
    CreationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create tblemployees table
  db.run(`CREATE TABLE IF NOT EXISTS tblemployees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    EmpId TEXT NOT NULL,
    FirstName TEXT,
    LastName TEXT,
    EmailId TEXT,
    Password TEXT,
    Gender TEXT,
    Dob TEXT,
    Department TEXT,
    Address TEXT,
    City TEXT,
    Country TEXT,
    Phonenumber TEXT,
    Status INTEGER,
    RegDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create tblleaves table
  db.run(`CREATE TABLE IF NOT EXISTS tblleaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    LeaveType TEXT,
    ToDate TEXT,
    FromDate TEXT,
    Description TEXT,
    PostingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    AdminRemark TEXT,
    AdminRemarkDate TEXT,
    Status INTEGER,
    IsRead INTEGER,
    empid INTEGER,
    FOREIGN KEY(empid) REFERENCES tblemployees(id)
  )`);

  // Create tblleavetype table
  db.run(`CREATE TABLE IF NOT EXISTS tblleavetype (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    LeaveType TEXT,
    Description TEXT,
    CreationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert initial data
  db.run(`INSERT INTO admin (UserName, Password) VALUES ('admin', 'admin123')`);

  db.run(`INSERT INTO tbldepartments (DepartmentName, DepartmentShortName, DepartmentCode) VALUES 
    ('Human Resource', 'HR', 'HR001'),
    ('Information Technology', 'IT', 'IT001'),
    ('Operations', 'OP', 'OP1')`);

  db.run(`INSERT INTO tblemployees (EmpId, FirstName, LastName, EmailId, Password, Gender, Dob, Department, Address, City, Country, Phonenumber, Status) VALUES 
    ('EMP10806121', 'Anuj', 'kumar', 'anuj@gmail.com', 'pass123', 'Male', '3 February, 1990', 'Human Resource', 'New Delhi', 'Delhi', 'India', '9857555555', 1),
    ('DEMP2132', 'Amit', 'kumar', 'test@gmail.com', 'f925916e2754e5e03f75dd58a5733251', 'Male', '3 February, 1990', 'Information Technology', 'New Delhi', 'Delhi', 'India', '8587944255', 1)`);

  db.run(`INSERT INTO tblleavetype (LeaveType, Description) VALUES 
    ('Casual Leave', 'Casual Leave'),
    ('Medical Leave test', 'Medical Leave test'),
    ('Restricted Holiday(RH)', 'Restricted Holiday(RH)')`);
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Database initialization completed.');
});