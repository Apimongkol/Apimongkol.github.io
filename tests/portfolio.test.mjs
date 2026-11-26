import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { chromium } from 'playwright-core';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const JUMP_LINKS = ['About', 'Experience', 'Projects', 'Certificates', 'Activities'];

const PDF_URLS = {
  cv: './portfolio/Apimongkol-Somjai-CV.pdf',
  microsoft: './portfolio/certificates/microsoft-certificates.pdf',
  dataAnalytics:
    './portfolio/certificates/Certificate%20of%20Achievement%20%E2%80%93%20%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20Data%20%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%84%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%AA%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B9%81%E0%B8%9A%E0%B8%9A%20Text-based%20%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B9%80%E0%B8%82%E0%B9%89%20(1).pdf',
  dataGovernance:
    './portfolio/certificates/Certificate%20of%20Achievement%20%E2%80%93%20Data%20Governance%20For%20People%20%E2%80%93%20%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20Data%20%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%84%E0%B8%AD.pdf',
  promptEngineering:
    './portfolio/certificates/Certificate%20of%20Achievement%20%E2%80%93%20Prompt%20Engineering%20%E2%80%93%20%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20Data%20%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%84%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%AA%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99.pdf',
};

const COMMON_LEARN_BASE = 'https://common-learn.com/certificate';
const VERIFY_URLS = {
  dataAnalytics: `${COMMON_LEARN_BASE}/certificate-of-achievement-cqk/`,
  dataGovernance: `${COMMON_LEARN_BASE}/certificate-of-achievement-data-governance-for-people-a0r/`,
  promptEngineering: `${COMMON_LEARN_BASE}/certificate-of-achievement-prompt-engineering-g5u/`,
};

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

  async function withPage(viewport, fn) {
    const page = await browser.newPage({ viewport });
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      return await fn(page);
    } finally {
      await page.close();
    }
  }

  async function assertNoHorizontalOverflow(page, label) {
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    assert.ok(
      overflow.scrollWidth <= overflow.clientWidth,
      `${label} horizontal overflow: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}`
    );
  }

  it('serves standalone index.html with inlined CSS, no Tailwind CDN, header links, and loaded cover/avatar images', async () => {
    const htmlPath = path.join(ROOT_DIR, 'index.html');
    assert.ok(fs.existsSync(htmlPath), 'index.html must exist at repo root');

    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.match(html, /<style>[\s\S]+<\/style>/, 'compiled CSS must be inlined in <style>');
    assert.doesNotMatch(html, /cdn\.tailwindcss\.com/, 'must not include Tailwind CDN runtime script');

    await withPage(DESKTOP_VIEWPORT, async (page) => {
      const header = page.locator('header');
      await header.waitFor({ state: 'visible' });
      const headerText = await header.innerText();
      assert.match(headerText, /Apimongkol Somjai/);
      for (const label of [...JUMP_LINKS, 'Download CV']) {
        assert.match(headerText, new RegExp(label));
      }

      const cvHref = await header.getByRole('link', { name: /Download CV/i }).getAttribute('href');
      assert.equal(cvHref, PDF_URLS.cv);
      const cvRes = await page.request.get(new URL(PDF_URLS.cv, baseUrl).toString());
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
    });
  });

  it('renders left identity sidebar with About, Contact + Copy Email, and categorized Tools & Skills', async () => {
    await withPage(DESKTOP_VIEWPORT, async (page) => {
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
    });
  });

  it('renders Professional Summary, visible jump links, and zero horizontal overflow on desktop and mobile', async () => {
    for (const viewport of [DESKTOP_VIEWPORT, MOBILE_VIEWPORT]) {
      await withPage(viewport, async (page) => {
        const summaryHeading = page.getByRole('heading', { name: /Professional Summary/i });
        await summaryHeading.waitFor({ state: 'visible' });

        const header = page.locator('header');
        for (const label of JUMP_LINKS) {
          assert.equal(
            await header.getByRole('link', { name: label }).isVisible(),
            true,
            `Jump link "${label}" must be visible at ${viewport.width}px`
          );
        }

        await assertNoHorizontalOverflow(page, `Viewport ${viewport.width}px`);
      });
    }
  });

  it('renders Work Experience card with both roles newest-first, dates, and responsibility bullets', async () => {
    await withPage(DESKTOP_VIEWPORT, async (page) => {
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
    });
  });

  it('renders Activities card with all three activities newest-first, dates, locations, and descriptions', async () => {
    await withPage(DESKTOP_VIEWPORT, async (page) => {
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
    });
  });

  it('renders Academic Projects card with DELTA Stock & Financial Analysis and opens its PDF deck in the modal', async () => {
    await withPage(DESKTOP_VIEWPORT, async (page) => {
      const section = page.locator('#projects');
      await section.waitFor({ state: 'visible' });

      const text = await section.innerText();
      assert.match(text, /Academic Projects/);
      assert.match(text, /DELTA Stock & Financial Analysis/);
      assert.match(text, /Financial Data Analysis/);
      assert.match(text, /Revenue Forecasting/);
      assert.match(text, /Investment Thesis/);

      const deltaUrl = './portfolio/academic-projects/delta/Delta.pdf';
      const res = await page.request.get(new URL(deltaUrl, baseUrl).toString());
      assert.equal(res.status(), 200, 'Expected HTTP 200 for Delta.pdf');

      const trigger = section.locator('[data-doc-trigger]');
      await trigger.click();

      const modal = page.locator('#pdf-modal');
      await modal.waitFor({ state: 'visible' });
      assert.equal(await modal.locator('#pdf-modal-title').innerText(), 'DELTA Stock & Financial Analysis');
      assert.equal(await modal.locator('iframe').getAttribute('src'), deltaUrl);
      assert.equal(await modal.locator('#pdf-modal-verify').isVisible(), false);

      await page.keyboard.press('Escape');
      await modal.waitFor({ state: 'hidden' });
    });
  });

  it('scrolls smoothly to Experience and Activities when clicking header jump links', async () => {
    await withPage({ width: 1280, height: 600 }, async (page) => {
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
    });
  });

  it('renders all four certificates and serves all five PDF documents with HTTP 200', async () => {
    await withPage(DESKTOP_VIEWPORT, async (page) => {
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

      for (const relUrl of Object.values(PDF_URLS)) {
        const res = await page.request.get(new URL(relUrl, baseUrl).toString());
        assert.equal(res.status(), 200, `Expected HTTP 200 for ${relUrl}`);
      }
    });
  });

  it('opens shared PDF preview modal for CV and certificates, enforces Verify Credential visibility, and restores focus/scroll on close', async () => {
    await withPage(DESKTOP_VIEWPORT, async (page) => {
      const modal = page.locator('#pdf-modal');
      assert.equal(await modal.getAttribute('role'), 'dialog');
      assert.equal(await modal.getAttribute('aria-modal'), 'true');
      assert.equal(await modal.isVisible(), false);

      const cases = [
        {
          name: /Preview \/ Download CV/i,
          title: 'Curriculum Vitae — Apimongkol Somjai',
          url: PDF_URLS.cv,
          verifyUrl: null,
          closeMethod: 'button',
        },
        {
          name: /Microsoft Excel Proficiency Assessment/i,
          title: 'Microsoft Excel Proficiency Assessment',
          url: PDF_URLS.microsoft,
          verifyUrl: null,
          closeMethod: 'backdrop',
        },
        {
          name: /Data Analytics For Business/i,
          title: 'Data Analytics For Business',
          url: PDF_URLS.dataAnalytics,
          verifyUrl: VERIFY_URLS.dataAnalytics,
          closeMethod: 'escape',
        },
        {
          name: /Data Governance For People/i,
          title: 'Data Governance For People',
          url: PDF_URLS.dataGovernance,
          verifyUrl: VERIFY_URLS.dataGovernance,
          closeMethod: 'button',
        },
        {
          name: /Prompt Engineering/i,
          title: 'Prompt Engineering',
          url: PDF_URLS.promptEngineering,
          verifyUrl: VERIFY_URLS.promptEngineering,
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
    });
  });

  it('omits empty Works/Projects placeholder, avoids emoji/pulsing/uppercase-label slop, and supports modal on mobile 390px', async () => {
    await withPage(MOBILE_VIEWPORT, async (page) => {
      const audit = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map((h) => ({
          text: h.innerText.trim(),
          textTransform: getComputedStyle(h).textTransform,
        }));
        const hasEmoji = /\p{Extended_Pictographic}/u.test(bodyText);
        const animatedEls = Array.from(document.querySelectorAll('*')).filter((el) => {
          const style = getComputedStyle(el);
          return style.animationName !== 'none' && style.animationIterationCount === 'infinite';
        }).length;
        return { bodyText, headings, hasEmoji, animatedEls };
      });

      assert.equal(audit.hasEmoji, false, 'Visible UI must not contain emoji characters');
      assert.equal(audit.animatedEls, 0, 'Visible UI must not use infinite pulsing/looping animations');
      for (const h of audit.headings) {
        assert.notEqual(h.textTransform, 'uppercase', `Heading "${h.text}" must use sentence case, not uppercase`);
        assert.doesNotMatch(h.text, /\b(Works|Projects|Coming Soon)\b/i, 'Must not render empty Works/Projects placeholder');
      }
      assert.doesNotMatch(audit.bodyText, /\bComing Soon\b/i, 'Must not render Coming Soon placeholder text');

      const trigger = page.locator('[data-doc-trigger]', { hasText: /Data Analytics For Business/i });
      await trigger.click();
      const modal = page.locator('#pdf-modal');
      await modal.waitFor({ state: 'visible' });

      assert.equal(await modal.getByRole('link', { name: /Open in New Tab/i }).isVisible(), true);
      assert.equal(await modal.getByRole('link', { name: /Download PDF/i }).isVisible(), true);
      assert.equal(await modal.locator('#pdf-modal-verify').isVisible(), true);

      await assertNoHorizontalOverflow(page, 'Mobile modal');

      await modal.getByRole('button', { name: /Close/i }).click();
      await modal.waitFor({ state: 'hidden' });
    });
  });
});
