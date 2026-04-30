import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/**
 * Smoke string for Vietnamese diacritics verification (R1 CRITICAL pitfall).
 *
 * Covers every Vietnamese diacritic combination:
 * - 5 tone marks on 'a': á à ả ã ạ
 * - 5 tone marks on 'ă' (breve): ắ ằ ẳ ẵ ặ
 * - 5 tone marks on 'â' (circumflex): ấ ầ ẩ ẫ ậ
 * - đ Đ (stroke), ê ô (circumflex on e/o), ơ ư (horn)
 * - 5 tone marks on 'y': ý ỳ ỷ ỹ ỵ
 *
 * If any of these break in the rendered PDF (squares, ?, missing glyph), the font registration
 * or font file is wrong. This string MUST render perfectly in Adobe Reader, Chrome, Foxit.
 */
export const SMOKE_STRING =
  'Phê duyệt đề án Xúc tiến Thương mại Quốc gia năm 2026 do Hiệp hội Dệt may Việt Nam ' +
  '(VITAS) chủ trì, với các nội dung chủ yếu sau đây: thẩm định, phê duyệt, ký kết hợp đồng ' +
  'triển khai. Tổng dự toán kinh phí: 2.500.000.000 đồng (Hai tỷ năm trăm triệu đồng). ' +
  'Đường dẫn ngắn: tổ chức quản lý chương trình XTTM — Quý IV/2026. ' +
  'Chuỗi smoke kiểm tra dấu: á à ả ã ạ — ắ ằ ẳ ẵ ặ — ấ ầ ẩ ẫ ậ — đ Đ — ê ô ơ ư — Ý ỳ ỷ ỹ ỵ.';

export type OfficialDocumentProps = {
  documentNumber: string; // e.g. "12/QĐ-XTTM"
  signedDate: Date;
  title: string; // e.g. "Phê duyệt đề án xúc tiến thương mại quốc gia năm 2026"
  body: string; // main paragraph content for "Điều 1"
  signerTitle: string; // e.g. "KT. CỤC TRƯỞNG\nPHÓ CỤC TRƯỞNG" (newline-separated lines)
  signerName: string; // e.g. "Nguyễn Văn An"
  watermark?: string; // default 'BẢN MẪU'
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 12,
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
    fontSize: 60,
    color: 'rgba(220, 38, 38, 0.15)',
    fontWeight: 'bold',
    transform: 'rotate(-30deg)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerColLeft: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '48%',
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
  dateLine: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  decisionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  decisionAbout: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  body: {
    fontSize: 12,
    lineHeight: 1.5,
    textAlign: 'justify',
    marginBottom: 12,
  },
  bodyHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  signatureBlock: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureNoiNhan: {
    flexDirection: 'column',
    width: '48%',
  },
  noiNhanLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  noiNhanItem: {
    fontSize: 11,
    marginBottom: 2,
  },
  signatureSigner: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '48%',
  },
  signerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  signerSpace: {
    height: 60,
  },
  signerName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

function formatVietnameseDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `Hà Nội, ngày ${day} tháng ${month} năm ${year}`;
}

export function OfficialDocument({
  documentNumber,
  signedDate,
  title,
  body,
  signerTitle,
  signerName,
  watermark = 'BẢN MẪU',
}: OfficialDocumentProps) {
  const dateStr = formatVietnameseDate(signedDate);

  return (
    <Document title={title} author="Cục Xúc tiến Thương mại" creator="XTTMQG POC">
      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark} fixed>
          {watermark}
        </Text>

        <View style={styles.headerRow}>
          <View style={styles.headerColLeft}>
            <Text style={styles.headerLine}>BỘ CÔNG THƯƠNG</Text>
            <Text style={styles.headerLine}>CỤC XÚC TIẾN THƯƠNG MẠI</Text>
            <View style={styles.separator} />
            <Text style={styles.documentNumber}>Số: {documentNumber}</Text>
          </View>
          <View style={styles.headerCol}>
            <Text style={styles.headerLine}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</Text>
            <Text style={styles.headerSubLine}>Độc lập - Tự do - Hạnh phúc</Text>
            <View style={styles.separator} />
            <Text style={styles.dateLine}>{dateStr}</Text>
          </View>
        </View>

        <Text style={styles.decisionTitle}>QUYẾT ĐỊNH</Text>
        <Text style={styles.decisionAbout}>Về việc {title.toLowerCase()}</Text>

        <Text style={styles.bodyHeading}>CỤC TRƯỞNG CỤC XÚC TIẾN THƯƠNG MẠI</Text>

        <Text style={styles.body}>
          Căn cứ Nghị định số 28/2018/NĐ-CP ngày 01 tháng 3 năm 2018 của Chính phủ quy định
          chi tiết Luật Quản lý ngoại thương về một số biện pháp phát triển ngoại thương;
        </Text>
        <Text style={styles.body}>
          Căn cứ Quyết định số 1387/QĐ-BCT ngày 25 tháng 5 năm 2017 của Bộ trưởng Bộ Công
          Thương quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Cục Xúc tiến
          Thương mại;
        </Text>
        <Text style={styles.body}>
          Xét đề nghị của Trưởng phòng Quản lý Chương trình Xúc tiến Thương mại Quốc gia,
        </Text>
        <Text style={[styles.body, { fontWeight: 'bold', textAlign: 'center', marginTop: 8 }]}>
          QUYẾT ĐỊNH:
        </Text>

        <Text style={styles.body}>
          <Text style={{ fontWeight: 'bold' }}>Điều 1.</Text> {body}
        </Text>

        <Text style={styles.body}>
          <Text style={{ fontWeight: 'bold' }}>Điều 2.</Text> Quyết định này có hiệu lực kể từ
          ngày ký.
        </Text>

        <Text style={styles.body}>
          <Text style={{ fontWeight: 'bold' }}>Điều 3.</Text> Chánh Văn phòng Cục, Trưởng các
          phòng, ban thuộc Cục và đơn vị chủ trì có liên quan chịu trách nhiệm thi hành Quyết
          định này.
        </Text>

        <View style={styles.signatureBlock}>
          <View style={styles.signatureNoiNhan}>
            <Text style={styles.noiNhanLabel}>Nơi nhận:</Text>
            <Text style={styles.noiNhanItem}>- Như Điều 3;</Text>
            <Text style={styles.noiNhanItem}>- Lưu: VT, XTTM.</Text>
          </View>
          <View style={styles.signatureSigner}>
            {signerTitle.split('\n').map((line, idx) => (
              <Text key={idx} style={styles.signerTitle}>
                {line}
              </Text>
            ))}
            <View style={styles.signerSpace} />
            <Text style={styles.signerName}>{signerName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
