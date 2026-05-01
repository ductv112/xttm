import * as React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import { formatVNDCompact, formatDate } from '../../format';

export type DashboardPdfStats = {
  projectCount: number;
  registeredProjectCount: number;
  approvedProjectCount: number;
  inProgressProjectCount: number;
  completedProjects: number;
  registeredBudget: number;
  approvedBudget: number;
  signedBudget: number;
  disbursedBudget: number;
  orgCount: number;
  orgApprovedCount: number;
  completionPercent: number;
};

export type DashboardPdfAlert = {
  code: string;
  name: string;
  detail: string;
};

export type DashboardSummaryPdfProps = {
  year: number;
  exportedBy: string;
  exportedAt: Date;
  stats: DashboardPdfStats;
  alertBudgetVariance: DashboardPdfAlert[];
  alertContractDelay: DashboardPdfAlert[];
  alertReportOverdue: DashboardPdfAlert[];
  alertConsulate: DashboardPdfAlert[];
  chartByKind: Array<{ kindLabel: string; count: number }>;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 11,
    padding: 36,
    color: '#0f172a',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    color: '#1d4ed8',
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    color: '#475569',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 8,
    color: '#0f172a',
    borderBottom: '1pt solid #cbd5e1',
    paddingBottom: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  statCard: {
    width: '50%',
    padding: 6,
  },
  statCardInner: {
    border: '1pt solid #e2e8f0',
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f8fafc',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  alertHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#b91c1c',
    marginTop: 8,
    marginBottom: 4,
  },
  alertEmpty: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
  },
  alertItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  alertCode: {
    width: 90,
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertText: {
    flex: 1,
    fontSize: 10,
  },
  table: {
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e2e8f0',
    paddingVertical: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontWeight: 'bold',
  },
  tableCellLabel: {
    flex: 1,
    fontSize: 10,
    paddingHorizontal: 4,
  },
  tableCellValue: {
    width: 80,
    fontSize: 10,
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 6,
  },
});

function StatCardItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardInner}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

function AlertList({
  title,
  items,
}: {
  title: string;
  items: DashboardPdfAlert[];
}) {
  return (
    <View>
      <Text style={styles.alertHeader}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.alertEmpty}>Không có cảnh báo</Text>
      ) : (
        items.slice(0, 5).map((it, idx) => (
          <View key={idx} style={styles.alertItem}>
            <Text style={styles.alertCode}>{it.code}</Text>
            <Text style={styles.alertText}>
              {it.name} — {it.detail}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export function DashboardSummary({
  year,
  exportedBy,
  exportedAt,
  stats,
  alertBudgetVariance,
  alertContractDelay,
  alertReportOverdue,
  alertConsulate,
  chartByKind,
}: DashboardSummaryPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>BÁO CÁO TỔNG QUAN DASHBOARD XTTMQG</Text>
        <Text style={styles.subtitle}>
          Năm {year} — Xuất bởi {exportedBy} lúc {formatDate(exportedAt)}
        </Text>

        <Text style={styles.sectionTitle}>I. Chỉ số chính</Text>
        <View style={styles.statsGrid}>
          <StatCardItem
            label="Tổng số đề án"
            value={`${stats.projectCount}`}
          />
          <StatCardItem
            label="Đề án đã phê duyệt"
            value={`${stats.approvedProjectCount}`}
          />
          <StatCardItem
            label="Đang triển khai"
            value={`${stats.inProgressProjectCount}`}
          />
          <StatCardItem
            label="Đã nghiệm thu"
            value={`${stats.completedProjects}`}
          />
          <StatCardItem
            label="Kinh phí đăng ký"
            value={formatVNDCompact(stats.registeredBudget)}
          />
          <StatCardItem
            label="Kinh phí phê duyệt"
            value={formatVNDCompact(stats.approvedBudget)}
          />
          <StatCardItem
            label="Kinh phí hợp đồng"
            value={formatVNDCompact(stats.signedBudget)}
          />
          <StatCardItem
            label="Kinh phí giải ngân"
            value={formatVNDCompact(stats.disbursedBudget)}
          />
          <StatCardItem
            label="Đơn vị tham gia"
            value={`${stats.orgCount}`}
          />
          <StatCardItem
            label="Tỷ lệ hoàn thành"
            value={`${stats.completionPercent}%`}
          />
        </View>

        <Text style={styles.sectionTitle}>II. Cảnh báo</Text>
        <AlertList
          title="• Sai lệch ngân sách"
          items={alertBudgetVariance}
        />
        <AlertList title="• Chậm ký hợp đồng" items={alertContractDelay} />
        <AlertList title="• Báo cáo trễ hạn" items={alertReportOverdue} />
        <AlertList
          title="• Đề án quốc tế chưa liên hệ thương vụ"
          items={alertConsulate}
        />

        <Text style={styles.sectionTitle}>III. Đề án theo loại</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCellLabel}>Loại đề án</Text>
            <Text style={styles.tableCellValue}>Số lượng</Text>
          </View>
          {chartByKind.length === 0 ? (
            <Text style={styles.alertEmpty}>Không có dữ liệu</Text>
          ) : (
            chartByKind.map((k, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>{k.kindLabel}</Text>
                <Text style={styles.tableCellValue}>{k.count}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.footer}>
          Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại — Cục
          XTTM, Bộ Công Thương
        </Text>
      </Page>
    </Document>
  );
}

export default DashboardSummary;
