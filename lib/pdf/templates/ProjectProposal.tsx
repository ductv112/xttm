import * as React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Circle,
  Path,
} from '@react-pdf/renderer';

/**
 * Project Proposal PDF template — chuẩn công văn nhà nước Việt Nam.
 *
 * Layout (A4 portrait):
 * - Header 2-column: Bộ CT + Cục XTTM (left) | CHXHCNVN + Độc lập-Tự do-Hạnh phúc (right)
 * - Title: "ĐỀ ÁN XÚC TIẾN THƯƠNG MẠI QUỐC GIA NĂM <YEAR>"
 * - Subtitle: tên đề án (bold italic)
 * - Section I: Thông tin chung (đơn vị, năm, kind, ngành hàng, thị trường, etc.)
 * - Section II: Mục tiêu và nội dung (Tiptap HTML render thành plain text)
 * - Section III: Kế hoạch triển khai (bảng từ planJson)
 * - Section IV: Dự toán kinh phí (bảng từ budgetJson với 3 totals)
 * - Section V: Chủ nhiệm đề án (contact snapshot)
 * - Footer: ngày tháng năm + signature block (đại diện đơn vị) + dấu mộc placeholder SVG
 * - Watermark: "BẢN MẪU" diagonal red khi status !== APPROVED
 *
 * Font: Be Vietnam Pro (registered qua lib/pdf/fonts.ts).
 *
 * Pitfall mitigation (R1 Vietnamese diacritics): chỉ static TTF, no variable fonts,
 * registerHyphenationCallback identity để giữ từ tiếng Việt nguyên vẹn khi line wrap.
 */

export type ProjectProposalProps = {
  /** Mã đề án */
  projectCode: string;
  /** Tên đề án */
  projectName: string;
  /** Năm đề án */
  projectYear: number;
  /** Loại đề án (đã localize, vd "Triển lãm xuất khẩu") */
  projectKindLabel: string;
  /** Trạng thái — quyết định có watermark không (APPROVED = không watermark) */
  projectStatus: string;
  /** Tên đơn vị chủ trì */
  organizationName: string;
  /** Tên chu kỳ chương trình XTTM */
  programCycleName: string;
  /** Năm chu kỳ */
  programCycleYear: number;
  /** Ngành hàng (đã resolve tên) */
  industrySectorNames: string[];
  /** Thị trường (đã resolve tên) */
  marketNames: string[];
  /** Quốc gia (đã resolve tên) */
  countryNames: string[];
  /** Loại hình XTTM (đã resolve tên) */
  promotionTypeNames: string[];
  /** Khoảng thời gian thực hiện (đã format) */
  timeRangeLabel: string;
  /** Mục tiêu (Tiptap HTML — sẽ strip về plain text trong template) */
  objectiveHtml: string;
  /** Nội dung (Tiptap HTML — sẽ strip về plain text) */
  contentHtml: string;
  /** Plan rows */
  planRows: Array<{
    task: string;
    deliverable?: string;
    dueDate?: string | null;
    owner?: string;
  }>;
  /** Budget rows */
  budgetRows: Array<{
    item: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    amount?: number;
    source?: 'STATE' | 'SELF';
    note?: string;
  }>;
  /** Tổng nhà nước */
  totalState: number;
  /** Tổng đối ứng */
  totalSelf: number;
  /** Tổng cộng */
  totalAll: number;
  /** Chủ nhiệm đề án snapshot */
  pmContact: {
    name: string;
    title: string;
    role: string;
    email: string;
    phone: string;
  } | null;
  /** Ngày sinh PDF (default = now) */
  exportedAt?: Date;
  /** Watermark text — empty string để tắt */
  watermark?: string;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 11,
    padding: 40,
    paddingBottom: 60,
    color: '#0f172a',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 80,
    color: 'rgba(220, 38, 38, 0.12)',
    fontWeight: 'bold',
    transform: 'rotate(-30deg)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerCol: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '48%',
  },
  headerLine: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubLine: {
    fontSize: 11,
    textAlign: 'center',
  },
  separator: {
    width: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    marginTop: 4,
    marginBottom: 4,
  },
  documentNumber: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  titleBlock: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  titleMain: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  titleSub: {
    fontSize: 13,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.5,
    textAlign: 'justify',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 130,
    fontSize: 11,
    color: '#475569',
  },
  infoValue: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 6,
    marginBottom: 8,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: '#0f172a',
    borderLeftColor: '#0f172a',
  },
  tr: {
    flexDirection: 'row',
  },
  thead: {
    backgroundColor: '#f1f5f9',
  },
  th: {
    fontSize: 10,
    fontWeight: 'bold',
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: '#0f172a',
    borderBottomColor: '#0f172a',
  },
  td: {
    fontSize: 10,
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: '#0f172a',
    borderBottomColor: '#0f172a',
  },
  tdRight: {
    textAlign: 'right',
  },
  tdCenter: {
    textAlign: 'center',
  },
  tfootBold: {
    fontWeight: 'bold',
    backgroundColor: '#f8fafc',
  },
  signatureBlock: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureBox: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '50%',
    position: 'relative',
  },
  signDate: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 6,
  },
  signTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  signSpace: {
    height: 70,
  },
  signName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stampWrap: {
    position: 'absolute',
    top: 28,
    right: -10,
    width: 90,
    height: 90,
    opacity: 0.7,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#94a3b8',
  },
});

