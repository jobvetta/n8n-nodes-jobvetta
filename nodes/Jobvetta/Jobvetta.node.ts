import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Jobvetta implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jobvetta',
		name: 'jobvetta',
		icon: {
			light: 'file:jobvetta.svg',
			dark: 'file:jobvetta.dark.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Search 6.5M+ live employer career-site jobs, remote roles, company openings, and salary benchmarks across 242 countries',
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Company',
						value: 'company',
					},
					{
						name: 'Job',
						value: 'job',
					},
					{
						name: 'Salary',
						value: 'salary',
					},
				],
				default: 'job',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['company'],
					},
				},
				options: [
					{
						name: 'Get Jobs',
						value: 'getCompanyJobs',
						description: 'List active openings at a specific employer',
						action: 'Get jobs at a company',
					},
				],
				default: 'getCompanyJobs',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['job'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'getJobDetails',
						description: 'Retrieve the full description and employer metadata by job ID',
						action: 'Get a job',
					},
					{
						name: 'Get Recent (24h)',
						value: 'getRecentJobs',
						description: 'Fetch jobs posted in the last 24 hours for daily alerts and lead triggers',
						action: 'Get recent jobs',
					},
					{
						name: 'Search',
						value: 'searchJobs',
						description: 'Search live openings across 238,000+ official employer career sites',
						action: 'Search jobs',
					},
					{
						name: 'Search Remote',
						value: 'searchRemoteJobs',
						description: 'Search verified remote-eligible employer roles worldwide',
						action: 'Search remote jobs',
					},
				],
				default: 'searchJobs',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['salary'],
					},
				},
				options: [
					{
						name: 'Estimate',
						value: 'estimateSalary',
						description: 'Compute annualized p25, median, and p75 compensation benchmarks',
						action: 'Estimate salary benchmarks',
					},
				],
				default: 'estimateSalary',
			},
			{
				displayName: 'Job ID',
				name: 'jobId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['getJobDetails'],
					},
				},
				description: 'Unique Jobvetta job identifier returned by Search',
			},
			{
				displayName: 'Company Name',
				name: 'company',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. Stripe, Cisco Systems, Databricks',
				displayOptions: {
					show: {
						resource: ['company'],
						operation: ['getCompanyJobs'],
					},
				},
				description: 'Employer name to look up active openings for',
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
							'getCompanyJobs',
							'estimateSalary',
						],
					},
				},
				description: 'Role title, skill, technology, or department keyword',
			},
			{
				displayName: 'Location (Country, State, or City)',
				name: 'location',
				type: 'string',
				default: '',
				placeholder: 'e.g. United States, New York, London, Germany, Bengaluru',
				displayOptions: {
					show: {
						operation: [
							'searchJobs',
							'searchRemoteJobs',
							'getRecentJobs',
							'getCompanyJobs',
							'estimateSalary',
						],
					},
				},
				description: 'Country name, state/province, or city filter across 242 countries',
			},
			{
				displayName: 'Company Filter',
				name: 'companyQuery',
				type: 'string',
				default: '',
				placeholder: 'e.g. Stripe, Cloudflare',
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['searchJobs', 'searchRemoteJobs', 'getRecentJobs'],
					},
				},
				description: 'Optional employer name filter (company_query)',
			},
			{
				displayName: 'Remote Only',
				name: 'remote',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['searchJobs', 'getCompanyJobs'],
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
					maxValue: 365,
				},
				default: 7,
				displayOptions: {
					show: {
						operation: ['searchJobs', 'searchRemoteJobs', 'getCompanyJobs', 'estimateSalary'],
					},
				},
				description: 'Freshness window in days (1 to 30 for search, up to 365 for salary estimates)',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 50,
				displayOptions: {
					show: {
						operation: ['searchJobs', 'searchRemoteJobs', 'getRecentJobs', 'getCompanyJobs'],
					},
				},
				description: 'Max number of results to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				typeOptions: {
					minValue: 0,
					maxValue: 9999,
				},
				default: 0,
				displayOptions: {
					show: {
						operation: ['searchJobs', 'searchRemoteJobs', 'getRecentJobs', 'getCompanyJobs'],
					},
				},
				description: 'Pagination offset',
			},
			{
				displayName: 'Split Jobs Into Items',
				name: 'splitItems',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['searchJobs', 'searchRemoteJobs', 'getRecentJobs', 'getCompanyJobs'],
					},
				},
				description: 'Whether to emit each job as its own n8n workflow item (disable to return the raw JSON envelope)',
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
				: 'https://api.jobvetta.com/v1';

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				let endpoint = '/jobs';
				const qs: IDataObject = {};

				if (operation === 'getJobDetails') {
					const jobId = (this.getNodeParameter('jobId', i) as string).trim();
					if (!jobId) {
						throw new NodeOperationError(this.getNode(), 'Job ID is required', { itemIndex: i });
					}
					endpoint = `/jobs/${encodeURIComponent(jobId)}`;
				} else if (operation === 'estimateSalary') {
					endpoint = '/jobs/salary-estimate';
					const q = (this.getNodeParameter('q', i) as string).trim();
					const location = (this.getNodeParameter('location', i) as string).trim();
					const days = this.getNodeParameter('days', i) as number;
					if (q) qs.q = q;
					if (location) qs.location = location;
					if (days) qs.days = days;
				} else {
					if (operation === 'searchRemoteJobs') {
						endpoint = '/jobs/remote';
					} else if (operation === 'getRecentJobs') {
						endpoint = '/jobs/recent';
					} else if (operation === 'getCompanyJobs') {
						const company = (this.getNodeParameter('company', i) as string).trim();
						if (!company) {
							throw new NodeOperationError(this.getNode(), 'Company Name is required', { itemIndex: i });
						}
						endpoint = `/companies/${encodeURIComponent(company)}/jobs`;
					}

					const q = (this.getNodeParameter('q', i) as string).trim();
					const location = (this.getNodeParameter('location', i) as string).trim();
					const limit = this.getNodeParameter('limit', i) as number;
					const offset = this.getNodeParameter('offset', i) as number;
					if (q) qs.q = q;
					if (location) qs.location = location;
					qs.limit = limit;
					if (offset > 0) qs.offset = offset;

					if (operation !== 'getCompanyJobs') {
						const companyQuery = (this.getNodeParameter('companyQuery', i) as string).trim();
						if (companyQuery) qs.company_query = companyQuery;
					}
					if (operation === 'searchJobs' || operation === 'getCompanyJobs') {
						const remote = this.getNodeParameter('remote', i) as boolean;
						if (remote) qs.remote = '1';
					}
					if (operation !== 'getRecentJobs') {
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

				const canSplit = ['searchJobs', 'searchRemoteJobs', 'getRecentJobs', 'getCompanyJobs'].includes(operation);
				const splitItems = canSplit ? (this.getNodeParameter('splitItems', i) as boolean) : false;

				if (splitItems) {
					const records = Array.isArray(response.jobs) ? (response.jobs as IDataObject[]) : [];
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
				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
