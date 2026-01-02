import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class KirimChat implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KirimChat',
		name: 'kirimChat',
		icon: 'file:kirimchat.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Send WhatsApp & Instagram messages, mark as read, and send typing indicators',
		defaults: {
			name: 'KirimChat',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'kirimChatApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a message to a customer via WhatsApp or Instagram',
						action: 'Send a message',
					},
					{
						name: 'Mark as Read',
						value: 'markAsRead',
						description: 'Mark a message as read',
						action: 'Mark a message as read',
					},
					{
						name: 'Send Typing Indicator',
						value: 'sendTyping',
						description: 'Send typing indicator to show you are typing',
						action: 'Send typing indicator',
					},
				],
				default: 'sendMessage',
			},

			// Send Message Fields
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				default: '',
				description: 'The ID of the customer to send the message to',
				placeholder: 'cust_abc123',
			},
			{
				displayName: 'Channel',
				name: 'channel',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				options: [
					{
						name: 'WhatsApp',
						value: 'whatsapp',
					},
					{
						name: 'Instagram',
						value: 'instagram',
					},
				],
				default: 'whatsapp',
				description: 'The messaging channel to use',
			},
			{
				displayName: 'Message Type',
				name: 'messageType',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage'],
						channel: ['whatsapp'],
					},
				},
				options: [
					{
						name: 'Text',
						value: 'text',
					},
					{
						name: 'Image',
						value: 'image',
					},
					{
						name: 'Document',
						value: 'document',
					},
					{
						name: 'Audio',
						value: 'audio',
					},
					{
						name: 'Video',
						value: 'video',
					},
					{
						name: 'Template',
						value: 'template',
					},
				],
				default: 'text',
				description: 'The type of message to send (WhatsApp)',
			},
			{
				displayName: 'Message Type',
				name: 'messageType',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage'],
						channel: ['instagram'],
					},
				},
				options: [
					{
						name: 'Text',
						value: 'text',
					},
					{
						name: 'Image',
						value: 'image',
					},
					{
						name: 'Media Share',
						value: 'media_share',
					},
				],
				default: 'text',
				description: 'The type of message to send (Instagram)',
			},
			{
				displayName: 'Message Content',
				name: 'content',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage'],
						messageType: ['text'],
					},
				},
				default: '',
				description: 'The text content of the message',
				typeOptions: {
					rows: 4,
				},
			},
			{
				displayName: 'Media URL',
				name: 'mediaUrl',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
						messageType: ['image', 'document', 'audio', 'video', 'media_share'],
					},
				},
				default: '',
				description: 'URL of the media file to send',
			},
			{
				displayName: 'Caption',
				name: 'caption',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
						messageType: ['image', 'document', 'video'],
					},
				},
				default: '',
				description: 'Optional caption for media messages',
			},
			{
				displayName: 'Filename',
				name: 'filename',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
						messageType: ['document'],
					},
				},
				default: '',
				description: 'Filename for document messages',
				placeholder: 'invoice.pdf',
			},
			// Template fields (WhatsApp only)
			{
				displayName: 'Template Name',
				name: 'templateName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage'],
						messageType: ['template'],
					},
				},
				default: '',
				description: 'Name of the WhatsApp template to send',
				placeholder: 'hello_world',
			},
			{
				displayName: 'Template Language',
				name: 'templateLanguage',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage'],
						messageType: ['template'],
					},
				},
				default: 'en',
				description: 'Language code for the template',
				placeholder: 'en',
			},
			{
				displayName: 'Template Components (JSON)',
				name: 'templateComponents',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
						messageType: ['template'],
					},
				},
				default: '[]',
				description: 'Template components as JSON array (for variables, buttons, etc.)',
			},

			// Mark as Read Fields
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['markAsRead'],
					},
				},
				default: '',
				description: 'The ID of the message to mark as read',
				placeholder: 'msg_xyz789',
			},

			// Send Typing Fields
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendTyping'],
					},
				},
				default: '',
				description: 'The ID of the customer to send typing indicator to',
				placeholder: 'cust_abc123',
			},
			{
				displayName: 'Channel',
				name: 'channel',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendTyping'],
					},
				},
				options: [
					{
						name: 'WhatsApp',
						value: 'whatsapp',
					},
					{
						name: 'Instagram',
						value: 'instagram',
					},
				],
				default: 'whatsapp',
				description: 'The messaging channel to use',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('kirimChatApi');
		const baseUrl = credentials.baseUrl as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				let responseData;

				if (operation === 'sendMessage') {
					// Send Message Operation
					const customerId = this.getNodeParameter('customerId', i) as string;
					const channel = this.getNodeParameter('channel', i) as string;
					const messageType = this.getNodeParameter('messageType', i) as string;

					const body: Record<string, unknown> = {
						customer_id: customerId,
						channel,
						message_type: messageType,
					};

					if (messageType === 'text') {
						body.content = this.getNodeParameter('content', i) as string;
					} else if (messageType === 'template') {
						// WhatsApp template message
						const templateName = this.getNodeParameter('templateName', i) as string;
						const templateLanguage = this.getNodeParameter('templateLanguage', i) as string;
						const templateComponentsJson = this.getNodeParameter('templateComponents', i, '[]') as string;
						
						let templateComponents = [];
						try {
							templateComponents = JSON.parse(templateComponentsJson);
						} catch (error) {
							throw new Error(`Invalid JSON in Template Components: ${error instanceof Error ? error.message : 'Parse failed'}`);
						}
						
						body.template = {
							name: templateName,
							language: { code: templateLanguage },
							components: templateComponents,
						};
					} else {
						// Media messages
						body.media_url = this.getNodeParameter('mediaUrl', i, '') as string;

						const caption = this.getNodeParameter('caption', i, '') as string;
						if (caption) {
							body.caption = caption;
						}
						
						// Document filename
						if (messageType === 'document') {
							const filename = this.getNodeParameter('filename', i, '') as string;
							if (filename) {
								body.filename = filename;
							}
						}
					}

					responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'kirimChatApi',
						{
							method: 'POST',
							url: `${baseUrl}/messages/send`,
							body,
							json: true,
						},
					);
				} else if (operation === 'markAsRead') {
					// Mark as Read Operation
					const messageId = this.getNodeParameter('messageId', i) as string;

					responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'kirimChatApi',
						{
							method: 'POST',
							url: `${baseUrl}/messages/${messageId}/read`,
							json: true,
						},
					);
				} else if (operation === 'sendTyping') {
					// Send Typing Indicator Operation
					const customerId = this.getNodeParameter('customerId', i) as string;
					const channel = this.getNodeParameter('channel', i) as string;

					responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'kirimChatApi',
						{
							method: 'POST',
							url: `${baseUrl}/conversations/${customerId}/typing`,
							body: { channel },
							json: true,
						},
					);
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported!`,
					);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					returnData.push({
						json: {
							error: errorMessage,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
