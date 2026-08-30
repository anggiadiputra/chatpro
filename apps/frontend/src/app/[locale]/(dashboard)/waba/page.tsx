"use client"

import { useEffect, useState } from "react"
import { Settings, ShieldCheck } from "lucide-react"
import { wabaApi, type PhoneNumberDetails } from "@/lib/api/waba"
import { useBusinessAccount } from "@/hooks/use-business-account"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoleGuard } from "@/components/auth/role-guard"
import { DisconnectModal } from "@/components/disconnect-modal"
import { Header } from "@/components/layout/header"
import { PageHeader } from "@/components/page-header"
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon"
import { EmbeddedSignupCard } from "./components/embedded-signup-card"
import { PhoneNumberCard } from "./components/phone-number-card"
import { QualityMetricsCard } from "./components/quality-metrics-card"
import { WABAConnectionCard } from "./components/waba-connection-card"

export default function WABAPage() {
  const {
    wabaId,
    phoneNumberId,
    isLoading,
    hasWABA,
    isWABAConnected,
    wabaConnectionStatus,
  } = useBusinessAccount()
  const [wabaDetails, setWabaDetails] = useState<any>(null)
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Use isWABAConnected instead of hasWABA to check actual connection status
  const isConnected = isWABAConnected && wabaConnectionStatus === "connected"

  useEffect(() => {
    if (isConnected && wabaId) {
      loadWABADetails()
    }
  }, [isConnected, wabaId])

  const loadWABADetails = async () => {
    if (!wabaId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch phone numbers from database (no sync with Meta)
      const phoneNumbersData = await wabaApi.getPhoneNumbers(wabaId)
      setPhoneNumbers(phoneNumbersData)

      // Set WABA details
      setWabaDetails({
        name: "My Business",
        timezone: "Asia/Jakarta",
        currency: "IDR",
        lastSynced: new Date(),
      })
    } catch (error: any) {
      console.error("Error loading WABA details:", error)
      console.error("Error message:", error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!wabaId) return

    setLoading(true)
    try {
      // Sync phone numbers from Meta when user clicks refresh
      const syncResult = await wabaApi.syncPhoneNumbers(wabaId)
      setPhoneNumbers(syncResult.phoneNumbers)

      // Update WABA details
      setWabaDetails({
        name: "My Business",
        timezone: "Asia/Jakarta",
        currency: "IDR",
        lastSynced: new Date(),
      })
    } catch (error: any) {
      console.error("Error syncing WABA:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDisconnectModal = () => {
    if (!wabaId) {
      console.error("No WABA ID available")
      alert("No WABA ID found. Please refresh the page.")
      return
    }
    setDisconnectModalOpen(true)
  }

  const handleDisconnect = async (mode: "soft" | "hard") => {
    if (!wabaId) {
      console.error("No WABA ID available")
      return
    }

    try {
      setDisconnecting(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
      const response = await fetch(
        `${apiUrl}/api/v1/waba/${wabaId}/disconnect`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mode }),
        }
      )

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        setDisconnectModalOpen(false)

        // Force clear any cached session data
        localStorage.removeItem("waba-session")
        sessionStorage.clear()

        // Hard reload to fetch fresh session
        window.location.href = window.location.href
      } else {
        console.error("Failed to disconnect WABA:", result)
        alert(
          `Failed to disconnect: ${result.error?.message || "Unknown error"}`
        )
      }
    } catch (error) {
      console.error("Error disconnecting WABA:", error)
      alert("An error occurred while disconnecting. Please try again.")
    } finally {
      setDisconnecting(false)
    }
  }

  if (isLoading || loading) {
    return (
      <>
        <Header />
        <div className="space-y-4 p-4">
          <div className="animate-pulse space-y-4">
            <div className="bg-muted h-8 w-64 rounded"></div>
            <div className="bg-muted h-48 w-full rounded"></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-muted h-48 rounded"></div>
              <div className="bg-muted h-48 rounded"></div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Get phone number details from fetched data
  const phoneInfo =
    phoneNumbers.find((phone) => phone.phoneNumberId === phoneNumberId) ||
    phoneNumbers[0] ||
    null

  const wabaInfo =
    isConnected && wabaId
      ? {
          id: wabaId,
          name:
            phoneInfo?.verifiedName || wabaDetails?.name || "WhatsApp Business",
          status: "CONNECTED" as const,
          timezone: wabaDetails?.timezone || "UTC",
          currency: wabaDetails?.currency || "USD",
          lastSynced: wabaDetails?.lastSynced,
        }
      : null

  // Mock quality data for now
  const qualityData = isConnected
    ? {
        overall: "HIGH" as const,
        score: 95,
        templateQuality: "HIGH" as const,
        phoneQuality: "GREEN" as const,
        trend: "UP" as const,
        lastUpdated: new Date(),
      }
    : null

  return (
    <RoleGuard>
      <Header />
      <div className="space-y-6 p-6">
        <PageHeader
          title={
            <div className="flex items-center gap-2.5">
              <WhatsAppIcon size={26} className="text-emerald-600" />
              <span>WhatsApp Business Account</span>
            </div>
          }
          description="Manage your WABA connection, settings, and quality metrics"
        />

        {/* Embedded Signup Card (if not connected) */}
        {!isConnected && (
          <div className="max-w-2xl">
            <EmbeddedSignupCard
              hasWABA={isConnected}
              onSuccess={() => {
                // Reload page after successful connection
                window.location.reload()
              }}
            />
          </div>
        )}

        {/* WABA Management (if connected) */}
        {isConnected && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto md:w-auto">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Settings size={14} />
                Overview
              </TabsTrigger>
              <TabsTrigger value="quality" className="flex items-center gap-2">
                <ShieldCheck size={16} />
                Quality
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <WABAConnectionCard
                wabaInfo={wabaInfo}
                onRefresh={handleRefresh}
                onDisconnect={handleOpenDisconnectModal}
              />
              <PhoneNumberCard phoneInfo={phoneInfo} />
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <QualityMetricsCard metrics={qualityData} />
                <PhoneNumberCard phoneInfo={phoneInfo} />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Disconnect Modal */}
        <DisconnectModal
          isOpen={disconnectModalOpen}
          onClose={() => setDisconnectModalOpen(false)}
          channel="whatsapp"
          onConfirm={handleDisconnect}
          isLoading={disconnecting}
        />
      </div>
    </RoleGuard>
  )
}
