"use client"

import { useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Phone,
    RefreshCw,
    Unplug,
    Activity,
    MessageSquare,
} from "lucide-react"
import { wabaApi, type PhoneNumberDetails } from "@/lib/api/waba-api"
import { useToast } from "@/hooks/use-toast"
import { PhoneNumberCard } from "./phone-number-card"
import { WABAConnectionButton } from "./waba-connection-button"
import { useBusinessAccount } from "@/hooks/use-business-account"

export function WABADashboard() {
    const {
        wabaId,
        wabaConnectionStatus,
        isLoading: sessionLoading,
    } = useBusinessAccount()
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)
    const [disconnecting, setDisconnecting] = useState(false)
    const { toast } = useToast()

    const loadData = async () => {
        if (!wabaId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)

            // Load phone numbers if WABA is connected
            if (wabaConnectionStatus === "connected") {
                const numbers = await wabaApi.getPhoneNumbers(wabaId)
                setPhoneNumbers(numbers)
            }
        } catch (error: any) {
            console.error("Failed to load WABA data:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        if (!wabaId) return

        try {
            setRefreshing(true)

            // Sync phone numbers from Meta if connected
            if (wabaConnectionStatus === "connected") {
                const syncResult = await wabaApi.syncPhoneNumbers(wabaId)
                setPhoneNumbers(syncResult.phoneNumbers)

                // Show detailed sync results
                if (syncResult.added > 0 || syncResult.deleted > 0) {
                    toast({
                        title: "Synced",
                        description: `Synced from Meta: ${syncResult.added} added, ${syncResult.deleted} removed`,
                    })
                } else {
                    toast({
                        title: "Up to date",
                        description: "Phone numbers are up to date",
                    })
                }

                await loadData()
            } else {
                await loadData()
                toast({
                    title: "Refreshed",
                    description: "WABA data refreshed",
                })
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            })
            await loadData()
        } finally {
            setRefreshing(false)
        }
    }

    const handleDisconnect = async () => {
        if (!wabaId) return

        try {
            setDisconnecting(true)
            await wabaApi.disconnect(wabaId, "User requested disconnect")
            toast({
                title: "Disconnected",
                description: "WhatsApp Business Account disconnected",
            })
            setDisconnectDialogOpen(false)

            // Reload page to refresh session
            setTimeout(() => {
                window.location.reload()
            }, 1000)
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            })
        } finally {
            setDisconnecting(false)
        }
    }

    const handleConnectionSuccess = async () => {
        toast({
            title: "Connected",
            description: "WhatsApp connected! Refreshing...",
        })

        // Wait a bit for backend to commit
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Force hard reload to refresh session (bypass cache)
        window.location.href = window.location.href
    }

    useEffect(() => {
        if (!sessionLoading) {
            loadData()
        }
    }, [wabaId, sessionLoading])

    // If no WABA, show setup screen
    if (!wabaId && !loading && !sessionLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            Connect Your WhatsApp Business
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                            Get started by connecting your WhatsApp Business Account to send
                            messages to your customers.
                        </p>
                        <WABAConnectionButton
                            onSuccess={handleConnectionSuccess}
                            enableCoexistence={true}
                        />
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left max-w-md mx-auto">
                            <p className="text-sm font-medium text-blue-800 mb-2">
                                What you can connect:
                            </p>
                            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                <li>New WhatsApp Business Account</li>
                                <li>Existing WhatsApp Business App number (v2.24.17+)</li>
                                <li>You'll choose in the next step</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case "connected":
                return (
                    <Badge
                        variant="outline"
                        className="flex items-center gap-1 border-green-200 bg-green-50 text-green-700"
                    >
                        <CheckCircle className="h-3 w-3" />
                        Connected
                    </Badge>
                )
            case "disconnected":
                return (
                    <Badge
                        variant="outline"
                        className="flex items-center gap-1 border-red-200 bg-red-50 text-red-700"
                    >
                        <XCircle className="h-3 w-3" />
                        Disconnected
                    </Badge>
                )
            case "error":
                return (
                    <Badge
                        variant="outline"
                        className="flex items-center gap-1 border-yellow-200 bg-yellow-50 text-yellow-700"
                    >
                        <AlertCircle className="h-3 w-3" />
                        Error
                    </Badge>
                )
            default:
                return (
                    <Badge variant="outline" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Not Connected
                    </Badge>
                )
        }
    }

    if (loading || sessionLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const isConnected = wabaConnectionStatus === "connected"

    return (
        <div className="space-y-6">
            {/* WABA Status Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>WhatsApp Business Account</CardTitle>
                            <CardDescription>
                                Manage your WhatsApp Business Account connection
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                            />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {!isConnected ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                <Phone className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                                No WhatsApp Account Connected
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                                Connect your WhatsApp Business Account to start sending messages
                                to your customers
                            </p>
                            <WABAConnectionButton onSuccess={handleConnectionSuccess} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Connection Status */}
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold">WhatsApp Connected</h4>
                                            {getStatusBadge(wabaConnectionStatus)}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            WABA ID: <span className="font-mono">{wabaId}</span>
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDisconnectDialogOpen(true)}
                                >
                                    <Unplug className="h-4 w-4 mr-2" />
                                    Disconnect
                                </Button>
                            </div>

                            {/* Connection Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 border rounded-lg">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Phone Numbers
                                        </p>
                                        <p className="text-sm font-medium">{phoneNumbers.length}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 border rounded-lg">
                                    <Activity className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <p className="text-sm font-medium capitalize">
                                            {wabaConnectionStatus}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Phone Numbers */}
            {isConnected && phoneNumbers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Phone Numbers</CardTitle>
                        <CardDescription>
                            Manage your WhatsApp Business phone numbers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {phoneNumbers.map((phoneNumber) => (
                                <PhoneNumberCard
                                    key={phoneNumber.id}
                                    phoneNumber={phoneNumber}
                                    onRefresh={handleRefresh}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Disconnect Confirmation Dialog */}
            <Dialog
                open={disconnectDialogOpen}
                onOpenChange={setDisconnectDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disconnect WhatsApp Business Account?</DialogTitle>
                        <DialogDescription>
                            This will disconnect your WhatsApp Business Account from the
                            platform. You will no longer be able to send or receive messages
                            until you reconnect.
                            <br />
                            <br />
                            Your historical data (messages, templates, customers) will be
                            preserved.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDisconnectDialogOpen(false)}
                            disabled={disconnecting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                        >
                            {disconnecting ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Disconnecting...
                                </>
                            ) : (
                                "Disconnect"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
