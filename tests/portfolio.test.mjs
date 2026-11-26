import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { chromium } from 'playwright-core';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url, 'http://127.0.0.1');
      let pathname = decodeURIComponent(reqUrl.pathname);
      if (pathname === '/') pathname = '/index.html';

      const filePath = path.resolve(ROOT_DIR, `.${pathname}`);
      if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

describe('Portfolio standalone page', () => {
  let server;
  let baseUrl;
  let browser;

  before(async () => {
    const started = await startStaticServer();
    server = started.server;
    baseUrl = started.baseUrl;
    browser = await chromium.launch({
      executablePath: EDGE_PATH,
      headless: true,
    });
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  it('serves standalone index.html with inlined CSS, no Tailwind CDN, header links, and loaded cover/avatar images', async () => {
    const htmlPath = path.join(ROOT_DIR, 'index.html');
    assert.ok(fs.existsSync(htmlPath), 'index.html must exist at repo root');

    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.match(html, /<style>[\s\S]+<\/style>/, 'compiled CSS must be inlined in <style>');
    assert.doesNotMatch(html, /cdn\.tailwindcss\.com/, 'must not include Tailwind CDN runtime script');

    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);

      const header = page.locator('header');
      await header.waitFor({ state: 'visible' });
      const headerText = await header.innerText();
      assert.match(headerText, /Apimongkol Somjai/);
      for (const label of ['About', 'Experience', 'Certificates', 'Activities', 'Download CV']) {
        assert.match(headerText, new RegExp(label));
      }

      const cvHref = await header.getByRole('link', { name: /Download CV/i }).getAttribute('href');
      assert.equal(cvHref, './portfolio/Apimongkol-Somjai-CV.pdf');
      const cvRes = await page.request.get(`${baseUrl}/portfolio/Apimongkol-Somjai-CV.pdf`);
      assert.equal(cvRes.status(), 200);

      const images = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img')).map((img) => ({
          src: img.getAttribute('src'),
          complete: img.complete,
          naturalWidth: img.naturalWidth,
        }))
      );
      assert.ok(images.some((img) => img.src === './cover.jpg' && img.complete && img.naturalWidth > 0), 'cover.jpg must load');
      assert.ok(images.some((img) => img.src === './me.jpg' && img.complete && img.naturalWidth > 0), 'me.jpg must load');
    } finally {
      await page.close();
    }
  });

  it('renders left identity sidebar with About, Contact + Copy Email, and categorized Tools & Skills', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      const sidebar = page.locator('aside');
      await sidebar.waitFor({ state: 'visible' });
      const sidebarText = await sidebar.innerText();

      assert.match(sidebarText, /Apimongkol Somjai/);
      assert.match(sidebarText, /B\.B\.A\. Finance & Investment/);
      assert.match(sidebarText, /Ubon Ratchathani University/);
      assert.match(sidebarText, /Seeking Finance Internship/);
      assert.match(sidebarText, /Ubon Ratchathani, Thailand/);

      const emailLink = sidebar.locator('a[href="mailto:apimongkolsomjai.a@gmail.com"]');
      assert.equal(await emailLink.count(), 1);
      const phoneLink = sidebar.locator('a[href="tel:+66942513192"]');
      assert.equal(await phoneLink.count(), 1);

      const copyBtn = sidebar.getByRole('button', { name: /Copy/i });
      await copyBtn.click();
      await page.waitForFunction(
        () => document.querySelector('aside')?.innerText.includes('Copied'),
        null,
        { timeout: 2000 }
      );

      for (const skill of [
        'Microsoft Excel',
        'Power BI',
        'SQL',
        'IBM SPSS',
        'Microsoft PowerPoint',
        'Microsoft Word',
        'Financial Data Analysis',
        'Expense & Cost Analysis',
        'Managerial Accounting',
        'Problem Solving',
        'Time Management',
        'Adaptability',
      ]) {
        assert.match(sidebarText, new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      }
    } finally {
      await page.close();
    }
  });

  it('renders Professional Summary in right column and has zero horizontal overflow on desktop and mobile', async () => {
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 390, height: 844 },
    ]) {
      const page = await browser.newPage({ viewport });
      try {
        await page.goto(baseUrl, { waitUntil: 'networkidle' });

        const summaryHeading = page.getByRole('heading', { name: /Professional Summary/i });
        await summaryHeading.waitFor({ state: 'visible' });

        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        assert.ok(
          overflow.scrollWidth <= overflow.clientWidth,
          `Horizontal overflow at ${viewport.width}px: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}`
        );
      } finally {
        await page.close();
      }
    }
  });
});
