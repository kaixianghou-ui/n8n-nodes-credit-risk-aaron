import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class CreditRiskApi implements ICredentialType {
	name = 'creditRiskApi';
	displayName = 'Credit Risk API';
	properties: INodeProperties[] = [
		{
			displayName: 'API Endpoint',
			name: 'apiEndpoint',
			type: 'string',
			default: 'http://localhost:8000',
			placeholder: 'https://your-risk-api.com',
			description: 'Custom API endpoint for advanced models',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];
}