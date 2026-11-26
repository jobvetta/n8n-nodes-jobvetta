import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class JobvettaApi implements ICredentialType {
	name = 'jobvettaApi';
	displayName = 'Jobvetta API';
	documentationUrl = 'https://www.jobvetta.com/api';

	properties: INodeProperties[] = [
		{
			displayName: 'Authentication Provider',
			name: 'provider',
			type: 'options',
			options: [
				{
					name: 'Jobvetta Direct (api.jobvetta.com)',
					value: 'direct',
				},
				{
					name: 'RapidAPI (jobvetta-jobs.p.rapidapi.com)',
					value: 'rapidapi',
				},
			],
			default: 'direct',
			description: 'Choose whether to authenticate with a direct Jobvetta Bearer key or a RapidAPI subscription key',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Jobvetta API key (get a free key at https://www.jobvetta.com/api or via RapidAPI)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.provider === "direct" ? "Bearer " + $credentials.apiKey : undefined}}',
				'X-RapidAPI-Key': '={{$credentials.provider === "rapidapi" ? $credentials.apiKey : undefined}}',
				'X-RapidAPI-Host': '={{$credentials.provider === "rapidapi" ? "jobvetta-jobs.p.rapidapi.com" : undefined}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.provider === "rapidapi" ? "https://jobvetta-jobs.p.rapidapi.com" : "https://api.jobvetta.com"}}',
			url: '/v1/jobs',
			qs: {
				limit: 1,
			},
		},
	};
}
