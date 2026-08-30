"use client"

import { useState } from "react"
import { MessageCircle, Instagram, Mail, Brain, CreditCard } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DuitkuSettingsForm } from "./components/duitku-settings-form"
import { InstagramSettingsForm } from "./components/instagram-settings-form"
import { OpenAISettingsForm } from "./components/openai-settings-form"
import { SmtpSettingsForm } from "./components/smtp-settings-form"
import { WhatsAppSettingsForm } from "./components/whatsapp-settings-form"

type SettingsTab = "whatsapp" | "instagram" | "smtp" | "openai" | "duitku"

const tabs = [
  { id: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
  { id: "instagram" as const, label: "Instagram", icon: Instagram },
  { id: "smtp" as const, label: "Email", icon: Mail },
  { id: "openai" as const, label: "OpenAI", icon: Brain },
  { id: "duitku" as const, label: "Payment", icon: CreditCard },
]

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("whatsapp")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure channel integrations and API credentials
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as SettingsTab)}
      >
        <TabsList className="grid w-full grid-cols-5 lg:inline-flex lg:w-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppSettingsForm />
        </TabsContent>

        <TabsContent value="instagram" className="mt-6">
          <InstagramSettingsForm />
        </TabsContent>

        <TabsContent value="smtp" className="mt-6">
          <SmtpSettingsForm />
        </TabsContent>

        <TabsContent value="openai" className="mt-6">
          <OpenAISettingsForm />
        </TabsContent>

        <TabsContent value="duitku" className="mt-6">
          <DuitkuSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
