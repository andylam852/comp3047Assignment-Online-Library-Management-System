const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/dbClient');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// use shared db client

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const db = await getDb();
    const users = db.collection('users');

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const storedHash = user.password;

    let isMatch = false;
    if (storedHash && storedHash.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, storedHash);
    } else {

      isMatch = password === storedHash;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { sub: String(user._id), email: user.email, role: user.role || 'user' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

    const { password: _pw, ...safeUser } = user;
    return res.status(200).json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // shared client: do not close per request
  }
});

module.exports = router;
