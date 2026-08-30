"use client"

import { useTranslations } from "next-intl"
import { useBrandingContext } from "@/components/branding-provider"

export default function PrivacyPage() {
  const t = useTranslations("privacy")
  const { websiteName, supportEmail } = useBrandingContext()
  const appName = websiteName || process.env.NEXT_PUBLIC_APP_NAME || "Platform"
  const email = supportEmail || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com"

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <h1>{t("title")}</h1>
      <p className="text-muted-foreground">{t("lastUpdated")}: December 18, 2025</p>

      <section>
        <h2>{t("sections.introduction.title")}</h2>
        <p>{t("sections.introduction.content", { appName })}</p>
      </section>

      <section>
        <h2>{t("sections.dataCollection.title")}</h2>
        <p>{t("sections.dataCollection.intro")}</p>
        <ul>
          <li><strong>{t("sections.dataCollection.items.account.title")}:</strong> {t("sections.dataCollection.items.account.description")}</li>
          <li><strong>{t("sections.dataCollection.items.usage.title")}:</strong> {t("sections.dataCollection.items.usage.description")}</li>
          <li><strong>{t("sections.dataCollection.items.messages.title")}:</strong> {t("sections.dataCollection.items.messages.description")}</li>
          <li><strong>{t("sections.dataCollection.items.device.title")}:</strong> {t("sections.dataCollection.items.device.description")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("sections.dataUsage.title")}</h2>
        <p>{t("sections.dataUsage.intro")}</p>
        <ul>
          <li>{t("sections.dataUsage.items.provide")}</li>
          <li>{t("sections.dataUsage.items.improve")}</li>
          <li>{t("sections.dataUsage.items.communicate")}</li>
          <li>{t("sections.dataUsage.items.security")}</li>
          <li>{t("sections.dataUsage.items.legal")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("sections.dataSharing.title")}</h2>
        <p>{t("sections.dataSharing.intro")}</p>
        <ul>
          <li><strong>{t("sections.dataSharing.items.providers.title")}:</strong> {t("sections.dataSharing.items.providers.description")}</li>
          <li><strong>{t("sections.dataSharing.items.legal.title")}:</strong> {t("sections.dataSharing.items.legal.description")}</li>
          <li><strong>{t("sections.dataSharing.items.business.title")}:</strong> {t("sections.dataSharing.items.business.description")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("sections.dataSecurity.title")}</h2>
        <p>{t("sections.dataSecurity.content")}</p>
      </section>

      <section>
        <h2>{t("sections.userRights.title")}</h2>
        <p>{t("sections.userRights.intro")}</p>
        <ul>
          <li>{t("sections.userRights.items.access")}</li>
          <li>{t("sections.userRights.items.correction")}</li>
          <li>{t("sections.userRights.items.deletion")}</li>
          <li>{t("sections.userRights.items.portability")}</li>
          <li>{t("sections.userRights.items.withdraw")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("sections.cookies.title")}</h2>
        <p>{t("sections.cookies.content")}</p>
      </section>

      <section>
        <h2>{t("sections.changes.title")}</h2>
        <p>{t("sections.changes.content")}</p>
      </section>

      <section>
        <h2>{t("sections.contact.title")}</h2>
        <p>{t("sections.contact.content")}</p>
        <p>Email: <a href={`mailto:${email}`}>{email}</a></p>
      </section>
    </article>
  )
}
