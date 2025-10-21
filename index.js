require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();

const urlDatabase = {};
let nextShortId = 1; // Contador para gerar o shortcode numérico sequencial

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// POST with body-parser
app.use(bodyParser.urlencoded({ extended: false }))
//app.use("/api/shorturl", bodyParser.json());
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: 'URL missing'});
  }

  //URL validation
  const urlRegex = /^(http|https):\/\/([^ "]+)$/;
  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: 'Invalid URL' });
  }

  //Extract URL
  let hostname;
  try {
    hostname = new URL(originalUrl).hostname;
  } catch (e) {
    return res.json({ error: 'Invalid URL' });
  }

  //Verify hostname using dns
  dns.lookup(hostname, (err, address) => {
    if (err) {
      console.error(`DNS lookup failed for ${hostname}:`, err.message);
      return res.json({ error: "Invalid URL" });
    }
  });

  // Save URL to database
  const numericShortUrl = nextShortId;

  // Save URL using short url as key
  urlDatabase[numericShortUrl] = originalUrl;
  nextShortId++;
  
  res.json({ 
    original_url: originalUrl,
    short_url: numericShortUrl 
  });

});

//GET /api/shorturl/:shortcode
app.get("/api/shorturl/:shortcode", (req, res) => {
  // 1. Obtém o shortcode da URL
  const shortcode = req.params.shortcode;
  const shortcodeNumber = parseInt(shortcode);

  // Verify if shorcode is valid and if exists in database
  if (isNaN(shortcodeNumber) || !urlDatabase[shortcodeNumber]) {
      return res.status(404).json({ error: 'No short URL found for this code' });
  }

  // Load URL original
  const originalUrl = urlDatabase[shortcodeNumber];

  // Redirect to original URL
  res.redirect(originalUrl);
});
