const express = require('express');

const app = express();
const cors = require('cors');
const port = 3001;
app.use(cors());
app.use(express.json());

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./events.db', (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to the SQLite database.');
      db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        startTime TEXT,
        endTime TEXT
      )`);
    }
  });
app.post('/events', (req, res) => {
    const { name, startTime, endTime } = req.body;
  
    const overlapCheck = `
      SELECT * FROM events 
      WHERE 
        (startTime < ? AND endTime > ?)
    `;
  
    const exactMatchCheck = `
      SELECT * FROM events 
      WHERE 
        (startTime = ? AND endTime = ?)
    `;
  
    db.all(exactMatchCheck, [startTime, endTime], (err, rowsExact) => {
      if (err) return res.status(500).json({ message: err.message });
  
      if (rowsExact.length > 0) {
        return res.status(400).json({ message: 'Event time exactly matches an existing event.' });
      } else {
        db.all(overlapCheck, [endTime, startTime], (err, rowsOverlap) => {
          if (err) return res.status(500).json({ message: err.message });
  
          if (rowsOverlap.length > 0) {
            return res.status(400).json({ message: 'Event time overlaps with an existing event.' });
          } else {
            const stmt = db.prepare('INSERT INTO events (name, startTime, endTime) VALUES (?, ?, ?)');
            stmt.run(name, startTime, endTime, function (err) {
              if (err) return res.status(500).json({ message: err.message });
              res.json({ id: this.lastID });
            });
            stmt.finalize();
          }
        });
      }
    });
  });
  

  app.get('/events', (req, res) => {
    db.all('SELECT * FROM events', [], (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    });
  });

  app.put('/events/:id', (req, res) => {
    const { name, startTime, endTime } = req.body;
    const { id } = req.params;
  
    const conflictCheck = `SELECT * FROM events WHERE id != ? AND ((startTime BETWEEN ? AND ?) OR (endTime BETWEEN ? AND ?))`;
    db.all(conflictCheck, [id, startTime, endTime, startTime, endTime], (err, rows) => {
      if (rows.length > 0) {
        return res.status(400).json({ message: 'Event time conflicts with an existing event.' });
      } else {
        const stmt = db.prepare('UPDATE events SET name = ?, startTime = ?, endTime = ? WHERE id = ?');
        stmt.run(name, startTime, endTime, id, (err) => {
          if (err) return res.status(500).json({ message: err.message });
          res.json({ message: 'Event updated successfully' });
        });
        stmt.finalize();
      }
    });
  });

  app.delete('/events/:id', (req, res) => {
    const { id } = req.params;
  
    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    stmt.run(id, (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Event deleted successfully' });
    });
    stmt.finalize();
  });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
