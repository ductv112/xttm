// /cau-hinh — System config admin page (Plan 02-07)
// Server Component:
//   - auth + can('cau-hinh','read') redirect (defense-in-depth)
//   - Pre-fetch SystemConfig from DB and group by category
//   - Render 3 tabs: SLA params / Email templates (5) / SMS templates (3)
// CONFIG-01 + CONFIG-02 entry point.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { can, defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { SLA_THRESHOLDS } from '@/lib/constants';
import {
  EMAIL_TEMPLATE_KEYS,
  SMS_TEMPLATE_KEYS,
  type EmailTemplate,
  type SmsTemplate,
  type SLAParams,
  type EmailTemplateKey,
  type SmsTemplateKey,
} from '@/lib/system-config';
import { prisma } from '@/lib/prisma';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

import { SLAConfigForm } from './_components/SLAConfigForm';
import { EmailTemplateEditor } from './_components/EmailTemplateEditor';
import { SmsTemplateEditor } from './_components/SmsTemplateEditor';

export const metadata = { title: 'Cấu hình hệ thống' };

export default async function CauHinhPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (!can(session.user.role as Role, 'cau-hinh', 'read')) {
    redirect(defaultLandingPath(session.user.role as Role));
  }

  // Pre-fetch all SystemConfig rows (1 query)
  const rows = await prisma.systemConfig.findMany({
    where: { category: { in: ['SLA', 'EMAIL', 'SMS'] } },
  });

  let sla: SLAParams = { ...SLA_THRESHOLDS };
  const emailTemplates: Partial<Record<EmailTemplateKey, EmailTemplate>> = {};
  const smsTemplates: Partial<Record<SmsTemplateKey, SmsTemplate>> = {};

  for (const row of rows) {
    try {
      const value = JSON.parse(row.valueJson);
      if (row.key === 'sla.params') {
        sla = { ...SLA_THRESHOLDS, ...value };
      } else if (row.key.startsWith('email.template.')) {
        const k = row.key.slice('email.template.'.length) as EmailTemplateKey;
        if ((EMAIL_TEMPLATE_KEYS as readonly string[]).includes(k)) {
          emailTemplates[k] = value as EmailTemplate;
        }
      } else if (row.key.startsWith('sms.template.')) {
        const k = row.key.slice('sms.template.'.length) as SmsTemplateKey;
        if ((SMS_TEMPLATE_KEYS as readonly string[]).includes(k)) {
          smsTemplates[k] = value as SmsTemplate;
        }
      }
    } catch {
      // Skip malformed JSON — getSystemConfig() also tolerant
    }
  }

  // Ensure every key has a default object so editors render forms
  for (const k of EMAIL_TEMPLATE_KEYS) {
    if (!emailTemplates[k]) {
      emailTemplates[k] = {
        subject: '',
        honorific: 'KINH_GUI_QUY_DON_VI',
        bodyHtml: '<p></p>',
      };
    }
  }
  for (const k of SMS_TEMPLATE_KEYS) {
    if (!smsTemplates[k]) {
      smsTemplates[k] = { body: '' };
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Cấu hình hệ thống
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Tham số cảnh báo SLA và mẫu thông báo email/SMS toàn hệ thống
        </p>
      </header>

      <Tabs defaultValue="sla">
        <TabsList>
          <TabsTrigger value="sla">Tham số SLA</TabsTrigger>
          <TabsTrigger value="email">Mẫu Email</TabsTrigger>
          <TabsTrigger value="sms">Mẫu SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="sla" className="mt-4">
          <SLAConfigForm initialData={sla} />
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <EmailTemplateEditor
            templates={emailTemplates as Record<EmailTemplateKey, EmailTemplate>}
          />
        </TabsContent>

        <TabsContent value="sms" className="mt-4">
          <SmsTemplateEditor
            templates={smsTemplates as Record<SmsTemplateKey, SmsTemplate>}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
