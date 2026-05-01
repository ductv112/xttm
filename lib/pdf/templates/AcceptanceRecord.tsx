import * as React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/**
 * AcceptanceRecord (Biên bản nghiệm thu) — Phase 9 Plan 09-01.
 * A4 portrait chuẩn công văn nhà nước.
 *
 * Header: 2-column (BỘ CÔNG THƯƠNG / CỤC XTTM left + CHXHCNVN right)
 * Title: BIÊN BẢN NGHIỆM THU
 * Body: thông tin đề án + chỉ tiêu định lượng + đánh giá định tính + kết quả
 * Footer: chữ ký 2 bên
 */

export type AcceptanceQuantitativeRow = {
  name: string;
  unit: string;
  planned: number | null;
  actual: number | null;
  note?: string;
};

export type AcceptanceRecordPdfProps = {
  recordNumber: string;
  recordDate: Date;
  projectCode: string;
  projectName: string;
  organizationName: string;
  contractNo: string | null;
  resultLabel: string; // Đạt yêu cầu / Đạt một phần / Không đạt
  comments: string | null;
  quantitativeRows: AcceptanceQuantitativeRow[];
  attendingCompaniesCount: number | null;
  qualitativeText: string; // plaintext (HTML stripped)
  signedAOrgName: string; // Cục XTTM
  signedAName: string;
  signedATitle: string;
  signedBOrgName: string; // Đơn vị chủ trì
  signedBName: string;
  signedBTitle: string;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 11,
    padding: 36,
    paddingBottom: 48,
    color: '#0f172a',
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
  headerSubLine: { fontSize: 11, textAlign: 'center' },
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
    marginBottom: 6,
  },
  titleSub: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.5,
    textAlign: 'justify',
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
  },
  table: {
    marginTop: 6,
    marginBottom: 8,
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
  signatureBlock: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signer: { width: '48%', alignItems: 'center' },
  signOrgLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  signTitle: {
    fontSize: 11,
    textAlign: 'center',
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
  resultBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#15803d',
    marginTop: 4,
  },
});

function formatVietnameseDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `Hà Nội, ngày ${day} tháng ${month} năm ${year}`;
}

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('vi-VN').format(n);
}

