import { INodeType, INodeTypeDescription, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export class CreditRisk implements INodeType {
	usableAsTool = true;
	description: INodeTypeDescription = {
		displayName: 'Credit Risk AI',
		name: 'creditRisk',
		icon: 'file:creditRisk.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'AI-powered credit risk scoring',
		defaults: {
			name: 'Credit Risk AI',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'creditRiskApi',
				required: false,
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
						name: 'Risk Score',
						value: 'score',
						description: 'Calculate credit risk score',
						action: 'Calculate credit risk score',
					},
					{
						name: 'AI Explanation',
						value: 'explain',
						description: 'Generate AI explanation',
						action: 'Generate AI explanation',
					},
				],
				default: 'score',
			},
			{
				displayName: 'Annual Income (CNY)',
				name: 'income',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						operation: ['score'],
					},
				},
			},
			{
				displayName: 'Total Debt (CNY)',
				name: 'debt',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						operation: ['score'],
					},
				},
			},
			{
				displayName: 'Overdue Count',
				name: 'overdue',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						operation: ['score'],
					},
				},
			},
			{
				displayName: 'Credit History (Months)',
				name: 'history',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						operation: ['score'],
					},
				},
			},
			{
				displayName: 'Risk Strategy',
				name: 'strategy',
				type: 'options',
				options: [
					{
						name: 'Conservative',
						value: 'conservative',
					},
					{
						name: 'Standard',
						value: 'standard',
					},
					{
						name: 'Aggressive',
						value: 'aggressive',
					},
				],
				default: 'standard',
				displayOptions: {
					show: {
						operation: ['score'],
					},
				},
			},
			{
				displayName: 'Risk Score to Explain',
				name: 'scoreToExplain',
				type: 'number',
				default: 50,
				displayOptions: {
					show: {
						operation: ['explain'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'score') {
					const income = this.getNodeParameter('income', i) as number;
					const debt = this.getNodeParameter('debt', i) as number;
					const overdue = this.getNodeParameter('overdue', i) as number;
					const history = this.getNodeParameter('history', i) as number;
					const strategy = this.getNodeParameter('strategy', i) as string;

					const dti = income > 0 ? (debt / income) * 100 : 999;
					let score = 100;
					
					if (dti > 50) score -= 35;
					else if (dti > 30) score -= 20;
					else if (dti > 10) score -= 5;
					
					score -= overdue * 12;
					if (history > 60) score += 10;
					else if (history > 24) score += 5;
					
					score = Math.max(0, Math.min(100, score));

					let threshold = 60;
					if (strategy === 'conservative') threshold = 75;
					if (strategy === 'aggressive') threshold = 45;

					let decision = 'Review';
					if (score >= threshold) decision = 'Approve';
					else if (score < threshold - 20) decision = 'Reject';

					let riskLevel = 'Medium';
					if (score >= 80) riskLevel = 'Low';
					else if (score < 50) riskLevel = 'High';

					returnData.push({
						json: {
							creditScore: Math.round(score),
							riskLevel,
							decision,
							debtToIncome: dti.toFixed(2) + '%',
						},
					});
				} else if (operation === 'explain') {
					const score = this.getNodeParameter('scoreToExplain', i) as number;
					const explanation = score >= 80 ? '信用优秀' : score >= 60 ? '信用良好' : '高风险';
					returnData.push({ json: { score, explanation } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
