import * as React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/**
 * EvaluationReport — Báo cáo thẩm định đề án (chuẩn công văn nhà nước Việt Nam).
 *
 * Layout (A4 portrait):
 * - Header 2-column: Bộ CT + Cục XTTM (left) | CHXHCNVN + Độc lập-Tự do-Hạnh phúc (right)
 * - Title: "BÁO CÁO THẨM ĐỊNH ĐỀ ÁN XÚC TIẾN THƯƠNG MẠI QUỐC GIA NĂM <YEAR>"
 * - Section I: Thông tin hội đồng (tên, kỳ, danh sách thành viên + chức vụ)
 * - Section II: Danh sách đề án + điểm trung bình + xếp hạng + COI flags
 * - Section III: Nhận xét tổng hợp từng đề án (score sheets per project)
 * - Section IV: Kết luận và kiến nghị
 * - Footer: signature block (Chủ tịch + Thư ký) + Nơi nhận + Lưu VT
 * - Watermark: "BẢN MẪU" diagonal khi council vẫn OPEN; ẩn khi LOCKED
 */

export type EvaluationMember = {
  fullName: string;
  role: string; // CHU_TICH | PHO | UY_VIEN | THU_KY
  roleLabel: string;
  submittedSheetCount: number;
};

export type EvaluationProject = {
  rank: number | null;
  projectCode: string;
  projectName: string;
  organizationName: string;
  proposedBudget: number | null;
  submittedCount: number;
  totalMembers: number;
  coiCount: number;
  averageScore: number | null;
  minScore: number | null;
  maxScore: number | null;
};

export type EvaluationProjectComments = {
  projectCode: string;
  projectName: string;
  scoreSheets: Array<{
    reviewerName: string;
    reviewerRoleLabel: string;
    totalScore: number | null;
    conflictOfInterest: boolean;
    comment: string | null;
  }>;
};

