const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./events.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        startTime TEXT,
        endTime TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Error creating events table:', err.message);
      }
    });
  }
});