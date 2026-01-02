# n8n-nodes-kirimchat

This is an n8n community node for [KirimChat](https://kirim.chat) - a messaging platform that integrates WhatsApp Business API and Instagram DM.

## Features

- **Send Message** - Send text, image, document, audio, video, or template messages via WhatsApp or Instagram
- **Mark as Read** - Mark messages as read and send read receipts
- **Send Typing Indicator** - Show typing indicator to customers

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `@n8n-nodes-kirimchat` and confirm

## Credentials

You need a KirimChat API key to use this node:

1. Log in to your KirimChat dashboard
2. Go to **Settings > Developers > API Keys**
3. Click **Create API Key** and copy the key (shown only once)
4. In n8n, create new credentials for **KirimChat API**
5. Paste your API key (starts with `kc_live_`)

## Operations

### Send Message

Send a message to a customer via WhatsApp or Instagram.

| Parameter | Description |
|-----------|-------------|
| Customer ID | The ID of the customer (e.g., `cust_abc123`) |
| Channel | `whatsapp` or `instagram` |
| Message Type | `text`, `image`, `document`, `audio`, `video`, `template` (WhatsApp) or `text`, `image`, `media_share` (Instagram) |
| Content | Text content for text messages |
| Media URL | URL of media file for media messages |
| Caption | Optional caption for media messages |

**Example Response:**
```json
{
  "success": true,
  "data": {
    "message_id": "msg_xyz789",
    "status": "sent",
    "channel": "whatsapp",
    "timestamp": "2025-11-26T10:31:00.000Z"
  }
}
```

### Mark as Read

Mark a message as read and send read receipt to the customer.

| Parameter | Description |
|-----------|-------------|
| Message ID | The ID of the message to mark as read (e.g., `msg_xyz789`) |

### Send Typing Indicator

Show typing indicator to a customer before sending a message.

| Parameter | Description |
|-----------|-------------|
| Customer ID | The ID of the customer |
| Channel | `whatsapp` or `instagram` |

> **Note:** Rate limited to 1 request per customer per 3 seconds.

## Webhook Trigger

KirimChat supports outbound webhooks for real-time event notifications. Configure webhooks in your KirimChat dashboard under **Settings > Developers > Webhooks**.

### Supported Events

- `message.received` - New message from customer
- `message.sent` - Message sent to customer
- `message.delivered` - Message delivered
- `message.read` - Message read by customer
- `message.failed` - Message delivery failed

### Webhook Payload Example

```json
{
  "event_type": "message.received",
  "event_id": "evt_abc123",
  "timestamp": "2025-11-26T10:30:00.000Z",
  "data": {
    "message_id": "msg_xyz789",
    "customer_id": "cust_123",
    "customer_phone": "+6281234567890",
    "direction": "inbound",
    "message_type": "text",
    "content": "Hello!",
    "channel": "whatsapp"
  }
}
```

### Using with n8n Webhook Node

1. Create a new workflow with **Webhook** trigger node
2. Copy the webhook URL
3. In KirimChat, create a webhook endpoint with this URL
4. Select the events you want to receive
5. Connect the webhook to your KirimChat node for automated responses

## Rate Limits

- **Global:** 100 requests per minute per API key
- **Send Message:** 60 messages per minute per API key
- **Typing Indicator:** 1 request per customer per 3 seconds

## Error Handling

The node returns standard error responses:

| Code | Description |
|------|-------------|
| 401 | Invalid or expired API key |
| 404 | Resource not found |
| 400 | Invalid request or messaging window closed |
| 429 | Rate limit exceeded |

## Resources

- [KirimChat Documentation](https://kirim.chat/developers)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## License

MIT
