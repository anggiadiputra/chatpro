"use client"

import { useState } from "react"
import { Link } from "@/i18n/routing"
import {
  Key,
  Webhook,
  Code,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RoleGuard } from "@/components/auth/role-guard"

function CodeBlock({
  code,
  language = "json",
}: {
  code: string
  language?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <pre className="bg-muted overflow-x-auto rounded-md p-4 text-xs">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  )
}

export default function DevelopersPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"

  return (
    <RoleGuard>
      <div className="flex w-full flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Developers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold">Developers</h2>
            <p className="text-muted-foreground text-sm">
              Integrate KirimChat with your applications using our API and
              webhooks
            </p>
          </div>
        </div>
      </div>

      <div className="my-8 w-full max-w-6xl space-y-6">
        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/developers/api-keys">
            <Card className="hover:bg-accent h-full cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
                <CardDescription>
                  Create and manage API keys for secure authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Generate API keys to authenticate requests to the KirimChat
                  Public API. Use Bearer token authentication to send messages,
                  manage contacts, and more.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/developers/webhooks">
            <Card className="hover:bg-accent h-full cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhooks
                </CardTitle>
                <CardDescription>
                  Configure webhooks to receive real-time event notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Set up webhook endpoints to receive instant notifications when
                  events occur, such as incoming messages, delivery status, and
                  read receipts.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Documentation
            </CardTitle>
            <CardDescription>
              Learn how to integrate with KirimChat API and webhooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {/* Webhooks Documentation */}
              <AccordionItem value="webhooks-overview">
                <AccordionTrigger>Webhooks Overview</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-muted-foreground">
                    Webhooks allow you to receive real-time notifications when
                    events occur in KirimChat. When an event happens (like
                    receiving a message), we&apos;ll send an HTTP POST request
                    to your configured URL with the event data.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium">Available Events:</p>
                    <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                      <li>
                        <code className="bg-muted rounded px-1">
                          message.received
                        </code>{" "}
                        - New incoming message
                      </li>
                      <li>
                        <code className="bg-muted rounded px-1">
                          message.sent
                        </code>{" "}
                        - Message sent successfully
                      </li>
                      <li>
                        <code className="bg-muted rounded px-1">
                          message.delivered
                        </code>{" "}
                        - Message delivered to recipient
                      </li>
                      <li>
                        <code className="bg-muted rounded px-1">
                          message.read
                        </code>{" "}
                        - Message read by recipient
                      </li>
                      <li>
                        <code className="bg-muted rounded px-1">
                          message.failed
                        </code>{" "}
                        - Message delivery failed
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="webhook-payload">
                <AccordionTrigger>Webhook Payload Format</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-muted-foreground">
                    Each webhook request includes the following structure:
                  </p>
                  <CodeBlock
                    code={`{
  "event": "message.received",
  "timestamp": "2025-11-27T10:30:00Z",
  "data": {
    "message_id": "msg_xyz789",
    "customer_id": "cust_123",
    "customer_phone": "+6281234567890",
    "customer_username": "john_doe",
    "channel": "whatsapp",
    "direction": "inbound",
    "message_type": "text",
    "content": "Hello, I need help!",
    "media_url": null
  }
}`}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="webhook-security">
                <AccordionTrigger>
                  Webhook Security (HMAC Signatures)
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-muted-foreground">
                    All webhook requests include an HMAC-SHA256 signature in the{" "}
                    <code className="bg-muted rounded px-1">
                      X-Webhook-Signature
                    </code>{" "}
                    header to verify the request authenticity.
                  </p>

                  <Alert>
                    <AlertDescription>
                      <strong>Important:</strong> Always verify the webhook
                      signature before processing events to ensure they came
                      from KirimChat.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <p className="font-medium">Verification Steps:</p>
                    <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
                      <li>Get the webhook secret from your webhook settings</li>
                      <li>Read the raw request body as a string</li>
                      <li>
                        Calculate HMAC-SHA256 hash using the secret and body
                      </li>
                      <li>
                        Compare with the{" "}
                        <code className="bg-muted rounded px-1">
                          X-Webhook-Signature
                        </code>{" "}
                        header
                      </li>
                    </ol>
                  </div>

                  <p className="text-muted-foreground text-sm font-medium">
                    Example (Node.js):
                  </p>
                  <CodeBlock
                    language="javascript"
                    code={`const crypto = require('crypto');

function verifyWebhookSignature(body, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(signature)
  );
}

// Express.js example
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const body = req.body.toString();

  if (!verifyWebhookSignature(body, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(403).send('Invalid signature');
  }

  const event = JSON.parse(body);
  // Process the event...

  res.status(200).send('OK');
});`}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Public API Documentation */}
              <AccordionItem value="api-authentication">
                <AccordionTrigger>API Authentication</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-muted-foreground">
                    Use Bearer token authentication with your API key to make
                    requests to the KirimChat Public API.
                  </p>

                  <div className="space-y-2">
                    <p className="font-medium">Authentication Header:</p>
                    <CodeBlock
                      code={`Authorization: Bearer kc_live_your_api_key_here`}
                    />
                  </div>

                  <Alert>
                    <AlertDescription>
                      <strong>Important:</strong> Keep your API keys secure.
                      Never commit them to version control or expose them in
                      client-side code.
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="send-message">
                <AccordionTrigger>Send Message API</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-muted-foreground">
                    Send messages to customers via WhatsApp or Instagram.
                  </p>

                  <div className="space-y-2">
                    <p className="font-medium">Endpoint:</p>
                    <CodeBlock code={`POST /api/v1/public/messages/send`} />
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">Request Headers:</p>
                    <CodeBlock
                      code={`Authorization: Bearer kc_live_your_api_key
Content-Type: application/json`}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">
                      Request Body (WhatsApp Text Message):
                    </p>
                    <CodeBlock
                      code={`{
  "customer_id": "cust_abc123",
  "channel": "whatsapp",
  "message_type": "text",
  "content": "Hello! How can I help you today?"
}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">
                      Request Body (Instagram Text Message):
                    </p>
                    <CodeBlock
                      code={`{
  "customer_id": "cust_abc123",
  "channel": "instagram",
  "message_type": "text",
  "content": "Thanks for your message!"
}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">Response (Success):</p>
                    <CodeBlock
                      code={`{
  "success": true,
  "data": {
    "message_id": "msg_xyz789",
    "status": "sent",
    "channel": "whatsapp",
    "timestamp": "2025-11-27T10:30:00.000Z"
  }
}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">Available Message Types:</p>
                    <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                      <li>
                        <strong>WhatsApp:</strong> text, image, document, audio,
                        video, template
                      </li>
                      <li>
                        <strong>Instagram:</strong> text, image, media_share
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="error-handling">
                <AccordionTrigger>Error Handling</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-muted-foreground">
                    The API uses standard HTTP status codes and returns JSON
                    error responses.
                  </p>

                  <div className="space-y-2">
                    <p className="font-medium">Common Error Codes:</p>
                    <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                      <li>
                        <code className="bg-muted rounded px-1">400</code> - Bad
                        Request (validation error)
                      </li>
                      <li>
                        <code className="bg-muted rounded px-1">401</code> -
                        Unauthorized (invalid API key)
                      </li>
                      <li>
                        <code className="bg-muted rounded px-1">403</code> -
                        Forbidden (permission denied)
                      </li>
                      <li>
                        <code className="bg-muted rounded px-1">404</code> - Not
                        Found (resource not found)
                      </li>
                      <li>
                        <code className="bg-muted rounded px-1">429</code> - Too
                        Many Requests (rate limit exceeded)
                      </li>
                      <li>
                        <code className="bg-muted rounded px-1">500</code> -
                        Internal Server Error
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">Error Response Format:</p>
                    <CodeBlock
                      code={`{
  "error": {
    "code": "ValidationError",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "customer_id",
        "message": "customer_id is required"
      }
    ]
  }
}`}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* n8n Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
              n8n Integration
            </CardTitle>
            <CardDescription>
              Connect KirimChat with n8n for powerful workflow automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="n8n-installation">
                <AccordionTrigger>Installation</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="font-medium">Community Nodes (Recommended)</p>
                    <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
                      <li>
                        Go to <strong>Settings &gt; Community Nodes</strong>
                      </li>
                      <li>
                        Select <strong>Install</strong>
                      </li>
                      <li>
                        Enter{" "}
                        <code className="bg-muted rounded px-1">
                          @kichat/n8n-nodes-kirimchat
                        </code>{" "}
                        and confirm
                      </li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="n8n-credentials">
                <AccordionTrigger>Credentials Setup</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-muted-foreground">
                    You need a KirimChat API key to use this node:
                  </p>
                  <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
                    <li>Log in to your KirimChat dashboard</li>
                    <li>
                      Go to{" "}
                      <strong>Settings &gt; Developers &gt; API Keys</strong>
                    </li>
                    <li>
                      Click <strong>Create API Key</strong> and copy the key
                      (shown only once)
                    </li>
                    <li>
                      In n8n, create new credentials for{" "}
                      <strong>KirimChat API</strong>
                    </li>
                    <li>
                      Paste your API key (starts with{" "}
                      <code className="bg-muted rounded px-1">kc_live_</code>)
                    </li>
                  </ol>
                  <Alert className="mt-3">
                    <AlertDescription>
                      <strong>Tip:</strong> You can create an API key directly
                      from the{" "}
                      <Link
                        href="/developers/api-keys"
                        className="text-primary hover:underline"
                      >
                        API Keys page
                      </Link>
                      .
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">API Base URL</p>
                <code className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs">
                  {apiBaseUrl}/api/v1/public
                </code>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-muted-foreground text-sm">
                Need help? Check out our{" "}
                <Link
                  href="/developers/api-keys"
                  className="text-primary hover:underline"
                >
                  API Keys
                </Link>{" "}
                and{" "}
                <Link
                  href="/developers/webhooks"
                  className="text-primary hover:underline"
                >
                  Webhooks
                </Link>{" "}
                pages for more information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
