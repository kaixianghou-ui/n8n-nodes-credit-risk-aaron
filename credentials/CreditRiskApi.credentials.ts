import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class CreditRiskApi implements ICredentialType {
	name = 'creditRiskApi';
	displayName = 'Credit Risk API';
	documentationUrl = 'https://github.com/kaixianghou-ui/n8n-nodes-credit-risk-aaron';
	icon = 'file:creditRisk.svg';
	properties: INodeProperties[] = [
		{
			displayName: 'API Endpoint',
			name: 'apiEndpoint',
			type: 'string',
			default: 'http://localhost:8000',
			placeholder: 'https://your-risk-api.com',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];
	test = {
		request: {
			baseURL: '={{$credentials.apiEndpoint}}',
			url: '/health',
		},
	};
}
