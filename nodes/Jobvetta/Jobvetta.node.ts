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
						description: 'Search verified remote-eligible employer roles worldwide',
						action: 'Search verified remote jobs',
					},
					{
						name: 'Get Recent Jobs (24h)',
						value: 'getRecentJobs',
						description: 'Fetch jobs posted in the last 24 hours for daily alerts and lead triggers',
						action: 'Get jobs posted in last 24 hours',
					},
					{
						name: 'Get Company Jobs',
						value: 'getCompanyJobs',
						description: 'List active openings at a specific employer (/v1/companies/{company}/jobs)',
						action: 'List active jobs at a company',
					},
					{
						name: 'Estimate Salary',
						value: 'estimateSalary',
						description: 'Compute annualized p25, median, and p75 compensation benchmarks (/v1/jobs/salary-estimate)',
						action: 'Estimate role salary benchmarks',
					},
					{
						name: 'Get Job Details',
						value: 'getJobDetails',
						description: 'Retrieve the full description and employer metadata for a job ID (/v1/jobs/{id})',
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
				displayName: 'Company Name',
				name: 'company',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. Stripe, Cisco Systems, Databricks',
				displayOptions: {
					show: {
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
				default: 25,
				displayOptions: {
					show: {
						operation: ['searchJobs', 'searchRemoteJobs', 'getRecentJobs', 'getCompanyJobs'],
					},
				},
				description: 'Max number of jobs to return per request (1 to 25 on Free, up to 100 on Growth+)',
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
					endpoint = '/v1/jobs/salary-estimate';
					const q = (this.getNodeParameter('q', i) as string).trim();
					const location = (this.getNodeParameter('location', i) as string).trim();
					const days = this.getNodeParameter('days', i) as number;
					if (q) qs.q = q;
					if (location) qs.location = location;
					if (days) qs.days = days;
				} else {
					if (operation === 'searchRemoteJobs') {
						endpoint = '/v1/jobs/remote';
					} else if (operation === 'getRecentJobs') {
						endpoint = '/v1/jobs/recent';
					} else if (operation === 'getCompanyJobs') {
						const company = (this.getNodeParameter('company', i) as string).trim();
						if (!company) {
							throw new NodeOperationError(this.getNode(), 'Company Name is required', { itemIndex: i });
						}
						endpoint = `/v1/companies/${encodeURIComponent(company)}/jobs`;
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
				throw error;
			}
		}

		return [returnData];
	}
}
