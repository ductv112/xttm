import * as React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/**
 * AmendmentDecision (Quyết định điều chỉnh đề án) — Phase 8 Plan 08-01 Task 4.
 * A4 portrait chuẩn công văn nhà nước.
 *
 * Header: 2-column (BỘ CÔNG THƯƠNG / CỤC XTTM left + CHXHCNVN right)
 * Title: QUYẾT ĐỊNH + Subject
 * Body: căn cứ + 3 điều khoản (điều chỉnh / hiệu lực / thi hành)
 * Bảng so sánh: Cũ | Mới
 * Footer: signature + Nơi nhận
 */

export type AmendmentDecisionPdfProps = {
  decisionNumber: string;
  decisionDate: Date;
  signedByName: string;
  signedByTitle: string;
  projectCode: string;
  projectName: string;
  organizationName: string;
  amendmentType: string;
  amendmentTypeLabel: string;
  isCritical: boolean;
  oldValueDisplay: string;
  newValueDisplay: string;
  reason: string;
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
  comparisonTable: {
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
    padding: 6,
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
  noiNhan: { width: '48%' },
  noiNhanLabel: { fontSize: 10, fontStyle: 'italic', marginBottom: 4 },
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
  criticalBadge: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#b91c1c',
    marginBottom: 6,
  },
});

function formatVietnameseDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `Hà Nội, ngày ${day} tháng ${month} năm ${year}`;
}

export function AmendmentDecision(props: AmendmentDecisionPdfProps) {
  const dateStr = formatVietnameseDate(props.decisionDate);
  const titleLines = props.signedByTitle.split('\n');

  return (
    <Document
      title={`Quyết định điều chỉnh ${props.decisionNumber}`}
      author="Cục Xúc tiến Thương mại"
      creator="XTTMQG POC"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerCol}>
            <Text style={styles.headerLine}>BỘ CÔNG THƯƠNG</Text>
            <Text style={styles.headerLine}>
              CỤC XÚC TIẾN THƯƠNG MẠI
            </Text>
            <View style={styles.separator} />
            <Text style={styles.documentNumber}>
              Số: {props.decisionNumber}
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
          <Text style={styles.titleMain}>QUYẾT ĐỊNH</Text>
          <Text style={styles.titleSub}>
            Về việc điều chỉnh đề án Xúc tiến Thương mại Quốc gia
          </Text>
          <Text style={styles.titleSub}>
            &ldquo;{props.projectName}&rdquo;
          </Text>
          {props.isCritical ? (
            <Text style={styles.criticalBadge}>
              (Điều chỉnh trọng yếu theo Điều 13 NĐ 28/2018/NĐ-CP)
            </Text>
          ) : null}
        </View>

        <Text style={styles.bodyHeading}>
          CỤC TRƯỞNG CỤC XÚC TIẾN THƯƠNG MẠI
        </Text>

        <Text style={styles.paragraph}>
          Căn cứ Nghị định số 28/2018/NĐ-CP ngày 01 tháng 3 năm 2018 của Chính
          phủ quy định chi tiết Luật Quản lý ngoại thương về một số biện pháp
          phát triển ngoại thương;
        </Text>
        <Text style={styles.paragraph}>
          Căn cứ Quyết định phê duyệt đề án &ldquo;{props.projectName}&rdquo;
          của Bộ Công Thương;
        </Text>
        <Text style={styles.paragraph}>
          Xét đề nghị của {props.organizationName} về việc điều chỉnh nội dung
          đề án ({props.amendmentTypeLabel}),
        </Text>

        <Text style={styles.decisionLine}>QUYẾT ĐỊNH:</Text>

        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: 'bold' }}>Điều 1.</Text> Phê duyệt điều
          chỉnh đề án &ldquo;{props.projectName}&rdquo; (mã số{' '}
          <Text style={{ fontWeight: 'bold' }}>{props.projectCode}</Text>) do{' '}
          {props.organizationName} chủ trì với nội dung điều chỉnh chi tiết
          như sau:
        </Text>

        <View style={styles.comparisonTable}>
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, { width: '20%' }]}>Nội dung</Text>
            <Text style={[styles.th, { width: '40%' }]}>Trước điều chỉnh</Text>
            <Text style={[styles.th, { width: '40%' }]}>Sau điều chỉnh</Text>
          </View>
          <View style={styles.tr}>
            <Text style={[styles.td, { width: '20%', fontWeight: 'bold' }]}>
              {props.amendmentTypeLabel}
            </Text>
            <Text style={[styles.td, { width: '40%' }]}>
              {props.oldValueDisplay || '(Trống)'}
            </Text>
            <Text style={[styles.td, { width: '40%', fontWeight: 'bold' }]}>
              {props.newValueDisplay || '(Trống)'}
            </Text>
          </View>
        </View>

        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: 'bold' }}>Lý do điều chỉnh:</Text>{' '}
          {props.reason}
        </Text>

        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: 'bold' }}>Điều 2.</Text> Đơn vị chủ trì có
          trách nhiệm triển khai đề án theo nội dung đã điều chỉnh, tuân thủ
          các quy định pháp luật hiện hành và báo cáo định kỳ theo quy định.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: 'bold' }}>Điều 3.</Text> Quyết định này có
          hiệu lực thi hành kể từ ngày ký. Trưởng phòng Quản lý XTTM, đơn vị
          chủ trì và các tổ chức, cá nhân có liên quan chịu trách nhiệm thi
          hành Quyết định này./.
        </Text>

        <View style={styles.signatureBlock}>
          <View style={styles.noiNhan}>
            <Text style={styles.noiNhanLabel}>Nơi nhận:</Text>
            <Text style={styles.noiNhanItem}>- Như Điều 3;</Text>
            <Text style={styles.noiNhanItem}>- Bộ Công Thương (b/c);</Text>
            <Text style={styles.noiNhanItem}>
              - {props.organizationName};
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