/**
 * Strip Tiptap HTML output to plain text for react-pdf <Text>.
 * Preserves paragraph breaks (<p>/<br>) as newlines, drops other tags.
 */
function htmlToPlain(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatVietnameseDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `Hà Nội, ngày ${day} tháng ${month} năm ${year}`;
}

function formatNumber(n: number | undefined): string {
  if (typeof n !== 'number' || !isFinite(n)) return '';
  return n.toLocaleString('vi-VN');
}

/**
 * Decorative circular stamp (dấu mộc placeholder) — red SVG octagon-circle với
 * text "ĐƠN VỊ CHỦ TRÌ" + ngôi sao 5 cánh ở giữa. Pure SVG, không cần raster image.
 */
function StampPlaceholder() {
  return (
    <Svg viewBox="0 0 100 100" style={styles.stampWrap}>
      <Circle cx="50" cy="50" r="45" stroke="#dc2626" strokeWidth="2" fill="none" />
      <Circle cx="50" cy="50" r="38" stroke="#dc2626" strokeWidth="1" fill="none" />
      {/* Ngôi sao 5 cánh */}
      <Path
        d="M50 32 L54 44 L67 44 L57 52 L60 64 L50 56 L40 64 L43 52 L33 44 L46 44 Z"
        fill="#dc2626"
      />
    </Svg>
  );
}

