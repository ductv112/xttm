import * as React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/**
 * LiquidationRecord (Biên bản thanh lý hợp đồng) — Phase 9 Plan 09-01.
 * A4 portrait — biên bản thanh lý HĐ XTTM giữa Cục XTTM và đơn vị chủ trì.
 */

export type LiquidationRecordPdfProps = {
  recordNumber: string; // số biên bản thanh lý
  recordDate: Date;
  contractNo: string;
  contractSignedDate: Date | null;
  projectCode: string;
  projectName: string;
  organizationName: string;
  totalContractValue: number;
  totalDisbursed: number; // số tiền đã thanh toán
  acceptanceRecordNumber: string;
  acceptanceDate: Date;
  acceptanceResultLabel: string;
  notes: string | null;
  signedAName: string;
  signedATitle: string;
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
});

function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + ' đồng';
}

function formatVietnameseDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `Hà Nội, ngày ${day} tháng ${month} năm ${year}`;
}

function formatShortDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function LiquidationRecord(props: LiquidationRecordPdfProps) {
  const dateStr = formatVietnameseDate(props.recordDate);
  const remaining = props.totalContractValue - props.totalDisbursed;

  return (
    <Document
      title={`Biên bản thanh lý ${props.recordNumber}`}
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
          <Text style={styles.titleMain}>BIÊN BẢN THANH LÝ HỢP ĐỒNG</Text>
          <Text style={styles.titleSub}>
            Số HĐ: {props.contractNo}
            {props.contractSignedDate
              ? ` ngày ${formatShortDate(props.contractSignedDate)}`
              : ''}
          </Text>
        </View>

        <Text style={styles.paragraph}>
          Căn cứ Hợp đồng số <Text style={{ fontWeight: 'bold' }}>{props.contractNo}</Text>{' '}
          {props.contractSignedDate
            ? `ký ngày ${formatShortDate(props.contractSignedDate)}`
            : ''}{' '}
          giữa Cục Xúc tiến Thương mại và {props.organizationName} về việc
          triển khai đề án &ldquo;{props.projectName}&rdquo;;
        </Text>

        <Text style={styles.paragraph}>
          Căn cứ Biên bản nghiệm thu số{' '}
          <Text style={{ fontWeight: 'bold' }}>
            {props.acceptanceRecordNumber}
          </Text>{' '}
          ngày {formatShortDate(props.acceptanceDate)} với kết quả{' '}
          <Text style={{ fontWeight: 'bold' }}>
            {props.acceptanceResultLabel}
          </Text>
          ;
        </Text>

        <Text style={styles.paragraph}>
          Hôm nay {dateStr.replace('Hà Nội, ', '')}, hai bên thống nhất thanh
          lý hợp đồng nêu trên với nội dung như sau:
        </Text>

        <Text style={styles.sectionHeading}>
          Điều 1. Đối tượng thanh lý
        </Text>
        <Text style={styles.paragraph}>
          Hợp đồng số {props.contractNo} về việc triển khai đề án{' '}
          {props.projectName} (mã {props.projectCode}).
        </Text>

        <Text style={styles.sectionHeading}>Điều 2. Tổng hợp tài chính</Text>
        <View style={styles.table}>
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, { width: '60%' }]}>Khoản mục</Text>
            <Text
              style={[styles.th, { width: '40%', textAlign: 'right' }]}
            >
              Số tiền
            </Text>
          </View>
          <View style={styles.tr}>
            <Text style={[styles.td, { width: '60%' }]}>
              Tổng giá trị hợp đồng
            </Text>
            <Text
              style={[styles.td, { width: '40%', textAlign: 'right' }]}
            >
              {formatVND(props.totalContractValue)}
            </Text>
          </View>
          <View style={styles.tr}>
            <Text style={[styles.td, { width: '60%' }]}>
              Tổng đã thanh toán
            </Text>
            <Text
              style={[styles.td, { width: '40%', textAlign: 'right' }]}
            >
              {formatVND(props.totalDisbursed)}
            </Text>
          </View>
          <View style={styles.tr}>
            <Text
              style={[
                styles.td,
                { width: '60%', fontWeight: 'bold' },
              ]}
            >
              Số dư còn lại
            </Text>
            <Text
              style={[
                styles.td,
                { width: '40%', textAlign: 'right', fontWeight: 'bold' },
              ]}
            >
              {formatVND(remaining)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>
          Điều 3. Cam kết và kết luận
        </Text>
        <Text style={styles.paragraph}>
          Hai bên xác nhận đã hoàn thành các nghĩa vụ trong hợp đồng. Đề án đã
          được nghiệm thu với kết quả {props.acceptanceResultLabel}. Hai bên
          không còn tranh chấp gì liên quan đến hợp đồng này.
        </Text>

        {props.notes ? (
          <Text style={styles.paragraph}>
            <Text style={{ fontWeight: 'bold' }}>Ghi chú:</Text>{' '}
            {props.notes}
          </Text>
        ) : null}

        <Text style={[styles.paragraph, { marginTop: 8 }]}>
          Biên bản được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên
          giữ 01 bản./.
        </Text>

        <View style={styles.signatureBlock}>
          <View style={styles.signer}>
            <Text style={styles.signOrgLabel}>ĐẠI DIỆN BÊN B</Text>
            <Text style={styles.signTitle}>{props.signedBTitle}</Text>
            <Text style={[styles.headerSubLine, { fontStyle: 'italic' }]}>
              (Ký, ghi rõ họ tên, đóng dấu)
            </Text>
            <View style={styles.signSpace} />
            <Text style={styles.signName}>{props.signedBName}</Text>
          </View>
          <View style={styles.signer}>
            <Text style={styles.signOrgLabel}>ĐẠI DIỆN BÊN A</Text>
            <Text style={styles.signTitle}>{props.signedATitle}</Text>
            <Text style={[styles.headerSubLine, { fontStyle: 'italic' }]}>
              (Ký, ghi rõ họ tên, đóng dấu)
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