export type EvaluationReportProps = {
  councilName: string;
  councilTerm: string;
  programCycleYear: number;
  /** ISO date string */
  exportedAt?: Date;
  members: EvaluationMember[];
  projects: EvaluationProject[];
  projectComments: EvaluationProjectComments[];
  /** Hội đồng đã LOCKED (kết luận chính thức) hay vẫn OPEN (bản nháp) */
  lockStatus: 'OPEN' | 'LOCKED';
  /** Tổng số phiếu đã nộp toàn hội đồng */
  totalSubmittedSheets: number;
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
    marginTop: 20,
    marginBottom: 14,
    alignItems: 'center',
  },
  titleMain: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  titleSub: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.5,
    textAlign: 'justify',
    marginBottom: 4,
  },
  // Tables
  table: {
    marginTop: 4,
    marginBottom: 6,
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
  tdRight: { textAlign: 'right' },
  tdCenter: { textAlign: 'center' },
  // Project comment block
  projectBlock: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    borderTopStyle: 'dashed',
  },
  projectHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sheetRow: {
    fontSize: 10,
    marginBottom: 3,
    paddingLeft: 8,
  },
  // Signature
  signatureBlock: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureNoiNhan: {
    flexDirection: 'column',
    width: '48%',
  },
  noiNhanLabel: {
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  noiNhanItem: {
    fontSize: 10,
    marginBottom: 2,
  },
  signatureSigner: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '48%',
  },
  signTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  signSpace: {
    height: 56,
  },
  signName: {
    fontSize: 11,
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

function formatNumber(n: number | null | undefined): string {
  if (typeof n !== 'number' || !isFinite(n)) return '—';
  return n.toLocaleString('vi-VN');
}

function htmlToPlain(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function EvaluationReport(props: EvaluationReportProps) {
  const exportedAt = props.exportedAt ?? new Date();
  const watermark =
    props.watermark !== undefined
      ? props.watermark
      : props.lockStatus === 'OPEN'
        ? 'BẢN MẪU'
        : '';
  const dateStr = formatVietnameseDate(exportedAt);

  // Find chair + secretary
  const chair = props.members.find((m) => m.role === 'CHU_TICH');
  const secretary = props.members.find((m) => m.role === 'THU_KY');

  // Compute summary
  const totalProjects = props.projects.length;
  const ranked = [...props.projects]
    .filter((p) => p.rank !== null)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const top3 = ranked.slice(0, 3);

  return (
    <Document
      title={`Báo cáo thẩm định ${props.councilName}`}
      author="Cục Xúc tiến Thương mại"
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
              Hội đồng {props.councilTerm}
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
            BÁO CÁO THẨM ĐỊNH ĐỀ ÁN XÚC TIẾN THƯƠNG MẠI QUỐC GIA NĂM{' '}
            {props.programCycleYear}
          </Text>
          <Text style={styles.titleSub}>{props.councilName}</Text>
        </View>

        {/* Section I */}
        <Text style={styles.sectionHeader}>I. Thông tin hội đồng</Text>
        <Text style={styles.paragraph}>
          Hội đồng <Text style={{ fontWeight: 'bold' }}>{props.councilName}</Text>,{' '}
          {props.councilTerm.toLowerCase()}, được thành lập trong khuôn khổ
          Chương trình Xúc tiến Thương mại Quốc gia năm {props.programCycleYear},
          gồm {props.members.length} thành viên thẩm định {totalProjects} đề án
          được phân công.
        </Text>
        <Text style={[styles.paragraph, { fontWeight: 'bold' }]}>
          Danh sách thành viên hội đồng:
        </Text>
        <View style={styles.table}>
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, styles.tdCenter, { width: '8%' }]}>
              STT
            </Text>
            <Text style={[styles.th, { width: '52%' }]}>Họ và tên</Text>
            <Text style={[styles.th, { width: '24%' }]}>Chức vụ</Text>
            <Text style={[styles.th, styles.tdCenter, { width: '16%' }]}>
              Phiếu nộp
            </Text>
          </View>
          {props.members.map((m, idx) => (
            <View key={idx} style={styles.tr}>
              <Text style={[styles.td, styles.tdCenter, { width: '8%' }]}>
                {idx + 1}
              </Text>
              <Text style={[styles.td, { width: '52%' }]}>{m.fullName}</Text>
              <Text style={[styles.td, { width: '24%' }]}>{m.roleLabel}</Text>
              <Text style={[styles.td, styles.tdCenter, { width: '16%' }]}>
                {m.submittedSheetCount}
              </Text>
            </View>
          ))}
        </View>

        {/* Section II */}
        <Text style={styles.sectionHeader}>
          II. Danh sách đề án và kết quả tổng hợp
        </Text>
        <Text style={styles.paragraph}>
          Tổng số đề án thẩm định: <Text style={{ fontWeight: 'bold' }}>{totalProjects}</Text>.
          Tổng số phiếu chấm đã nộp: <Text style={{ fontWeight: 'bold' }}>{props.totalSubmittedSheets}</Text>.
        </Text>
        <View style={styles.table}>
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, styles.tdCenter, { width: '6%' }]}>
              Hạng
            </Text>
            <Text style={[styles.th, { width: '14%' }]}>Mã đề án</Text>
            <Text style={[styles.th, { width: '36%' }]}>Tên đề án</Text>
            <Text style={[styles.th, { width: '20%' }]}>Đơn vị chủ trì</Text>
            <Text style={[styles.th, styles.tdCenter, { width: '8%' }]}>
              Phiếu
            </Text>
            <Text style={[styles.th, styles.tdRight, { width: '8%' }]}>
              Điểm TB
            </Text>
            <Text style={[styles.th, styles.tdRight, { width: '8%' }]}>
              Min/Max
            </Text>
          </View>
          {props.projects.map((p) => (
            <View key={p.projectCode} style={styles.tr}>
              <Text
                style={[styles.td, styles.tdCenter, { width: '6%', fontWeight: 'bold' }]}
              >
                {p.rank !== null ? `#${p.rank}` : '—'}
              </Text>
              <Text style={[styles.td, { width: '14%' }]}>{p.projectCode}</Text>
              <Text style={[styles.td, { width: '36%' }]}>{p.projectName}</Text>
              <Text style={[styles.td, { width: '20%' }]}>
                {p.organizationName}
              </Text>
              <Text style={[styles.td, styles.tdCenter, { width: '8%' }]}>
                {p.submittedCount}/{p.totalMembers}
                {p.coiCount > 0 ? ` (+${p.coiCount} COI)` : ''}
              </Text>
              <Text
                style={[styles.td, styles.tdRight, { width: '8%', fontWeight: 'bold' }]}
              >
                {p.averageScore !== null ? p.averageScore.toFixed(2) : '—'}
              </Text>
              <Text style={[styles.td, styles.tdRight, { width: '8%' }]}>
                {p.minScore !== null && p.maxScore !== null
                  ? `${p.minScore.toFixed(1)}/${p.maxScore.toFixed(1)}`
                  : '—'}
              </Text>
            </View>
          ))}
        </View>

        {/* Section III */}
        <Text style={styles.sectionHeader} break>
          III. Nhận xét tổng hợp từng đề án
        </Text>
        {props.projectComments.map((pc) => (
          <View key={pc.projectCode} style={styles.projectBlock} wrap={false}>
            <Text style={styles.projectHeader}>
              {pc.projectCode} — {pc.projectName}
            </Text>
            {pc.scoreSheets.length === 0 ? (
              <Text style={[styles.sheetRow, { fontStyle: 'italic' }]}>
                (Chưa có phiếu chấm nào được nộp)
              </Text>
            ) : (
              pc.scoreSheets.map((s, idx) => (
                <View key={idx} style={{ marginBottom: 4 }}>
                  <Text style={styles.sheetRow}>
                    <Text style={{ fontWeight: 'bold' }}>
                      {s.reviewerName}
                    </Text>{' '}
                    ({s.reviewerRoleLabel}) —{' '}
                    {s.conflictOfInterest ? (
                      <Text style={{ color: '#b45309' }}>
                        Báo cáo COI (xung đột lợi ích) — không tham gia tính
                        điểm
                      </Text>
                    ) : (
                      <Text>
                        Điểm:{' '}
                        <Text style={{ fontWeight: 'bold' }}>
                          {s.totalScore !== null
                            ? s.totalScore.toFixed(2)
                            : '—'}
                        </Text>
                      </Text>
                    )}
                  </Text>
                  {s.comment ? (
                    <Text style={[styles.sheetRow, { fontStyle: 'italic' }]}>
                      {`“${htmlToPlain(s.comment).slice(0, 600)}”`}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ))}

        {/* Section IV */}
        <Text style={styles.sectionHeader}>IV. Kết luận và kiến nghị</Text>
        <Text style={styles.paragraph}>
          Trên cơ sở kết quả chấm điểm của các thành viên hội đồng, hội đồng
          thống nhất xếp hạng các đề án theo điểm trung bình tổng hợp như bảng
          tại Mục II.
        </Text>
        {top3.length > 0 ? (
          <Text style={styles.paragraph}>
            <Text style={{ fontWeight: 'bold' }}>
              Đề nghị Ban Quản lý Chương trình XTTM Quốc gia trình Lãnh đạo Bộ
              xem xét, phê duyệt {top3.length === 1 ? 'đề án' : 'các đề án'} có
              điểm cao nhất:
            </Text>
          </Text>
        ) : null}
        {top3.map((p) => (
          <Text key={p.projectCode} style={[styles.paragraph, { paddingLeft: 12 }]}>
            • {p.projectCode} — {p.projectName} ({p.organizationName}) — Điểm
            trung bình:{' '}
            <Text style={{ fontWeight: 'bold' }}>
              {p.averageScore !== null ? p.averageScore.toFixed(2) : '—'}
            </Text>
            {p.proposedBudget
              ? ` — Dự toán: ${formatNumber(p.proposedBudget)} đồng`
              : ''}
          </Text>
        ))}
        <Text style={styles.paragraph}>
          Hội đồng kính đề nghị Ban Quản lý Chương trình tiếp tục các thủ tục
          tiếp theo theo quy định.
        </Text>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureNoiNhan}>
            <Text style={styles.noiNhanLabel}>Nơi nhận:</Text>
            <Text style={styles.noiNhanItem}>- Lãnh đạo Bộ Công Thương;</Text>
            <Text style={styles.noiNhanItem}>
              - Cục trưởng Cục XTTM (báo cáo);
            </Text>
            <Text style={styles.noiNhanItem}>- Các thành viên hội đồng;</Text>
            <Text style={styles.noiNhanItem}>- Lưu: VT, XTTM.</Text>
          </View>
          <View style={styles.signatureSigner}>
            <Text style={styles.signTitle}>
              {chair ? chair.roleLabel.toUpperCase() : 'CHỦ TỊCH HỘI ĐỒNG'}
            </Text>
            <Text style={[styles.headerSubLine, { fontStyle: 'italic' }]}>
              (Ký, ghi rõ họ tên)
            </Text>
            <View style={styles.signSpace} />
            <Text style={styles.signName}>{chair?.fullName ?? '__________'}</Text>
            {secretary ? (
              <View style={{ marginTop: 18, alignItems: 'center' }}>
                <Text style={[styles.signTitle, { fontSize: 10 }]}>
                  THƯ KÝ HỘI ĐỒNG
                </Text>
                <Text
                  style={[styles.signName, { fontSize: 10, marginTop: 2 }]}
                >
                  {secretary.fullName}
                </Text>
              </View>
            ) : null}
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