export function ProjectProposal(props: ProjectProposalProps) {
  const exportedAt = props.exportedAt ?? new Date();
  const watermark =
    props.watermark !== undefined
      ? props.watermark
      : props.projectStatus === 'APPROVED'
        ? ''
        : 'BẢN MẪU';
  const dateStr = formatVietnameseDate(exportedAt);
  const objectiveText = htmlToPlain(props.objectiveHtml);
  const contentText = htmlToPlain(props.contentHtml);

  // Column widths (sum should approx 100%)
  const planCols = ['8%', '38%', '24%', '14%', '16%'] as const;
  const budgetCols = ['6%', '32%', '8%', '8%', '14%', '14%', '10%', '8%'] as const;
  // Pre-computed column-span widths for tfoot rows (to avoid noUncheckedIndexedAccess pain)
  const budgetLeftSpan = '68%'; // sum cols 0..4 = 6+32+8+8+14
  const budgetRightSpan = '18%'; // sum cols 6..7 = 10+8

  return (
    <Document
      title={`Đề án ${props.projectCode}`}
      author={props.organizationName}
      creator="XTTMQG POC"
    >
      <Page size="A4" style={styles.page}>
        {watermark ? (
          <Text style={styles.watermark} fixed>
            {watermark}
          </Text>
        ) : null}

        {/* Header 2-column */}
        <View style={styles.headerRow}>
          <View style={styles.headerCol}>
            <Text style={styles.headerLine}>BỘ CÔNG THƯƠNG</Text>
            <Text style={styles.headerLine}>CỤC XÚC TIẾN THƯƠNG MẠI</Text>
            <View style={styles.separator} />
            <Text style={styles.documentNumber}>
              CT XTTM năm {props.programCycleYear}
            </Text>
          </View>
          <View style={styles.headerCol}>
            <Text style={styles.headerLine}>
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </Text>
            <Text style={styles.headerSubLine}>Độc lập - Tự do - Hạnh phúc</Text>
            <View style={styles.separator} />
            <Text style={[styles.headerSubLine, { fontStyle: 'italic' }]}>
              {dateStr}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.titleMain}>
            ĐỀ ÁN XÚC TIẾN THƯƠNG MẠI QUỐC GIA NĂM {props.projectYear}
          </Text>
          <Text style={styles.titleSub}>{props.projectName}</Text>
          <Text style={[styles.headerSubLine, { marginTop: 6 }]}>
            (Mã đề án: {props.projectCode})
          </Text>
        </View>

        {/* Section I: Thông tin chung */}
        <Text style={styles.sectionHeader}>I. Thông tin chung</Text>
        <View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Đơn vị chủ trì:</Text>
            <Text style={styles.infoValue}>{props.organizationName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tên đề án:</Text>
            <Text style={styles.infoValue}>{props.projectName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Năm đề án:</Text>
            <Text style={styles.infoValue}>{props.projectYear}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Loại đề án:</Text>
            <Text style={styles.infoValue}>{props.projectKindLabel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chu kỳ chương trình:</Text>
            <Text style={styles.infoValue}>{props.programCycleName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thời gian thực hiện:</Text>
            <Text style={styles.infoValue}>{props.timeRangeLabel}</Text>
          </View>
          {props.industrySectorNames.length > 0 ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngành hàng:</Text>
              <Text style={styles.infoValue}>
                {props.industrySectorNames.join('; ')}
              </Text>
            </View>
          ) : null}
          {props.marketNames.length > 0 ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thị trường:</Text>
              <Text style={styles.infoValue}>{props.marketNames.join('; ')}</Text>
            </View>
          ) : null}
          {props.countryNames.length > 0 ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Quốc gia:</Text>
              <Text style={styles.infoValue}>{props.countryNames.join('; ')}</Text>
            </View>
          ) : null}
          {props.promotionTypeNames.length > 0 ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Loại hình XTTM:</Text>
              <Text style={styles.infoValue}>
                {props.promotionTypeNames.join('; ')}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Section II: Mục tiêu và nội dung */}
        <Text style={styles.sectionHeader}>II. Mục tiêu và nội dung</Text>
        {objectiveText ? (
          <>
            <Text style={[styles.paragraph, { fontWeight: 'bold' }]}>
              1. Mục tiêu:
            </Text>
            <Text style={styles.paragraph}>{objectiveText}</Text>
          </>
        ) : null}
        {contentText ? (
          <>
            <Text style={[styles.paragraph, { fontWeight: 'bold' }]}>
              2. Nội dung chính:
            </Text>
            <Text style={styles.paragraph}>{contentText}</Text>
          </>
        ) : null}
        {!objectiveText && !contentText ? (
          <Text style={[styles.paragraph, { fontStyle: 'italic', color: '#94a3b8' }]}>
            (Chưa khai báo mục tiêu và nội dung)
          </Text>
        ) : null}

        {/* Section III: Kế hoạch triển khai */}
        <Text style={styles.sectionHeader}>III. Kế hoạch triển khai</Text>
        {props.planRows.length === 0 ? (
          <Text style={[styles.paragraph, { fontStyle: 'italic', color: '#94a3b8' }]}>
            (Chưa khai báo kế hoạch chi tiết)
          </Text>
        ) : (
          <View style={styles.table}>
            <View style={[styles.tr, styles.thead]}>
              <Text style={[styles.th, styles.tdCenter, { width: planCols[0] }]}>STT</Text>
              <Text style={[styles.th, { width: planCols[1] }]}>Hạng mục công việc</Text>
              <Text style={[styles.th, { width: planCols[2] }]}>Sản phẩm bàn giao</Text>
              <Text style={[styles.th, styles.tdCenter, { width: planCols[3] }]}>Hạn</Text>
              <Text style={[styles.th, { width: planCols[4] }]}>Phụ trách</Text>
            </View>
            {props.planRows.map((r, idx) => (
              <View key={idx} style={styles.tr}>
                <Text style={[styles.td, styles.tdCenter, { width: planCols[0] }]}>
                  {idx + 1}
                </Text>
                <Text style={[styles.td, { width: planCols[1] }]}>{r.task}</Text>
                <Text style={[styles.td, { width: planCols[2] }]}>
                  {r.deliverable ?? ''}
                </Text>
                <Text style={[styles.td, styles.tdCenter, { width: planCols[3] }]}>
                  {r.dueDate ?? ''}
                </Text>
                <Text style={[styles.td, { width: planCols[4] }]}>
                  {r.owner ?? ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Section IV: Dự toán kinh phí */}
        <Text style={styles.sectionHeader}>IV. Dự toán kinh phí</Text>
        {props.budgetRows.length === 0 ? (
          <Text style={[styles.paragraph, { fontStyle: 'italic', color: '#94a3b8' }]}>
            (Chưa khai báo dự toán)
          </Text>
        ) : (
          <View style={styles.table}>
            <View style={[styles.tr, styles.thead]}>
              <Text style={[styles.th, styles.tdCenter, { width: budgetCols[0] }]}>STT</Text>
              <Text style={[styles.th, { width: budgetCols[1] }]}>Hạng mục</Text>
              <Text style={[styles.th, styles.tdCenter, { width: budgetCols[2] }]}>ĐVT</Text>
              <Text style={[styles.th, styles.tdRight, { width: budgetCols[3] }]}>SL</Text>
              <Text style={[styles.th, styles.tdRight, { width: budgetCols[4] }]}>Đơn giá</Text>
              <Text style={[styles.th, styles.tdRight, { width: budgetCols[5] }]}>Thành tiền</Text>
              <Text style={[styles.th, styles.tdCenter, { width: budgetCols[6] }]}>Nguồn</Text>
              <Text style={[styles.th, { width: budgetCols[7] }]}>Ghi chú</Text>
            </View>
            {props.budgetRows.map((r, idx) => {
              const amount =
                typeof r.amount === 'number'
                  ? r.amount
                  : (r.quantity ?? 0) * (r.unitPrice ?? 0);
              return (
                <View key={idx} style={styles.tr}>
                  <Text style={[styles.td, styles.tdCenter, { width: budgetCols[0] }]}>
                    {idx + 1}
                  </Text>
                  <Text style={[styles.td, { width: budgetCols[1] }]}>{r.item}</Text>
                  <Text style={[styles.td, styles.tdCenter, { width: budgetCols[2] }]}>
                    {r.unit ?? ''}
                  </Text>
                  <Text style={[styles.td, styles.tdRight, { width: budgetCols[3] }]}>
                    {formatNumber(r.quantity)}
                  </Text>
                  <Text style={[styles.td, styles.tdRight, { width: budgetCols[4] }]}>
                    {formatNumber(r.unitPrice)}
                  </Text>
                  <Text style={[styles.td, styles.tdRight, { width: budgetCols[5] }]}>
                    {formatNumber(amount)}
                  </Text>
                  <Text style={[styles.td, styles.tdCenter, { width: budgetCols[6] }]}>
                    {r.source === 'SELF' ? 'Đối ứng' : 'Nhà nước'}
                  </Text>
                  <Text style={[styles.td, { width: budgetCols[7] }]}>
                    {r.note ?? ''}
                  </Text>
                </View>
              );
            })}
            {/* Footer 3 dòng tổng */}
            <View style={[styles.tr, styles.tfootBold]}>
              <Text
                style={[
                  styles.td,
                  styles.tdRight,
                  { width: budgetLeftSpan },
                ]}
              >
                Đề nghị Nhà nước hỗ trợ
              </Text>
              <Text style={[styles.td, styles.tdRight, { width: budgetCols[5] }]}>
                {formatNumber(props.totalState)}
              </Text>
              <Text
                style={[
                  styles.td,
                  { width: budgetRightSpan },
                ]}
              />
            </View>
            <View style={[styles.tr, styles.tfootBold]}>
              <Text
                style={[
                  styles.td,
                  styles.tdRight,
                  { width: budgetLeftSpan },
                ]}
              >
                Đối ứng đơn vị
              </Text>
              <Text style={[styles.td, styles.tdRight, { width: budgetCols[5] }]}>
                {formatNumber(props.totalSelf)}
              </Text>
              <Text
                style={[
                  styles.td,
                  { width: budgetRightSpan },
                ]}
              />
            </View>
            <View style={[styles.tr, styles.tfootBold]}>
              <Text
                style={[
                  styles.td,
                  styles.tdRight,
                  { width: budgetLeftSpan },
                ]}
              >
                TỔNG CỘNG
              </Text>
              <Text style={[styles.td, styles.tdRight, { width: budgetCols[5] }]}>
                {formatNumber(props.totalAll)}
              </Text>
              <Text
                style={[
                  styles.td,
                  { width: budgetRightSpan },
                ]}
              >
                đồng
              </Text>
            </View>
          </View>
        )}

        {/* Section V: Chủ nhiệm đề án */}
        <Text style={styles.sectionHeader} break>
          V. Chủ nhiệm đề án
        </Text>
        {props.pmContact ? (
          <View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Họ và tên:</Text>
              <Text style={styles.infoValue}>{props.pmContact.name}</Text>
            </View>
            {props.pmContact.title ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Chức danh:</Text>
                <Text style={styles.infoValue}>{props.pmContact.title}</Text>
              </View>
            ) : null}
            {props.pmContact.role ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vai trò:</Text>
                <Text style={styles.infoValue}>{props.pmContact.role}</Text>
              </View>
            ) : null}
            {props.pmContact.email ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{props.pmContact.email}</Text>
              </View>
            ) : null}
            {props.pmContact.phone ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Điện thoại:</Text>
                <Text style={styles.infoValue}>{props.pmContact.phone}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={[styles.paragraph, { fontStyle: 'italic', color: '#94a3b8' }]}>
            (Chưa chỉ định chủ nhiệm đề án)
          </Text>
        )}

        {/* Footer signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureBox}>
            <Text style={styles.signDate}>{dateStr}</Text>
            <Text style={styles.signTitle}>ĐẠI DIỆN ĐƠN VỊ CHỦ TRÌ</Text>
            <Text style={[styles.headerSubLine, { fontStyle: 'italic' }]}>
              (Ký tên, đóng dấu)
            </Text>
            <View style={styles.signSpace} />
            <Text style={styles.signName}>{props.organizationName}</Text>
            <StampPlaceholder />
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Trang ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
