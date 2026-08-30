"use client"

import { useState } from "react"
import { Users } from "lucide-react"
import { useBusinessAccount } from "@/hooks/use-business-account"
import { useCustomers } from "@/hooks/use-customers"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { PageHeader } from "@/components/page-header"
import { CustomerViewDrawer } from "./components/customer-view-drawer"
import { columns } from "./components/customers-columns"
import { CustomersMutateDrawer } from "./components/customers-mutate-drawer"
import { CustomersPrimaryActions } from "./components/customers-primary-actions"
import { CustomersTable } from "./components/customers-table"
import { Customer } from "./data/schema"

export default function CustomersPage() {
  const { userId, isLoading: isLoadingAccount } = useBusinessAccount()

  // Use TanStack Query for customers data with caching
  // Requirements: 4.1, 4.3, 4.4
  const {
    data: customersData = [],
    isLoading: customersLoading,
    isFetching,
  } = useCustomers(undefined, !isLoadingAccount && !!userId)

  // Transform data to match frontend schema
  const customers: Customer[] = customersData.map((customer: any) => ({
    ...customer,
    consentStatus:
      typeof customer.consentStatus === "boolean"
        ? customer.consentStatus
          ? "CONSENTED"
          : "NOT_CONSENTED"
        : customer.consentStatus,
  }))

  // Drawer states
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  )

  const loading = isLoadingAccount || customersLoading

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setViewDrawerOpen(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditDrawerOpen(true)
  }

  // Show loading skeleton only on initial load, not on background refetch
  if (loading && customers.length === 0) {
    return (
      <>
        <Header />
        <div className="space-y-6 p-6">
          <div className="animate-pulse space-y-4">
            <div className="bg-muted h-8 w-48 rounded"></div>
            <div className="bg-muted h-64 w-full rounded"></div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="space-y-6 p-6">
        <PageHeader
          title={
            <div className="flex items-center gap-2">
              <span>Customers</span>
              {isFetching && !loading && (
                <span className="text-muted-foreground animate-pulse text-xs font-normal">
                  Updating...
                </span>
              )}
            </div>
          }
          description="Manage your WhatsApp contacts and consent preferences"
        >
          <CustomersPrimaryActions />
        </PageHeader>

        {customers.length === 0 && !loading ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No customers yet</h3>
              <p className="text-muted-foreground mb-4 text-center text-sm">
                Add your first customer to start sending WhatsApp messages
              </p>
              <CustomersPrimaryActions />
            </CardContent>
          </Card>
        ) : (
          <div className="flex-1">
            <CustomersTable
              data={customers}
              columns={columns}
              onView={handleViewCustomer}
              onEdit={handleEditCustomer}
            />
          </div>
        )}
      </div>

      {/* Drawers */}
      <CustomerViewDrawer
        open={viewDrawerOpen}
        onOpenChange={setViewDrawerOpen}
        customer={selectedCustomer}
      />
      <CustomersMutateDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        currentRow={selectedCustomer || undefined}
      />
    </>
  )
}
