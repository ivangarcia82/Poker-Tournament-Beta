const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 'dummy' }, 'super_secret_poker_key_2026_xyz', { expiresIn: '7d' });
console.log(token);
