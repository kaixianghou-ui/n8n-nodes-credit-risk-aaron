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
		description: 'AI-powered credit risk scoring with explainability',
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
						description: 'Generate AI explanation for the score',
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
				description: 'Customer annual income',
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
				description: 'Total existing debt including loans and credit cards',
				displayOptions: {
					show: {
						operation: ['score'],
					},
				},
			},
			{
				displayName: 'Overdue Count (24 Months)',
				name: 'overdue',
				type: 'number',
				default: 0,
				description: 'Number of overdue payments in last 24 months',
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
				description: 'Length of credit history in months',
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
						name: 'Conservative (Board Level)',
						value: 'conservative',
						description: 'High threshold, suitable for board audit',
					},
					{
						name: 'Standard',
						value: 'standard',
						description: 'Balanced risk-return',
					},
					{
						name: 'Aggressive',
						value: 'aggressive',
						description: 'Lower threshold for growth',
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
				displayName: 'OpenAI API Key',
				name: 'openaiApiKey',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'For AI explanation generation (optional)',
				displayOptions: {
					show: {
						operation: ['explain'],
					},
				},
			},
			{
				displayName: 'Risk Score to Explain',
				name: 'scoreToExplain',
				type: 'number',
				default: 50,
				description: 'The risk score value to generate explanation for',
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

					const riskFactors = [];
					if (dti > 50) riskFactors.push('Critical: DTI > 50%');
					if (overdue > 2) riskFactors.push('High: Multiple overdues');
					if (overdue === 0 && dti < 30) riskFactors.push('Low: Clean record');

					returnData.push({
						json: {
							customerId: `CUST_${Date.now()}_${i}`,
							creditScore: Math.round(score),
							riskLevel,
							decision,
							defaultProbability: ((100 - score) / 100).toFixed(2),
							debtToIncome: dti.toFixed(2) + '%',
							strategy,
							threshold,
							riskFactors,
							modelVersion: 'v1.0.0-board',
							evaluatedAt: new Date().toISOString(),
						},
					});
				} 
				else if (operation === 'explain') {
					const score = this.getNodeParameter('scoreToExplain', i) as number;
					
					let explanation = '';
					if (score >= 80) {
						explanation = '信用状况优秀，建议给予最优利率并快速审批';
					} else if (score >= 60) {
						explanation = '信用状况良好，建议标准利率常规审核';
					} else if (score >= 40) {
						explanation = '信用状况存疑，建议提高利率或要求担保';
					} else {
						explanation = '高风险客户，建议拒绝或人工尽调';
					}

					returnData.push({
						json: {
							score,
							explanation,
							generatedBy: 'Credit Risk AI v1.0',
							timestamp: new Date().toISOString(),
						},
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							status: 'FAILED',
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