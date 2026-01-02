"use client"

import { useTranslations } from "next-intl"

export default function TermsPage() {
  const t = useTranslations("terms")
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Kirim.Chat"

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <h1>{t("title")}</h1>
      <p className="text-muted-foreground">{t("lastUpdated")}: December 18, 2025</p>

      <section>
        <h2>{t("sections.acceptance.title")}</h2>
        <p>{t("sections.acceptance.content", { appName })}</p>
      </section>

      <section>
        <h2>{t("sections.services.title")}</h2>
        <p>{t("sections.services.intro", { appName })}</p>
        <ul>
          <li>{t("sections.services.items.messaging")}</li>
          <li>{t("sections.services.items.integration")}</li>
          <li>{t("sections.services.items.analytics")}</li>
          <li>{t("sections.services.items.automation")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("sections.accounts.title")}</h2>
        <p>{t("sections.accounts.intro")}</p>
        <ul>
          <li>{t("sections.accounts.items.accurate")}</li>
          <li>{t("sections.accounts.items.security")}</li>
          <li>{t("sections.accounts.items.notify")}</li>
          <li>{t("sections.accounts.items.responsible")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("sections.usage.title")}</h2>
        <p>{t("sections.usage.intro")}</p>
        <ul>
          <li>{t("sections.usage.items.laws")}</li>
          <li>{t("sections.usage.items.spam")}</li>
          <li>{t("sections.usage.items.harmful")}</li>
          <li>{t("sections.usage.items.interfere")}</li>
          <li>{t("sections.usage.items.reverse")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("sections.payment.title")}</h2>
        <p>{t("sections.payment.content")}</p>
      </section>

      <section>
        <h2>{t("sections.intellectual.title")}</h2>
        <p>{t("sections.intellectual.content", { appName })}</p>
      </section>

      <section>
        <h2>{t("sections.termination.title")}</h2>
        <p>{t("sections.termination.content")}</p>
      </section>

      <section>
        <h2>{t("sections.disclaimer.title")}</h2>
        <p>{t("sections.disclaimer.content")}</p>
      </section>

      <section>
        <h2>{t("sections.limitation.title")}</h2>
        <p>{t("sections.limitation.content", { appName })}</p>
      </section>

      <section>
        <h2>{t("sections.changes.title")}</h2>
        <p>{t("sections.changes.content")}</p>
      </section>

      <section>
        <h2>{t("sections.contact.title")}</h2>
        <p>{t("sections.contact.content")}</p>
        <p>Email: <a href="mailto:legal@kirim.chat">legal@kirim.chat</a></p>
      </section>
    </article>
  )
}
