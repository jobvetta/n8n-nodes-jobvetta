import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Jobvetta implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jobvetta',
		name: 'jobvetta',
		icon: 'file:jobvetta.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Search 6.5M+ live employer career-site jobs, remote roles, company hiring signals, and salary benchmarks across 242 countries',
		defaults: {
			name: 'Jobvetta',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'jobvettaApi',
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
						name: 'Search Jobs',
						value: 'searchJobs',
						description: 'Search live openings across 238,000+ official employer career sites',
						action: 'Search live employer jobs',
					},
					{
						name: 'Search Remote Jobs',
						value: 'searchRemoteJobs',
						description: 'Search verified remote-eligible employer roles',
						action: 'Search verified remote jobs',
					},
					{
						name: 'Get Recent Jobs (24h)',
						value: 'getRecentJobs',
						description: 'Fetch jobs posted in the last 24 hours for daily alerts and lead triggers',
						action: 'Get jobs posted in last 24 hours',
					},
					{
						name: 'Get Company Hiring Signals',
						value: 'getCompanySignals',
						description: 'Discover actively hiring employers ranked by live open-role velocity',
						action: 'Get company hiring signals',
					},
					{
						name: 'Estimate Salary',
						value: 'estimateSalary',
						description: 'Compute p25, median, mean, and p75 compensation benchmarks for a role',
						action: 'Estimate role salary benchmarks',
					},
					{
						name: 'Get Job Details',
						value: 'getJobDetails',
						description: 'Retrieve the full description and direct employer application link for a job ID',
						action: 'Get full job details by ID',
					},
				],
				default: 'searchJobs',
			},
			{
				displayName: 'Job ID',
				name: 'jobId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['getJobDetails'],
					},
				},
				description: 'Unique Jobvetta job identifier returned by Search Jobs',
			},
			{
				displayName: 'Query / Keyword',
				name: 'q',
				type: 'string',
				default: '',
				placeholder: 'e.g. Software Engineer, Account Executive, Rust',
				displayOptions: {
					show: {
						operation: [
							'searchJobs',
							'searchRemoteJobs',
							'getRecentJobs',
							'getCompanySignals',
							'estimateSalary',
						],
					},
				},
				description: 'Role title, skill, technology, or department keyword (required for Estimate Salary)',
			},
			{
				displayName: 'Country (ISO-2)',
				name: 'country',
				type: 'string',
				default: '',
				placeholder: 'e.g. US, GB, CA, DE, IN, AU',
				displayOptions: {
					show: {
						operation: [
							'searchJobs',
							'searchRemoteJobs',
							'getRecentJobs',
							'getCompanySignals',
							'estimateSalary',
						],
					},
				},
				description: 'Optional 2-letter ISO country code filter across 242 supported countries',
			},
			{
				displayName: 'Location (City / State)',
				name: 'location',
				type: 'string',
				default: '',
				placeholder: 'e.g. San Francisco, New York, London, Bengaluru',
				displayOptions: {
					show: {
						operation: ['searchJobs', 'estimateSalary'],
					},
				},
				description: 'City, state, or metro filter',
			},
			{
				displayName: 'Company Name',
				name: 'company',
				type: 'string',
				default: '',
				placeholder: 'e.g. Stripe, Databricks, Anthropic',
				displayOptions: {
					show: {
						operation: ['searchJobs'],
					},
				},
				description: 'Filter jobs to a specific employer name',
			},
			{
				displayName: 'Remote Only',
				name: 'remote',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['searchJobs'],
					},
				},
				description: 'Whether to restrict results to remote-eligible openings only',
			},
			{
				displayName: 'Posted Within (Days)',
				name: 'days',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 30,
				},
				default: 7,
				displayOptions: {
					show: {
						operation: ['searchJobs', 'searchRemoteJobs', 'getCompanySignals'],
					},
				},
				description: 'Freshness window in days (1 to 30)',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 25,
				displayOptions: {
					show: {
						operation: ['searchJobs', 'searchRemoteJobs', 'getRecentJobs', 'getCompanySignals'],
					},
				},
				description: 'Max number of results to return per request (1 to 100)',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				typeOptions: {
					minValue: 0,
				},
				default: 0,
				displayOptions: {
					show: {
						operation: ['searchJobs', 'searchRemoteJobs', 'getRecentJobs'],
					},
				},
				description: 'Pagination offset',
			},
			{
				displayName: 'Split Results Into Items',
				name: 'splitItems',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['searchJobs', 'searchRemoteJobs', 'getRecentJobs', 'getCompanySignals'],
					},
				},
				description: 'Whether to emit each job or company as its own n8n item (disable to return the raw JSON envelope)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('jobvettaApi');
		const baseURL =
			credentials.provider === 'rapidapi'
				? 'https://jobvetta-jobs.p.rapidapi.com'
				: 'https://api.jobvetta.com';

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				let endpoint = '/v1/jobs';
				const qs: IDataObject = {};

				if (operation === 'getJobDetails') {
					const jobId = (this.getNodeParameter('jobId', i) as string).trim();
					if (!jobId) {
						throw new NodeOperationError(this.getNode(), 'Job ID is required', { itemIndex: i });
					}
					endpoint = `/v1/jobs/${encodeURIComponent(jobId)}`;
				} else if (operation === 'estimateSalary') {
					endpoint = '/v1/salaries/estimate';
					const q = (this.getNodeParameter('q', i) as string).trim();
					if (!q) {
						throw new NodeOperationError(this.getNode(), 'Query / Keyword is required for Estimate Salary', { itemIndex: i });
					}
					qs.q = q;
					const country = (this.getNodeParameter('country', i) as string).trim();
					const location = (this.getNodeParameter('location', i) as string).trim();
					if (country) qs.country = country.toUpperCase();
					if (location) qs.location = location;
				} else {
					if (operation === 'searchRemoteJobs') endpoint = '/v1/jobs/remote';
					else if (operation === 'getRecentJobs') endpoint = '/v1/jobs/recent';
					else if (operation === 'getCompanySignals') endpoint = '/v1/companies/hiring';

					const q = (this.getNodeParameter('q', i) as string).trim();
					const country = (this.getNodeParameter('country', i) as string).trim();
					const limit = this.getNodeParameter('limit', i) as number;
					if (q) qs.q = q;
					if (country) qs.country = country.toUpperCase();
					qs.limit = limit;

					if (operation === 'searchJobs') {
						const location = (this.getNodeParameter('location', i) as string).trim();
						const company = (this.getNodeParameter('company', i) as string).trim();
						const remote = this.getNodeParameter('remote', i) as boolean;
						const days = this.getNodeParameter('days', i) as number;
						const offset = this.getNodeParameter('offset', i) as number;
						if (location) qs.location = location;
						if (company) qs.company = company;
						if (remote) qs.remote = 'true';
						if (days) qs.days = days;
						if (offset > 0) qs.offset = offset;
					} else if (operation === 'searchRemoteJobs') {
						const days = this.getNodeParameter('days', i) as number;
						const offset = this.getNodeParameter('offset', i) as number;
						if (days) qs.days = days;
						if (offset > 0) qs.offset = offset;
					} else if (operation === 'getRecentJobs') {
						const offset = this.getNodeParameter('offset', i) as number;
						if (offset > 0) qs.offset = offset;
					} else if (operation === 'getCompanySignals') {
						const days = this.getNodeParameter('days', i) as number;
						if (days) qs.days = days;
					}
				}

				const options: IHttpRequestOptions = {
					method: 'GET',
					baseURL,
					url: endpoint,
					qs,
					json: true,
				};

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'jobvettaApi',
					options,
				)) as IDataObject;

				const canSplit = ['searchJobs', 'searchRemoteJobs', 'getRecentJobs', 'getCompanySignals'].includes(operation);
				const splitItems = canSplit ? (this.getNodeParameter('splitItems', i) as boolean) : false;

				if (splitItems) {
					const listKey = operation === 'getCompanySignals' ? 'companies' : 'jobs';
					const records = Array.isArray(response[listKey]) ? (response[listKey] as IDataObject[]) : [];
					for (const record of records) {
						returnData.push({
							json: record,
							pairedItem: { item: i },
						});
					}
				} else {
					returnData.push({
						json: response,
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
