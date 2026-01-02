import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KirimChatApi implements ICredentialType {
	name = 'kirimChatApi';
	displayName = 'KirimChat API';
	documentationUrl = 'https://kirim.chat/developers';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your KirimChat API key (starts with kc_live_)',
			placeholder: 'kc_live_your_api_key_here',
		},
		{
			displayName: 'API Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api-prod.kirim.chat/api/v1/public',
			required: true,
			description: '⚠️ WARNING: Only change this URL if you know what you\'re doing. Your API key will be sent to this URL. Changing this to an untrusted URL could expose your credentials.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/health',
			method: 'GET',
		},
	};
}
