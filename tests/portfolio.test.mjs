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

  it('renders Work Experience card with both roles newest-first, dates, and responsibility bullets', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      const section = page.locator('#experience');
      await section.waitFor({ state: 'visible' });

      const heading = section.getByRole('heading', { name: /Work Experience/i });
      await heading.waitFor({ state: 'visible' });

      const text = await section.innerText();
      const firstRole = 'Finance Assistant (Family-Owned Fuel Station)';
      const secondRole = 'Part-Time Server Restaurant';

      const firstIdx = text.indexOf(firstRole);
      const secondIdx = text.indexOf(secondRole);
      assert.ok(firstIdx !== -1, 'Expected Finance Assistant role to be rendered');
      assert.ok(secondIdx !== -1, 'Expected Part-Time Server Restaurant role to be rendered');
      assert.ok(firstIdx < secondIdx, 'Expected newest-first ordering (Finance Assistant before Part-Time Server)');

      assert.match(text, /2019\s*[–-]\s*Present/i);
      assert.match(text, /May 2023/);

      for (const bullet of [
        'Maintained accurate daily records of income, expenses, and cash flow.',
        'Monitored fuel and inventory levels and conducted regular stock checks.',
        'Updated daily fuel prices in line with business requirements and market conditions.',
        'Provided customer service and supported day-to-day station operations.',
        'Assisted with daily restaurant operations and collaborated with team members.',
        'Welcomed customers, assisted with menu selections, and responded to their requests.',
        'Served food and beverages and took customer orders accurately.',
      ]) {
        assert.match(text, new RegExp(bullet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      }
    } finally {
      await page.close();
    }
  });

  it('renders Activities card with all three activities newest-first, dates, locations, and descriptions', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      const section = page.locator('#activities');
      assert.equal(await section.isVisible(), true, 'Activities section must be visible');

      const heading = section.getByRole('heading', { name: /Activities/i });
      assert.equal(await heading.isVisible(), true, 'Activities heading must be visible');

      const text = await section.innerText();
      const firstTitle = 'Volunteer – 26th Education Fair';
      const secondTitle = 'Financial Study Tour';
      const thirdTitle = '19th Political Science Community Development';

      const firstIdx = text.indexOf(firstTitle);
      const secondIdx = text.indexOf(secondTitle);
      const thirdIdx = text.indexOf(thirdTitle);
      assert.ok(firstIdx !== -1, 'Expected Volunteer – 26th Education Fair');
      assert.ok(secondIdx !== -1, 'Expected Financial Study Tour');
      assert.ok(thirdIdx !== -1, 'Expected 19th Political Science Community Development');
      assert.ok(firstIdx < secondIdx && secondIdx < thirdIdx, 'Expected newest-first ordering (July 2024, May 2024, March 2023)');

      assert.match(text, /July 2024/);
      assert.match(text, /Supported event operations and coordinated information services for prospective students and visitors/);

      assert.match(text, /May 2024/);
      assert.match(text, /Bank of Thailand \(BOT\)/);
      assert.match(text, /Stock Exchange of Thailand \(SET\)/);

      assert.match(text, /March 2023/);
      assert.match(text, /Ban Samrong School, Ubon Ratchathani/);
    } finally {
      await page.close();
    }
  });

  it('scrolls smoothly to Experience and Activities when clicking header jump links', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 600 } });
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      const scrollBehavior = await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior
      );
      assert.equal(scrollBehavior, 'smooth');

      const header = page.locator('header');
      await header.getByRole('link', { name: 'Experience' }).click();
      await page.waitForFunction(
        () => {
          const el = document.getElementById('experience');
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          return window.scrollY > 0 && rect.top >= 40 && rect.top <= 140;
        },
        null,
        { timeout: 3000 }
      );

      await header.getByRole('link', { name: 'Activities' }).click();
      await page.waitForFunction(
        () => {
          const el = document.getElementById('activities');
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          return window.scrollY > 0 && rect.top >= 40 && rect.top < window.innerHeight;
        },
        null,
        { timeout: 3000 }
      );
    } finally {
      await page.close();
    }
  });

  it('renders all four certificates and serves all five PDF documents with HTTP 200', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      const certSection = page.locator('#certificates');
      await certSection.waitFor({ state: 'visible' });
      const certText = await certSection.innerText();

      assert.match(certText, /Microsoft Excel Proficiency Assessment/);
      assert.match(certText, /Faculty of Management Science, Ubon Ratchathani University/);
      assert.match(certText, /20 March 2026/);

      assert.match(certText, /Data Analytics For Business/);
      assert.match(certText, /Data Governance For People/);
      assert.match(certText, /Prompt Engineering/);
      assert.match(certText, /Common-learn/);

      const expectedPdfUrls = [
        './portfolio/Apimongkol-Somjai-CV.pdf',
        './portfolio/certificates/microsoft-certificates.pdf',
        './portfolio/certificates/Certificate%20of%20Achievement%20%E2%80%93%20%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20Data%20%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%84%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%AA%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B9%81%E0%B8%9A%E0%B8%9A%20Text-based%20%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B9%80%E0%B8%82%E0%B9%89%20(1).pdf',
        './portfolio/certificates/Certificate%20of%20Achievement%20%E2%80%93%20Data%20Governance%20For%20People%20%E2%80%93%20%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20Data%20%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%84%E0%B8%AD.pdf',
        './portfolio/certificates/Certificate%20of%20Achievement%20%E2%80%93%20Prompt%20Engineering%20%E2%80%93%20%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20Data%20%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%84%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%AA%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99.pdf',
      ];

      for (const relUrl of expectedPdfUrls) {
        const res = await page.request.get(new URL(relUrl, baseUrl).toString());
        assert.equal(res.status(), 200, `Expected HTTP 200 for ${relUrl}`);
      }
    } finally {
      await page.close();
    }
  });

  it('opens shared PDF preview modal for CV and certificates, enforces Verify Credential visibility, and restores focus/scroll on close', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      const modal = page.locator('#pdf-modal');
      assert.equal(await modal.getAttribute('role'), 'dialog');
      assert.equal(await modal.getAttribute('aria-modal'), 'true');
      assert.equal(await modal.isVisible(), false);

      const cases = [
        {
          name: /Preview \/ Download CV/i,
          title: 'Curriculum Vitae — Apimongkol Somjai',
          url: './portfolio/Apimongkol-Somjai-CV.pdf',
          verifyUrl: null,
          closeMethod: 'button',
        },
        {
          name: /Microsoft Excel Proficiency Assessment/i,
          title: 'Microsoft Excel Proficiency Assessment',
          url: './portfolio/certificates/microsoft-certificates.pdf',
          verifyUrl: null,
          closeMethod: 'backdrop',
        },
        {
          name: /Data Analytics For Business/i,
          title: 'Data Analytics For Business',
          url: './portfolio/certificates/Certificate%20of%20Achievement%20%E2%80%93%20%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20Data%20%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%84%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%AA%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B9%81%E0%B8%9A%E0%B8%9A%20Text-based%20%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B9%80%E0%B8%82%E0%B9%89%20(1).pdf',
          verifyUrl: 'https://common-learn.com/certificate/certificate-of-achievement-cqk/',
          closeMethod: 'escape',
        },
        {
          name: /Data Governance For People/i,
          title: 'Data Governance For People',
          url: './portfolio/certificates/Certificate%20of%20Achievement%20%E2%80%93%20Data%20Governance%20For%20People%20%E2%80%93%20%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20Data%20%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%84%E0%B8%AD.pdf',
          verifyUrl: 'https://common-learn.com/certificate/certificate-of-achievement-data-governance-for-people-a0r/',
          closeMethod: 'button',
        },
        {
          name: /Prompt Engineering/i,
          title: 'Prompt Engineering',
          url: './portfolio/certificates/Certificate%20of%20Achievement%20%E2%80%93%20Prompt%20Engineering%20%E2%80%93%20%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20Data%20%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%84%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%AA%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99.pdf',
          verifyUrl: 'https://common-learn.com/certificate/certificate-of-achievement-prompt-engineering-g5u/',
          closeMethod: 'escape',
        },
      ];

      for (const item of cases) {
        const trigger = page.locator('[data-doc-trigger]', { hasText: item.name });
        await trigger.focus();
        await trigger.click();

        await modal.waitFor({ state: 'visible' });
        assert.equal(await modal.locator('#pdf-modal-title').innerText(), item.title);
        assert.equal(await modal.locator('iframe').getAttribute('src'), item.url);

        const openLink = modal.getByRole('link', { name: /Open in New Tab/i });
        assert.equal(await openLink.getAttribute('href'), item.url);

        const downloadLink = modal.getByRole('link', { name: /Download/i });
        assert.equal(await downloadLink.getAttribute('href'), item.url);

        const verifyLink = modal.locator('#pdf-modal-verify');
        if (item.verifyUrl) {
          assert.equal(await verifyLink.isVisible(), true);
          assert.equal(await verifyLink.getAttribute('href'), item.verifyUrl);
        } else {
          assert.equal(await verifyLink.isVisible(), false);
        }

        const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
        assert.equal(bodyOverflow, 'hidden');

        if (item.closeMethod === 'button') {
          await modal.getByRole('button', { name: /Close/i }).click();
        } else if (item.closeMethod === 'backdrop') {
          await modal.click({ position: { x: 8, y: 8 } });
        } else {
          await page.keyboard.press('Escape');
        }

        await modal.waitFor({ state: 'hidden' });
        const iframeSrcAfterClose = await modal.locator('iframe').getAttribute('src');
        assert.ok(!iframeSrcAfterClose, 'iframe src must be cleared on close');

        const bodyOverflowAfter = await page.evaluate(() => getComputedStyle(document.body).overflow);
        assert.notEqual(bodyOverflowAfter, 'hidden');

        const focusRestored = await trigger.evaluate((el) => document.activeElement === el);
        assert.equal(focusRestored, true, `Focus must return to trigger for ${item.title}`);
      }
    } finally {
      await page.close();
    }
  });
});
