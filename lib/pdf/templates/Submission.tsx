import * as React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/**
 * Submission (Tờ trình) — A4 portrait chuẩn công văn nhà nước Việt Nam.
 *
 * Header: 2-column (BAN QUẢN LÝ left + CHXHCNVN right)
 * Title: TỜ TRÌNH + Subject line
 * Recipient: Kính gửi Bộ trưởng Bộ Công Thương
 * Body: list đề án + tổng kinh phí + nội dung văn bản
 * Footer: signature + Nơi nhận + Lưu VT
 */

export type SubmissionPdfProject = {
  rank: number | null;
  projectCode: string;
  projectName: string;
  organizationName: string;
  proposedBudget: number;
  averageScore: number | null;
};

export type SubmissionPdfProps = {
  draftNumber: string;
  programCycleYear: number;
  draftedAt: Date;
  /** Nội dung Tiptap HTML (sẽ strip về plain text) */
  contentHtml: string;
  projects: SubmissionPdfProject[];
  totalProposedBudget: number;
  watermark?: string;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 11,
    padding: 36,
    paddingBottom: 48,
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
    color: 'rgba(220, 38, 38, 0.10)',
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
    marginTop: 22,
    marginBottom: 14,
    alignItems: 'center',
  },
  titleMain: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  titleSub: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recipient: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'left',
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.5,
    textAlign: 'justify',
    marginBottom: 6,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  table: {
    marginTop: 4,
    marginBottom: 6,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: '#0f172a',
    borderLeftColor: '#0f172a',
  },
  tr: { flexDirection: 'row' },
  thead: { backgroundColor: '#f1f5f9' },
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
  tdRight: { textAlign: 'right' },
  tdCenter: { textAlign: 'center' },
  tfoot: { backgroundColor: '#f8fafc', fontWeight: 'bold' },
  signatureBlock: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noiNhan: { width: '48%' },
  noiNhanLabel: {
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  noiNhanItem: { fontSize: 10, marginBottom: 2 },
  signer: { width: '48%', alignItems: 'center' },
  signTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  signSpace: { height: 56 },
  signName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#94a3b8',
  },
});

function formatVietnameseDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `Hà Nội, ngày ${day} tháng ${month} năm ${year}`;
}

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('vi-VN');
}

function htmlToParagraphs(html: string | null | undefined): string[] {
  if (!html) return [];
  // Split on </p> or <br> as paragraph boundaries
  const raw = html
    .replace(/<\s*br\s*\/?>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, '');
  return raw
    .split(/\n{2,}/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 0);
}

