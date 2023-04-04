import appState from './store';
import type {
	NewApp,
	App,
	AppOverview,
	DayAudience,
	NewUser,
	RealtimeAudience,
	Session,
	UpdateUser,
	User,
	Log,
	Metrics,
	HistoricalLogs,
	HistoricalAudience
} from './types';

type MessageResponse = {
	code: string;
	message: string;
};

type ErrorResponse = {
	error: string;
	message: string;
};

type AuthResult = {
	user: User;
	key: string;
};

const apiPrefix = import.meta.env.VITE_API_PREFIX ?? '';
const notConfigured: ErrorResponse = {error: 'NOT_CONFIGURED', message: 'Not configured'};
const notAuthenticated: ErrorResponse = {
	error: 'NOT_AUTHENTICATED',
	message: 'You must sign in to do this'
};
const requestFailed: ErrorResponse = {error: 'REQ_FAILED', message: 'Request failed'};

enum RequestMethod {
	GET = 'GET',
	POST = 'POST',
	PATCH = 'PATCH',
	PUT = 'PUT',
	DELETE = 'DELETE'
}

type RequestParams = {
	auth?: boolean;
	method?: RequestMethod;
	body?: unknown;
	query?: Record<string, string>;
};

function request<T>(path: string, params?: RequestParams): Promise<T> {
	return new Promise((resolve, reject) => {
		if (!appState.backendURL) {
			reject(notConfigured);
			return;
		}

		if (params?.auth && !appState.apiKey) {
			reject(notAuthenticated);
			return;
		}

		const query =
			params?.query &&
			Object.keys(params?.query).reduce<Record<string, string>>((q, key) => {
				params.query?.[key].trim() && (q[key] = params.query[key]);
				return q;
			}, {});
		const queryString =
			query && Object.keys(query).length ? '?' + new URLSearchParams(query).toString() : '';

		fetch(appState.backendURL + apiPrefix + path + queryString, {
			method: params?.method ?? 'GET',
			headers: {
				...(!!params?.auth && {
					'API-Key': appState.apiKey
				}),
				...(params?.method !== RequestMethod.GET && {
					'Content-Type': 'application/json'
				})
			},
			...(!!params?.body && {body: JSON.stringify(params.body)})
		})
			.then((res) => {
				if (res.ok) {
					return res.json();
				} else {
					return res.json().then((err) => reject(err));
				}
			})
			.then((data) => resolve(data as T))
			.catch((err) => reject(err));
	});
}

function connect(host: string | null): Promise<boolean> {
	return new Promise<boolean>((resolve, reject) => {
		if (!host) {
			reject(notConfigured);
			return;
		}

		fetch(host + apiPrefix)
			.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Crash Course'))
			.catch(() => {
				reject(requestFailed);
			});
	});
}

function booleanify(promise: Promise<unknown>): Promise<boolean> {
	return new Promise((resolve, reject) =>
		promise.then((res) => resolve(!!res)).catch((err) => reject(err))
	);
}

export const ConnectionAPI = {
	testURL: (host: string | null) => connect(host),
	test: () => connect(appState.backendURL)
};

export const AuthAPI = {
	login: (username: User['username'], password: NewUser['password']) =>
		new Promise<User>((resolve, reject) => {
			request<AuthResult>('/login', {method: RequestMethod.POST, body: {username, password}})
				.then((data) => {
					appState.setApiKey(data.key);
					appState.setUser(data.user);
					resolve(data.user);
				})
				.catch((err) => reject(err));
		}),
	register: (username: User['username'], password: NewUser['password']) =>
		new Promise<User>((resolve, reject) => {
			request<AuthResult>('/register', {method: RequestMethod.POST, body: {username, password}})
				.then((data) => {
					appState.setApiKey(data.key);
					appState.setUser(data.user);
					resolve(data.user);
				})
				.catch((err) => reject(err));
		}),
	test: () => booleanify(request('/auth', {auth: true})),
	me: () => request<User>('/me', {auth: true}),
	edit: (user: UpdateUser) =>
		request<User>('/me', {auth: true, method: RequestMethod.PATCH, body: user}),
	logout: () =>
		new Promise<boolean>((resolve, reject) => {
			request<MessageResponse>('/logout', {
				auth: true
			})
				.then(() => {
					appState.setApiKey(null);
					appState.setUser(null);
					resolve(true);
				})
				.catch((err) => reject(err));
		}),
	delete: () =>
		new Promise<boolean>((resolve, reject) =>
			request<User>('/me', {auth: true, method: RequestMethod.DELETE})
				.then(() => {
					appState.setApiKey(null);
					appState.setUser(null);
					resolve(true);
				})
				.catch((err) => reject(err))
		)
};

export const SessionAPI = {
	getAll: () => request<Session[]>('/sessions', {auth: true}),
	// TODO: clear state key
	logout: (id: Session['id']) =>
		request<Session>('/sessions/' + id, {
			auth: true,
			method: RequestMethod.DELETE
		}),
	logoutAll: () =>
		booleanify(request<MessageResponse>('/sessions', {auth: true, method: RequestMethod.DELETE}))
};

export const AppAPI = {
	add: (app: NewApp) => request<App>('/apps', {auth: true, method: RequestMethod.POST, body: app}),
	getAll: () => request<App[]>('/apps', {auth: true}),
	getByID: (id: App['id']) => request<App>('/apps/' + id, {auth: true}),
	edit: (app: App) =>
		request<App>('/apps/' + app.id, {auth: true, method: RequestMethod.PATCH, body: app}),
	getOverview: (id: App['id']) => request<AppOverview>('/apps/' + id + '/overview', {auth: true}),
	getRealtimeAudience: (id: App['id']) =>
		request<RealtimeAudience>('/apps/' + id + '/audience/now', {auth: true}),
	getTodayAudience: (id: App['id']) =>
		request<DayAudience>('/apps/' + id + '/audience/today', {auth: true}),
	getHistoricalAudience: (id: App['id']) =>
		request<HistoricalAudience>('/apps/' + id + '/audience/history', {auth: true}),
	getLogs: (id: App['id'], type: 'server' | 'client', startTime?: number, level?: number) =>
		request<Log[]>('/apps/' + id + '/logs/' + type, {
			auth: true,
			query: {startTime: startTime?.toString() ?? '', level: level?.toString() ?? ''}
		}),
	getHistoricalLogs: (id: App['id']) =>
		request<HistoricalLogs>('/apps/' + id + '/logs/history', {auth: true}),
	getFeedbacks: (id: App['id'], startTime?: number) =>
		request<Log[]>('/apps/' + id + '/feedback', {
			auth: true,
			query: {startTime: startTime?.toString() ?? ''}
		}),
	getMetrics: (id: App['id'], startTime?: number) =>
		request<Metrics[]>('/apps/' + id + '/metrics', {
			auth: true,
			query: {startTime: startTime?.toString() ?? ''}
		}),
	delete: (app: App) => request<App>('/apps/' + app.id, {auth: true, method: RequestMethod.DELETE})
};

export default {
	connection: ConnectionAPI,
	sessions: SessionAPI,
	auth: AuthAPI,
	apps: AppAPI
};