export function AcceptanceRecord(props: AcceptanceRecordPdfProps) {
  const dateStr = formatVietnameseDate(props.recordDate);

  return (
    <Document
      title={`Biên bản nghiệm thu ${props.recordNumber}`}
      author="Cục Xúc tiến Thương mại"
      creator="XTTMQG POC"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerCol}>
            <Text style={styles.headerLine}>BỘ CÔNG THƯƠNG</Text>
            <Text style={styles.headerLine}>CỤC XÚC TIẾN THƯƠNG MẠI</Text>
            <View style={styles.separator} />
            <Text style={styles.documentNumber}>
              Số: {props.recordNumber}
            </Text>
          </View>
          <View style={styles.headerCol}>
            <Text style={styles.headerLine}>
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </Text>
            <Text style={styles.headerSubLine}>
              Độc lập - Tự do - Hạnh phúc
            </Text>
            <View style={styles.separator} />
            <Text style={[styles.headerSubLine, { fontStyle: 'italic' }]}>
              {dateStr}
            </Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.titleMain}>BIÊN BẢN NGHIỆM THU</Text>
          <Text style={styles.titleSub}>
            Đề án Xúc tiến Thương mại Quốc gia
          </Text>
          <Text style={styles.titleSub}>&ldquo;{props.projectName}&rdquo;</Text>
        </View>

        <Text style={styles.paragraph}>
          Hôm nay, {dateStr.replace('Hà Nội, ', '')}, tại trụ sở Cục Xúc tiến
          Thương mại - Bộ Công Thương, chúng tôi gồm:
        </Text>

        <Text style={styles.sectionHeading}>BÊN A: BÊN GIAO NHIỆM VỤ</Text>
        <Text style={styles.paragraph}>
          {props.signedAOrgName}{'\n'}
          Đại diện: {props.signedAName} - {props.signedATitle}
        </Text>

        <Text style={styles.sectionHeading}>BÊN B: ĐƠN VỊ CHỦ TRÌ</Text>
        <Text style={styles.paragraph}>
          {props.organizationName}{'\n'}
          Đại diện: {props.signedBName} - {props.signedBTitle}
        </Text>

        <Text style={styles.paragraph}>
          Cùng nhau lập biên bản nghiệm thu kết quả thực hiện đề án{' '}
          <Text style={{ fontWeight: 'bold' }}>{props.projectName}</Text> (mã{' '}
          {props.projectCode}
          {props.contractNo ? `, theo Hợp đồng số ${props.contractNo}` : ''})
          với các nội dung như sau:
        </Text>

        <Text style={styles.sectionHeading}>1. Chỉ tiêu định lượng</Text>
        {props.quantitativeRows.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tr, styles.thead]}>
              <Text style={[styles.th, { width: '40%' }]}>Chỉ tiêu</Text>
              <Text style={[styles.th, { width: '15%' }]}>Đơn vị</Text>
              <Text style={[styles.th, { width: '15%' }]}>Kế hoạch</Text>
              <Text style={[styles.th, { width: '15%' }]}>Thực tế</Text>
              <Text style={[styles.th, { width: '15%' }]}>Ghi chú</Text>
            </View>
            {props.quantitativeRows.map((row, idx) => (
              <View key={idx} style={styles.tr}>
                <Text style={[styles.td, { width: '40%' }]}>{row.name}</Text>
                <Text style={[styles.td, { width: '15%' }]}>{row.unit}</Text>
                <Text
                  style={[styles.td, { width: '15%', textAlign: 'right' }]}
                >
                  {formatNumber(row.planned)}
                </Text>
                <Text
                  style={[styles.td, { width: '15%', textAlign: 'right' }]}
                >
                  {formatNumber(row.actual)}
                </Text>
                <Text style={[styles.td, { width: '15%' }]}>
                  {row.note ?? ''}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.paragraph}>(Không có chỉ tiêu định lượng)</Text>
        )}

        {props.attendingCompaniesCount !== null ? (
          <Text style={styles.paragraph}>
            Tổng số doanh nghiệp tham gia thực tế:{' '}
            <Text style={{ fontWeight: 'bold' }}>
              {formatNumber(props.attendingCompaniesCount)} doanh nghiệp
            </Text>
          </Text>
        ) : null}

        <Text style={styles.sectionHeading}>2. Đánh giá định tính</Text>
        <Text style={styles.paragraph}>
          {props.qualitativeText || '(Không có nội dung định tính)'}
        </Text>

        <Text style={styles.sectionHeading}>3. Kết luận nghiệm thu</Text>
        <Text style={styles.paragraph}>
          Sau khi xem xét kết quả thực hiện đề án, Hội đồng nghiệm thu thống
          nhất kết luận:
        </Text>
        <Text style={styles.resultBadge}>
          Kết quả: {props.resultLabel.toUpperCase()}
        </Text>
        {props.comments ? (
          <Text style={styles.paragraph}>{props.comments}</Text>
        ) : null}

        <Text style={[styles.paragraph, { marginTop: 12 }]}>
          Biên bản được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên
          giữ 01 bản./.
        </Text>

        <View style={styles.signatureBlock}>
          <View style={styles.signer}>
            <Text style={styles.signOrgLabel}>ĐẠI DIỆN BÊN B</Text>
            <Text style={styles.signTitle}>{props.signedBTitle}</Text>
            <Text style={[styles.headerSubLine, { fontStyle: 'italic' }]}>
              (Ký, ghi rõ họ tên)
            </Text>
            <View style={styles.signSpace} />
            <Text style={styles.signName}>{props.signedBName}</Text>
          </View>
          <View style={styles.signer}>
            <Text style={styles.signOrgLabel}>ĐẠI DIỆN BÊN A</Text>
            <Text style={styles.signTitle}>{props.signedATitle}</Text>
            <Text style={[styles.headerSubLine, { fontStyle: 'italic' }]}>
              (Ký, ghi rõ họ tên)
            </Text>
            <View style={styles.signSpace} />
            <Text style={styles.signName}>{props.signedAName}</Text>
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
