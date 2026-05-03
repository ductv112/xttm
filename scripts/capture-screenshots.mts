// scripts/capture-screenshots.mts
// Auto-capture screenshots cho kịch bản demo pilot.
// Chạy: npx tsx scripts/capture-screenshots.mts
//
// Strategy:
//   - Mở browser headed/headless với viewport 1920x1080
//   - Cho mỗi tài khoản: tạo fresh BrowserContext (sạch cookie) → login → chạy tất cả task của tài khoản đó
//   - Lưu screenshots vào docs/screenshots/<id>.png

import { chromium, type Page, type BrowserContext } from 'playwright';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

const BASE_URL = 'http://localhost:3000';
const VIEWPORT = { width: 1920, height: 1080 };
const SCREENSHOTS_DIR = path.resolve('docs/screenshots');

const ACCOUNTS = {
  admin: { username: 'admin', password: 'Admin@123' },
  banql: { username: 'banql', password: 'Banql@123' },
  chuyenvien: { username: 'chuyenvien', password: 'Cv@123' },
  hoidong: { username: 'hoidong', password: 'Hd@123' },
  lanhdao: { username: 'lanhdao', password: 'Ld@123' },
  taichinh: { username: 'taichinh', password: 'Tc@123' },
  donvi1: { username: 'donvi1', password: 'Donvi@123' },
  donvi2: { username: 'donvi2', password: 'Donvi@123' },
} as const;

type Account = keyof typeof ACCOUNTS;

type Capture = {
  id: string; // tên file (không kèm .png)
  account: Account;
  /** Hành động navigate + setup. Trả về element selector nếu muốn screenshot 1 vùng cụ thể (default: full page). */
  run: (page: Page, ctx: { sampleProjectId: string | null }) => Promise<void>;
  /** Optional element selector — nếu set thì screenshot element đó thay vì full page. */
  element?: string;
  /** Optional: nếu fullPage=false thì chỉ chụp viewport hiện tại. Default true. */
  fullPage?: boolean;
};

async function login(page: Page, account: Account): Promise<void> {
  const { username, password } = ACCOUNTS[account];
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15_000,
  });
  await page.waitForLoadState('networkidle');
}

async function captureScreenshot(
  page: Page,
  capture: Capture,
): Promise<void> {
  const filepath = path.join(SCREENSHOTS_DIR, `${capture.id}.png`);
  await page.waitForTimeout(500); // animations settle
  if (capture.element) {
    const locator = page.locator(capture.element).first();
    await locator.screenshot({ path: filepath });
  } else {
    await page.screenshot({
      path: filepath,
      fullPage: capture.fullPage ?? true,
    });
  }
  console.log(`  ✓ ${capture.id}.png`);
}

/**
 * Discover một project id mẫu để screenshot detail pages.
 * Dùng admin /de-an master list, lấy href đầu tiên dạng /de-an/[id].
 */
