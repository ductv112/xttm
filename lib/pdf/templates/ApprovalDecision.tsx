import * as React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/**
 * ApprovalDecision (Quyết định phê duyệt) — A4 portrait chuẩn công văn nhà nước.
 *
 * Header: 2-column (BỘ CÔNG THƯƠNG left + CHXHCNVN right)
 * Title: QUYẾT ĐỊNH + Subject
 * Body: căn cứ + các điều khoản (Điều 1 phê duyệt danh mục, Điều 2 hiệu lực, Điều 3 phụ lục)
 * Bảng phụ lục: list đề án + kinh phí phê duyệt
 * Footer: signature + Nơi nhận + Lưu VT
 */

export type ApprovalDecisionPdfItem = {
  rank: number;
  projectCode: string;
  projectName: string;
  organizationName: string;
  approvedBudget: number;
  comments?: string;
};

export type ApprovalDecisionPdfProps = {
  decisionNumber: string;
  decisionDate: Date;
  signedByName: string;
  signedByTitle: string;
  programCycleYear: number;
  approvedItems: ApprovalDecisionPdfItem[];
  totalApprovedBudget: number;
  /** Tham chiếu tờ trình */
  submissionDraftNumber: string | null;
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
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  titleSub: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bodyHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.5,
    textAlign: 'justify',
    marginBottom: 6,
  },
  decisionLine: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
    textTransform: 'uppercase',
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
    marginTop: 28,
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

function vndInWords(n: number): string {
  // POC simplified — return formatted only (full Vietnamese number-to-words too complex for POC)
  return `${formatNumber(n)} đồng`;
}

export function ApprovalDecision(props: ApprovalDecisionPdfProps) {
  const dateStr = formatVietnameseDate(props.decisionDate);
  const watermark = props.watermark ?? '';
  const titleLines = props.signedByTitle.split('\n');

  return (
    <Document
      title={`Quyết định ${props.decisionNumber}`}
      author="Bộ Công Thương"
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
            <View style={styles.separator} />
            <Text style={styles.documentNumber}>
              Số: {props.decisionNumber}
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
          <Text style={styles.titleMain}>QUYẾT ĐỊNH</Text>
          <Text style={styles.titleSub}>
            Về việc phê duyệt danh mục Đề án Xúc tiến Thương mại Quốc gia năm{' '}
            {props.programCycleYear} và kinh phí thực hiện
          </Text>
        </View>

        {/* Body */}
        <Text style={styles.bodyHeading}>BỘ TRƯỞNG BỘ CÔNG THƯƠNG</Text>

        <Text style={styles.paragraph}>
          Căn cứ Nghị định số 96/2022/NĐ-CP ngày 29 tháng 11 năm 2022 của Chính
          phủ quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Bộ
          Công Thương;
        </Text>
        <Text style={styles.paragraph}>
          Căn cứ Nghị định số 28/2018/NĐ-CP ngày 01 tháng 3 năm 2018 của Chính
          phủ quy định chi tiết Luật Quản lý ngoại thương về một số biện pháp
          phát triển ngoại thương;
        </Text>
        <Text style={styles.paragraph}>
          Căn cứ kết quả thẩm định của Hội đồng Thẩm định Chương trình Xúc tiến
          Thương mại Quốc gia;
        </Text>
        <Text style={styles.paragraph}>
          Xét đề nghị của Trưởng Ban Quản lý Chương trình Xúc tiến Thương mại
          Quốc gia tại Tờ trình số {props.submissionDraftNumber ?? '......'}{' '}
          ngày {dateStr.replace('Hà Nội, ', '')},
        </Text>

        <Text style={styles.decisionLine}>QUYẾT ĐỊNH:</Text>

        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: 'bold' }}>Điều 1.</Text> Phê duyệt danh mục{' '}
          <Text style={{ fontWeight: 'bold' }}>{props.approvedItems.length}</Text>{' '}
          đề án Xúc tiến Thương mại Quốc gia năm {props.programCycleYear} và
          kinh phí thực hiện với tổng kinh phí{' '}
          <Text style={{ fontWeight: 'bold' }}>
            {vndInWords(props.totalApprovedBudget)}
          </Text>{' '}
          (chi tiết tại Phụ lục đính kèm).
        </Text>

        {/* Phụ lục table */}
        <View style={styles.table}>
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, styles.tdCenter, { width: '7%' }]}>
              STT
            </Text>
            <Text style={[styles.th, { width: '15%' }]}>Mã đề án</Text>
            <Text style={[styles.th, { width: '38%' }]}>Tên đề án</Text>
            <Text style={[styles.th, { width: '22%' }]}>Đơn vị chủ trì</Text>
            <Text style={[styles.th, styles.tdRight, { width: '18%' }]}>
              Kinh phí phê duyệt (đồng)
            </Text>
          </View>
          {props.approvedItems.map((item, idx) => (
            <View key={item.projectCode} style={styles.tr}>
              <Text style={[styles.td, styles.tdCenter, { width: '7%' }]}>
                {idx + 1}
              </Text>
              <Text style={[styles.td, { width: '15%' }]}>
                {item.projectCode}
              </Text>
              <Text style={[styles.td, { width: '38%' }]}>
                {item.projectName}
              </Text>
              <Text style={[styles.td, { width: '22%' }]}>
                {item.organizationName}
              </Text>
              <Text style={[styles.td, styles.tdRight, { width: '18%' }]}>
                {formatNumber(item.approvedBudget)}
              </Text>
            </View>
          ))}
          <View style={[styles.tr, styles.tfoot]}>
            <Text style={[styles.td, styles.tdRight, { width: '82%' }]}>
              TỔNG CỘNG
            </Text>
            <Text style={[styles.td, styles.tdRight, { width: '18%' }]}>
              {formatNumber(props.totalApprovedBudget)}
            </Text>
          </View>
        </View>

        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: 'bold' }}>Điều 2.</Text> Cục Xúc tiến
          Thương mại có trách nhiệm tổ chức thực hiện việc ký kết hợp đồng với
          các đơn vị chủ trì, theo dõi, giám sát triển khai các đề án theo đúng
          quy định pháp luật, đảm bảo hiệu quả và tiết kiệm.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: 'bold' }}>Điều 3.</Text> Quyết định này có
          hiệu lực thi hành kể từ ngày ký.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: 'bold' }}>Điều 4.</Text> Chánh Văn phòng
          Bộ, Cục trưởng Cục Xúc tiến Thương mại, Thủ trưởng các đơn vị chủ
          trì có liên quan và các tổ chức, cá nhân có liên quan chịu trách
          nhiệm thi hành Quyết định này./.
        </Text>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.noiNhan}>
            <Text style={styles.noiNhanLabel}>Nơi nhận:</Text>
            <Text style={styles.noiNhanItem}>- Như Điều 4;</Text>
            <Text style={styles.noiNhanItem}>- Văn phòng Chính phủ;</Text>
            <Text style={styles.noiNhanItem}>- Bộ Tài chính;</Text>
            <Text style={styles.noiNhanItem}>
              - Các đơn vị chủ trì có liên quan;
            </Text>
            <Text style={styles.noiNhanItem}>- Lưu: VT, XTTM.</Text>
          </View>
          <View style={styles.signer}>
            {titleLines.map((line, idx) => (
              <Text key={idx} style={styles.signTitle}>
                {line}
              </Text>
            ))}
            <Text style={[styles.headerSubLine, { fontStyle: 'italic' }]}>
              (Đã ký)
            </Text>
            <View style={styles.signSpace} />
            <Text style={styles.signName}>{props.signedByName}</Text>
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
