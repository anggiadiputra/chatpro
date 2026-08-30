import { Header } from "@/components/layout/header"
import { PageHeader } from "@/components/page-header"
import Overview from "../boards/overview"
import DashboardActions from "../components/dashboard-actions"

export default async function DashboardPage() {
  return (
    <>
      <Header />

      <div className="space-y-6 p-6">
        <PageHeader
          title="Dashboard"
          description="Overview and analytics of your WhatsApp Business account"
        >
          <DashboardActions />
        </PageHeader>
        <Overview />
      </div>
    </>
  )
}