async function findSampleProjectId(page: Page): Promise<string | null> {
  await page.goto(`${BASE_URL}/de-an`, { waitUntil: 'networkidle' });
  const href = await page.locator('a[href^="/de-an/"]').first().getAttribute('href');
  if (!href) return null;
  const match = href.match(/^\/de-an\/([^/?#]+)/);
  return match?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Capture entries — 51 ảnh
// ---------------------------------------------------------------------------

const CAPTURES: Capture[] = [
  // ===== PHẦN A — Khởi tạo chu kỳ (banql) =====
  {
    id: 'a1-chu-ky-list',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/chuong-trinh`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'a2-form-tao-chu-ky',
    account: 'banql',
    run: async (page) => {
      // Cố gắng mở dialog/page tạo chu kỳ; fallback: chụp /chuong-trinh/new
      await page.goto(`${BASE_URL}/chuong-trinh/new`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'a3-1-moc-thoi-gian',
    account: 'banql',
    run: async (page, ctx) => {
      // Mở chu kỳ đầu tiên
      await page.goto(`${BASE_URL}/chuong-trinh`, {
        waitUntil: 'networkidle',
      });
      const link = page.locator('a[href^="/chuong-trinh/"]').first();
      const href = await link.getAttribute('href');
      if (href) {
        await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
        // Click tab Mốc thời gian nếu có
        const tab = page
          .locator('[role="tab"], button')
          .filter({ hasText: /Mốc thời gian|Thời gian/i })
          .first();
        if ((await tab.count()) > 0) await tab.click().catch(() => {});
      }
      ctx.sampleProjectId = ctx.sampleProjectId; // noop ref
    },
  },
  {
    id: 'a3-2-tieu-chi',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/chuong-trinh`, {
        waitUntil: 'networkidle',
      });
      const link = page.locator('a[href^="/chuong-trinh/"]').first();
      const href = await link.getAttribute('href');
      if (href) {
        await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
        const tab = page
          .locator('[role="tab"], button')
          .filter({ hasText: /Tiêu chí/i })
          .first();
        if ((await tab.count()) > 0) await tab.click().catch(() => {});
      }
    },
  },
  {
    id: 'a3-3-don-vi-moi',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/chuong-trinh`, {
        waitUntil: 'networkidle',
      });
      const link = page.locator('a[href^="/chuong-trinh/"]').first();
      const href = await link.getAttribute('href');
      if (href) {
        await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
        const tab = page
          .locator('[role="tab"], button')
          .filter({ hasText: /Đơn vị|mời/i })
          .first();
        if ((await tab.count()) > 0) await tab.click().catch(() => {});
      }
    },
  },
  {
    id: 'a4-1-mo-dang-ky',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/chuong-trinh`, {
        waitUntil: 'networkidle',
      });
      const link = page.locator('a[href^="/chuong-trinh/"]').first();
      const href = await link.getAttribute('href');
      if (href) {
        await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
      }
    },
  },
  {
    id: 'a4-2-composer-email',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/chuong-trinh`, {
        waitUntil: 'networkidle',
      });
      const link = page.locator('a[href^="/chuong-trinh/"]').first();
      const href = await link.getAttribute('href');
      if (href) {
        await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
      }
    },
  },
  {
    id: 'a4-3-lich-su-email',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/chuong-trinh`, {
        waitUntil: 'networkidle',
      });
      const link = page.locator('a[href^="/chuong-trinh/"]').first();
      const href = await link.getAttribute('href');
      if (href) {
        await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
      }
    },
  },

  // ===== PHẦN B — Đơn vị nộp đề án (donvi1) =====
  {
    id: 'b1-ho-so-don-vi',
    account: 'donvi1',
    run: async (page) => {
      await page.goto(`${BASE_URL}/don-vi-cua-toi`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'b2-1-wizard-buoc-1',
    account: 'donvi1',
    run: async (page) => {
      await page.goto(`${BASE_URL}/de-an/new`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'b2-2-wizard-du-toan',
    account: 'donvi1',
    run: async (page) => {
      await page.goto(`${BASE_URL}/de-an/new`, {
        waitUntil: 'networkidle',
      });
      // Cố click step "Dự toán" ở stepper
      const tab = page
        .locator('[role="tab"], button')
        .filter({ hasText: /Dự toán/i })
        .first();
      if ((await tab.count()) > 0) await tab.click().catch(() => {});
    },
  },
  {
    id: 'b2-3-wizard-tai-lieu',
    account: 'donvi1',
    run: async (page) => {
      await page.goto(`${BASE_URL}/de-an/new`, {
        waitUntil: 'networkidle',
      });
      const tab = page
        .locator('[role="tab"], button')
        .filter({ hasText: /Tài liệu/i })
        .first();
      if ((await tab.count()) > 0) await tab.click().catch(() => {});
    },
  },
  {
    id: 'b3-1-dialog-nop',
    account: 'donvi1',
    run: async (page) => {
      // Mở 1 đề án DRAFT của donvi1 nếu có
      await page.goto(`${BASE_URL}/de-an`, { waitUntil: 'networkidle' });
      const draftLink = page.locator('a[href^="/de-an/"]').first();
      const href = await draftLink.getAttribute('href').catch(() => null);
      if (href) {
        await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
      }
    },
  },
  {
    id: 'b3-2-da-nop',
    account: 'donvi1',
    run: async (page) => {
      await page.goto(`${BASE_URL}/de-an`, { waitUntil: 'networkidle' });
    },
  },

  // ===== PHẦN C — Tiếp nhận & kiểm tra =====
  {
    id: 'c1-1-tiep-nhan-queue',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/tiep-nhan`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'c1-2-bulk-receive',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/tiep-nhan`, {
        waitUntil: 'networkidle',
      });
      // Tick 1-2 checkbox đầu tiên trong bảng để hiện bulk action bar
      const checkboxes = page.locator('table tbody tr [role="checkbox"]');
      const count = await checkboxes.count();
      const tickCount = Math.min(2, count);
      for (let i = 0; i < tickCount; i++) {
        await checkboxes.nth(i).click().catch(() => {});
      }
    },
  },
  {
    id: 'c2-1-modal-phan-cong',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/phan-cong`, {
        waitUntil: 'networkidle',
      });
      // Cố gắng mở modal phân công nếu có nút
      const btn = page
        .locator('button')
        .filter({ hasText: /Phân công/i })
        .first();
      if ((await btn.count()) > 0)
        await btn.click({ timeout: 3000 }).catch(() => {});
    },
  },
  {
    id: 'c2-2-da-phan-cong',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/phan-cong`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'c3-1-checklist',
    account: 'chuyenvien',
    run: async (page) => {
      await page.goto(`${BASE_URL}/kiem-tra`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'c3-2-ket-luan-hop-le',
    account: 'chuyenvien',
    run: async (page) => {
      await page.goto(`${BASE_URL}/kiem-tra`, {
        waitUntil: 'networkidle',
      });
      const row = page.locator('table tbody tr').first();
      if ((await row.count()) > 0) {
        await row.click().catch(() => {});
        await page.waitForLoadState('networkidle');
      }
    },
  },
  {
    id: 'c4-1-cham-diem-queue',
    account: 'chuyenvien',
    run: async (page) => {
      await page.goto(`${BASE_URL}/kiem-tra#cham-diem`, {
        waitUntil: 'networkidle',
      });
      // Click tab Chấm điểm
      const tab = page
        .locator('[role="tab"]')
        .filter({ hasText: /Chấm điểm/i })
        .first();
      if ((await tab.count()) > 0) await tab.click().catch(() => {});
    },
  },
  {
    id: 'c4-2-form-cham-diem',
    account: 'chuyenvien',
    run: async (page) => {
      await page.goto(`${BASE_URL}/kiem-tra#cham-diem`, {
        waitUntil: 'networkidle',
      });
      const tab = page
        .locator('[role="tab"]')
        .filter({ hasText: /Chấm điểm/i })
        .first();
      if ((await tab.count()) > 0) await tab.click().catch(() => {});
      const row = page.locator('table tbody tr').first();
      if ((await row.count()) > 0) {
        await row.click().catch(() => {});
        await page.waitForLoadState('networkidle');
      }
    },
  },

  // ===== PHẦN D — Thẩm định & phê duyệt =====
  {
    id: 'd1-1-tao-hoi-dong',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/hoi-dong`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'd1-2-phan-cong-de-an',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/hoi-dong`, {
        waitUntil: 'networkidle',
      });
      const link = page.locator('a[href^="/hoi-dong/"]').first();
      const href = await link.getAttribute('href').catch(() => null);
      if (href) {
        await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
      }
    },
  },
  {
    id: 'd2-1-tham-dinh-queue',
    account: 'hoidong',
    run: async (page) => {
      await page.goto(`${BASE_URL}/tham-dinh`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'd2-2-form-hoi-dong',
    account: 'hoidong',
    run: async (page) => {
      await page.goto(`${BASE_URL}/tham-dinh`, {
        waitUntil: 'networkidle',
      });
      const row = page.locator('table tbody tr').first();
      if ((await row.count()) > 0) {
        await row.click().catch(() => {});
        await page.waitForLoadState('networkidle');
      }
    },
  },
  {
    id: 'd3-tong-hop-tro-trinh',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/phe-duyet`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'd4-1-ky-quyet-dinh',
    account: 'lanhdao',
    run: async (page) => {
      await page.goto(`${BASE_URL}/phe-duyet`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'd4-2-pdf-quyet-dinh',
    account: 'lanhdao',
    run: async (page) => {
      await page.goto(`${BASE_URL}/phe-duyet`, {
        waitUntil: 'networkidle',
      });
      const row = page.locator('table tbody tr').first();
      if ((await row.count()) > 0) {
        await row.click().catch(() => {});
        await page.waitForLoadState('networkidle');
      }
    },
  },

  // ===== PHẦN E — Hợp đồng & triển khai =====
  {
    id: 'e1-1-sinh-hd',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/hop-dong`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'e1-2-upload-scan',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/hop-dong`, {
        waitUntil: 'networkidle',
      });
      const row = page.locator('table tbody tr').first();
      if ((await row.count()) > 0) {
        await row.click().catch(() => {});
        await page.waitForLoadState('networkidle');
      }
    },
  },
  {
    id: 'e2-1-trien-khai',
    account: 'donvi1',
    run: async (page, ctx) => {
      const id = ctx.sampleProjectId;
      if (id) {
        await page.goto(`${BASE_URL}/de-an/${id}#trien-khai`, {
          waitUntil: 'networkidle',
        });
      } else {
        await page.goto(`${BASE_URL}/de-an`, { waitUntil: 'networkidle' });
      }
    },
  },
  {
    id: 'e2-2-thuong-vu',
    account: 'donvi1',
    run: async (page, ctx) => {
      const id = ctx.sampleProjectId;
      if (id) {
        await page.goto(`${BASE_URL}/de-an/${id}#trien-khai`, {
          waitUntil: 'networkidle',
        });
      } else {
        await page.goto(`${BASE_URL}/de-an`, { waitUntil: 'networkidle' });
      }
    },
  },
  {
    id: 'e3-1-form-tam-ung',
    account: 'taichinh',
    run: async (page) => {
      await page.goto(`${BASE_URL}/tai-chinh`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'e3-2-da-giai-ngan',
    account: 'taichinh',
    run: async (page) => {
      await page.goto(`${BASE_URL}/tai-chinh`, {
        waitUntil: 'networkidle',
      });
    },
  },

  // ===== PHẦN F — Báo cáo & nghiệm thu =====
  {
    id: 'f1-1-form-bao-cao',
    account: 'donvi1',
    run: async (page) => {
      await page.goto(`${BASE_URL}/viec-can-lam`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'f1-2-da-nop-bao-cao',
    account: 'donvi1',
    run: async (page, ctx) => {
      const id = ctx.sampleProjectId;
      if (id) {
        await page.goto(`${BASE_URL}/de-an/${id}#bao-cao`, {
          waitUntil: 'networkidle',
        });
      } else {
        await page.goto(`${BASE_URL}/de-an`, { waitUntil: 'networkidle' });
      }
    },
  },
  {
    id: 'f2-1-queue-bao-cao',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/bao-cao`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'f2-2-duyet-bao-cao',
    account: 'banql',
    run: async (page, ctx) => {
      const id = ctx.sampleProjectId;
      if (id) {
        await page.goto(`${BASE_URL}/de-an/${id}#bao-cao`, {
          waitUntil: 'networkidle',
        });
      } else {
        await page.goto(`${BASE_URL}/bao-cao`, { waitUntil: 'networkidle' });
      }
    },
  },
  {
    id: 'f3-1-form-bb-nghiem-thu',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/nghiem-thu`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'f3-2-pdf-bb',
    account: 'banql',
    run: async (page, ctx) => {
      const id = ctx.sampleProjectId;
      if (id) {
        await page.goto(`${BASE_URL}/de-an/${id}#nghiem-thu`, {
          waitUntil: 'networkidle',
        });
      } else {
        await page.goto(`${BASE_URL}/nghiem-thu`, {
          waitUntil: 'networkidle',
        });
      }
    },
  },
  {
    id: 'f4-thanh-ly-hd',
    account: 'banql',
    run: async (page) => {
      await page.goto(`${BASE_URL}/nghiem-thu`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'f5-1-thanh-toan',
    account: 'taichinh',
    run: async (page) => {
      await page.goto(`${BASE_URL}/tai-chinh`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'f5-2-quyet-toan',
    account: 'taichinh',
    run: async (page) => {
      await page.goto(`${BASE_URL}/tai-chinh`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'f5-3-dashboard-tai-chinh',
    account: 'taichinh',
    run: async (page) => {
      await page.goto(`${BASE_URL}/dashboard`, {
        waitUntil: 'networkidle',
      });
    },
  },

  // ===== PHẦN G — Demo phụ trợ =====
  {
    id: 'g1-1-donvi2-de-an',
    account: 'donvi2',
    run: async (page) => {
      await page.goto(`${BASE_URL}/de-an`, { waitUntil: 'networkidle' });
    },
  },
  {
    id: 'g1-2-url-blocked',
    account: 'donvi2',
    run: async (page, ctx) => {
      // Truy cập URL của đề án không thuộc donvi2 → kỳ vọng redirect/empty
      const id = ctx.sampleProjectId;
      if (id) {
        await page.goto(`${BASE_URL}/de-an/${id}`, {
          waitUntil: 'networkidle',
        });
      } else {
        await page.goto(`${BASE_URL}/de-an`, { waitUntil: 'networkidle' });
      }
    },
  },
  {
    id: 'g2-1-ma-tran-quyen',
    account: 'admin',
    run: async (page) => {
      await page.goto(`${BASE_URL}/vai-tro`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'g2-2-confirm-diff',
    account: 'admin',
    run: async (page) => {
      await page.goto(`${BASE_URL}/vai-tro`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'g3-1-audit-log',
    account: 'admin',
    run: async (page) => {
      await page.goto(`${BASE_URL}/nhat-ky`, {
        waitUntil: 'networkidle',
      });
    },
  },
  {
    id: 'g3-2-audit-detail',
    account: 'admin',
    run: async (page) => {
      await page.goto(`${BASE_URL}/nhat-ky`, {
        waitUntil: 'networkidle',
      });
      const row = page.locator('table tbody tr').first();
      if ((await row.count()) > 0) {
        await row.click().catch(() => {});
        await page.waitForTimeout(800);
      }
    },
  },

  // ===== PHẦN H — Dashboard tổng hợp =====
  {
    id: 'h-dashboard-lanhdao',
    account: 'lanhdao',
    run: async (page) => {
      await page.goto(`${BASE_URL}/dashboard`, {
        waitUntil: 'networkidle',
      });
    },
  },
];

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

async function main() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  console.log(
    `Capturing ${CAPTURES.length} screenshots to ${SCREENSHOTS_DIR}\n`,
  );

  const browser = await chromium.launch({ headless: true });

  // Group captures by account để minimize re-login
  const byAccount = new Map<Account, Capture[]>();
  for (const c of CAPTURES) {
    if (!byAccount.has(c.account)) byAccount.set(c.account, []);
    byAccount.get(c.account)!.push(c);
  }

  // Discover sample project id once với admin
  let sampleProjectId: string | null = null;
  {
    const ctx = await browser.newContext({ viewport: VIEWPORT });
    const page = await ctx.newPage();
    try {
      await login(page, 'admin');
      sampleProjectId = await findSampleProjectId(page);
      console.log(`Sample project id: ${sampleProjectId ?? '(none)'}\n`);
    } catch (e) {
      console.warn(`  ! Failed to discover sample project id: ${e}`);
    }
    await ctx.close();
  }

  const results: { ok: number; fail: number; failures: string[] } = {
    ok: 0,
    fail: 0,
    failures: [],
  };

  for (const [account, captures] of byAccount) {
    console.log(`\n=== Account: ${account} (${captures.length} ảnh) ===`);
    const ctx: BrowserContext = await browser.newContext({
      viewport: VIEWPORT,
    });
    const page = await ctx.newPage();
    try {
      await login(page, account);
    } catch (err) {
      console.error(`  ! Login failed for ${account}:`, err);
      await ctx.close();
      results.fail += captures.length;
      results.failures.push(...captures.map((c) => c.id));
      continue;
    }

    for (const capture of captures) {
      try {
        await capture.run(page, { sampleProjectId });
        await captureScreenshot(page, capture);
        results.ok++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  ! ${capture.id} failed: ${msg.slice(0, 100)}`);
        results.fail++;
        results.failures.push(capture.id);
        // Reset to a safe page in case current page is broken
        await page
          .goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
          .catch(() => {});
      }
    }

    await ctx.close();
  }

  await browser.close();

  console.log(
    `\n=== Summary ===\n  ✓ Captured: ${results.ok}\n  ✗ Failed:   ${results.fail}`,
  );
  if (results.failures.length > 0) {
    console.log(`  Failed IDs: ${results.failures.join(', ')}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
