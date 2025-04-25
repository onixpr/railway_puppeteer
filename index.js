const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const data = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a')).map(a => a.href);
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText);
      return {
        title: document.title,
        url: window.location.href,
        html: document.documentElement.outerHTML,
        text: document.body.innerText,
        links,
        headings
      };
    });

    await browser.close();
    res.status(200).json(data);
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});