export function Submission(props: SubmissionPdfProps) {
  const dateStr = formatVietnameseDate(props.draftedAt);
  const paragraphs = htmlToParagraphs(props.contentHtml);
  const watermark = props.watermark ?? 'BẢN MẪU';

  return (
    <Document
      title={`Tờ trình ${props.draftNumber}`}
      author="Ban Quản lý Chương trình XTTM Quốc gia"
      creator="XTTMQG POC"
    >
      <Page size="A4" style={styles.page}>
        {watermark ? (
          <Text style={styles.watermark} fixed>
            {watermark}
          </Text>
        ) : null}

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerCol}>
            <Text style={styles.headerLine}>BỘ CÔNG THƯƠNG</Text>
            <Text style={styles.headerLine}>CỤC XÚC TIẾN THƯƠNG MẠI</Text>
            <View style={styles.separator} />
            <Text style={styles.documentNumber}>
              Số: {props.draftNumber || '....../TTr-XTTM'}
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
          <Text style={styles.titleMain}>TỜ TRÌNH</Text>
          <Text style={styles.titleSub}>
            V/v phê duyệt danh mục Đề án Xúc tiến Thương mại Quốc gia năm{' '}
            {props.programCycleYear}
          </Text>
        </View>

        {/* Recipient */}
        <Text style={styles.recipient}>
          Kính gửi:{' '}
          <Text style={{ fontWeight: 'bold' }}>BỘ TRƯỞNG BỘ CÔNG THƯƠNG</Text>
        </Text>

        {/* Body — content */}
        {paragraphs.length > 0 ? (
          paragraphs.map((p, idx) => (
            <Text key={idx} style={styles.paragraph}>
              {p}
            </Text>
          ))
        ) : (
          <Text style={[styles.paragraph, { fontStyle: 'italic' }]}>
            (Chưa khai báo nội dung tờ trình)
          </Text>
        )}

        {/* Project list */}
        <Text style={styles.sectionHeader}>
          Danh mục đề án đề nghị phê duyệt
        </Text>
        <View style={styles.table}>
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, styles.tdCenter, { width: '7%' }]}>
              STT
            </Text>
            <Text style={[styles.th, { width: '17%' }]}>Mã đề án</Text>
            <Text style={[styles.th, { width: '36%' }]}>Tên đề án</Text>
            <Text style={[styles.th, { width: '22%' }]}>Đơn vị chủ trì</Text>
            <Text style={[styles.th, styles.tdRight, { width: '10%' }]}>
              Điểm TB
            </Text>
            <Text style={[styles.th, styles.tdRight, { width: '8%' }]}>
              Dự toán (đồng)
            </Text>
          </View>
          {props.projects.map((p, idx) => (
            <View key={p.projectCode} style={styles.tr}>
              <Text style={[styles.td, styles.tdCenter, { width: '7%' }]}>
                {idx + 1}
              </Text>
              <Text style={[styles.td, { width: '17%' }]}>{p.projectCode}</Text>
              <Text style={[styles.td, { width: '36%' }]}>{p.projectName}</Text>
              <Text style={[styles.td, { width: '22%' }]}>
                {p.organizationName}
              </Text>
              <Text style={[styles.td, styles.tdRight, { width: '10%' }]}>
                {p.averageScore !== null ? p.averageScore.toFixed(2) : '—'}
              </Text>
              <Text style={[styles.td, styles.tdRight, { width: '8%' }]}>
                {formatNumber(p.proposedBudget)}
              </Text>
            </View>
          ))}
          <View style={[styles.tr, styles.tfoot]}>
            <Text style={[styles.td, styles.tdRight, { width: '92%' }]}>
              Tổng cộng
            </Text>
            <Text style={[styles.td, styles.tdRight, { width: '8%' }]}>
              {formatNumber(props.totalProposedBudget)}
            </Text>
          </View>
        </View>

        <Text style={[styles.paragraph, { marginTop: 8 }]}>
          Ban Quản lý Chương trình Xúc tiến Thương mại Quốc gia kính trình Bộ
          trưởng xem xét, phê duyệt./.
        </Text>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.noiNhan}>
            <Text style={styles.noiNhanLabel}>Nơi nhận:</Text>
            <Text style={styles.noiNhanItem}>- Như trên;</Text>
            <Text style={styles.noiNhanItem}>
              - Lãnh đạo Bộ Công Thương (báo cáo);
            </Text>
            <Text style={styles.noiNhanItem}>- Cục trưởng Cục XTTM;</Text>
            <Text style={styles.noiNhanItem}>- Lưu: VT, XTTM.</Text>
          </View>
          <View style={styles.signer}>
            <Text style={styles.signTitle}>
              {'TRƯỞNG BAN QUẢN LÝ\nCHƯƠNG TRÌNH XTTM QUỐC GIA'
                .split('\n')
                .map((line, idx) => (
                  <Text key={idx}>
                    {line}
                    {'\n'}
                  </Text>
                ))}
            </Text>
            <Text style={[styles.headerSubLine, { fontStyle: 'italic' }]}>
              (Ký, ghi rõ họ tên)
            </Text>
            <View style={styles.signSpace} />
            <Text style={styles.signName}>__________________</Text>
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
