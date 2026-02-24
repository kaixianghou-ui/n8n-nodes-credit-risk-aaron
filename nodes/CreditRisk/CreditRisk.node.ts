import { INodeType, INodeTypeDescription, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export class CreditRisk implements INodeType {
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