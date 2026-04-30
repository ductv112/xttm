async function main() {
  const constants = await import('../lib/constants');
  const permissions = await import('../lib/permissions');

  const ROLES = ['ADMIN', 'BANQL', 'CHUYENVIEN', 'HOIDONG', 'DONVI', 'TAICHINH', 'LANHDAO'] as const;
  for (const role of ROLES) {
    const items = permissions.getMenuItems(role as any);
    const business = items.filter((i: any) => i.section === 'NGHIEP_VU').length;
    const admin = items.filter((i: any) => i.section === 'QUAN_TRI').length;
    const labels = items.map((i: any) => i.label).join(', ');
    console.log(`${String(role).padEnd(12)} total=${items.length} business=${business} admin=${admin}`);
    console.log(`              labels=[${labels}]`);
  }
  void constants;
}

main().catch((err) => { console.error(err); process.exit(1); });
