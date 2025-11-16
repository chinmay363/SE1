const axios = require('axios');
require('dotenv').config();

const BASE = 'https://api.platerecognizer.com/v1/plate-reader/';

async function recognizeFromImageUrl(imageUrl) {
  const key = process.env.PLATE_RECOGNIZER_API_KEY;
  if (!key) throw new Error('No PLATE_RECOGNIZER_API_KEY set in .env');
  const res = await axios.post(BASE, { url: imageUrl }, { headers: { Authorization: `Token ${key}` } });
  return res.data;
}

module.exports = { recognizeFromImageUrl };
