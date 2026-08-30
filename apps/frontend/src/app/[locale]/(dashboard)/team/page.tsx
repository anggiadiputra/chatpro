"use client"

import { useEffect, useState } from "react"
import { Plus, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { useBusinessAccount } from "@/hooks/use-business-account"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RoleGuard } from "@/components/auth/role-guard"
import { Header } from "@/components/layout/header"
import { InviteAgentDialog } from "./components/invite-agent-dialog"
import { PendingInvitations } from "./components/pending-invitations"
import { TeamMembersList } from "./components/team-members-list"

interface TeamMember {
  id: string
  agentUserId: string | null
  status: "PENDING" | "ACTIVE" | "REMOVED"
  invitedAt: string
  joinedAt: string | null
  agent: {
    id: string
    name: string
    email: string
  } | null
}

interface Invitation {
  id: string
  email: string
  status: string
  createdAt: string
  expiresAt: string
}

interface AgentLimit {
  currentCount: number
  limit: number
  tier: string
  canInvite: boolean
}

export default function TeamPage() {
  const t = useTranslations("team")
  const { userId, userRole, isLoading: isLoadingAccount } = useBusinessAccount()

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [agentLimit, setAgentLimit] = useState<AgentLimit | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"

  const loadTeamData = async () => {
    try {
      const [membersRes, invitationsRes, limitRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/team/members`, { credentials: "include" }),
        fetch(`${apiUrl}/api/v1/team/invitations`, { credentials: "include" }),
        fetch(`${apiUrl}/api/v1/team/limit`, { credentials: "include" }),
      ])

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        setTeamMembers(membersData.data || [])
      }

      if (invitationsRes.ok) {
        const invitationsData = await invitationsRes.json()
        setInvitations(invitationsData.data || [])
      }

      if (limitRes.ok) {
        const limitData = await limitRes.json()
        setAgentLimit(limitData.data)
      }
    } catch (error) {
      console.error("Error loading team data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoadingAccount && userId && userRole === "BUSINESS_OWNER") {
      loadTeamData()
    } else if (!isLoadingAccount) {
      setLoading(false)
    }
  }, [userId, userRole, isLoadingAccount])

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/team/members/${memberId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (response.ok) {
        toast({ title: t("members.removeSuccess") })
        loadTeamData()
      } else {
        toast({ title: t("members.removeError"), variant: "destructive" })
      }
    } catch (error) {
      toast({ title: t("members.removeError"), variant: "destructive" })
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/team/invitations/${invitationId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (response.ok) {
        toast({ title: t("invitations.cancelSuccess") })
        loadTeamData()
      } else {
        toast({ title: t("invitations.cancelError"), variant: "destructive" })
      }
    } catch (error) {
      toast({ title: t("invitations.cancelError"), variant: "destructive" })
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/team/invitations/${invitationId}/resend`,
        {
          method: "POST",
          credentials: "include",
        }
      )

      if (response.ok) {
        toast({ title: t("invitations.resendSuccess") })
      } else {
        toast({ title: t("invitations.resendError"), variant: "destructive" })
      }
    } catch (error) {
      toast({ title: t("invitations.resendError"), variant: "destructive" })
    }
  }

  const handleInviteSuccess = () => {
    setInviteDialogOpen(false)
    loadTeamData()
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="space-y-4 p-4">
          <div className="animate-pulse space-y-4">
            <div className="bg-muted h-8 w-48 rounded"></div>
            <div className="bg-muted h-64 w-full rounded"></div>
          </div>
        </div>
      </>
    )
  }

  // Filter active members only
  const activeMembers = teamMembers.filter((m) => m.status === "ACTIVE")

  return (
    <RoleGuard>
      <Header />
      <div className="space-y-6 p-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("invite.button")}
          </Button>
        </div>

        {/* Team Members Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("members.title")}
            </CardTitle>
            {agentLimit && (
              <CardDescription>
                {t("invite.currentCount", {
                  current: agentLimit.currentCount,
                  limit: agentLimit.limit,
                })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <TeamMembersList
              members={activeMembers}
              onRemove={handleRemoveMember}
            />
          </CardContent>
        </Card>

        {/* Pending Invitations Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("invitations.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingInvitations
              invitations={invitations}
              onCancel={handleCancelInvitation}
              onResend={handleResendInvitation}
            />
          </CardContent>
        </Card>
      </div>

      {/* Invite Agent Dialog */}
      <InviteAgentDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={handleInviteSuccess}
        agentLimit={agentLimit}
      />
    </RoleGuard>
  )
}
