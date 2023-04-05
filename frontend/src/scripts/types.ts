type BaseUser = {
	username: string;
};

export type User = {
	id: number;
} & BaseUser;

export type NewUser = BaseUser & {
	password: string;
};

export type UpdateUser = {
	id: User['id'];
	username?: BaseUser['username'];
	password?: NewUser['password'];
};

export type Session = {
	id: string;
	ip: string;
	ua: string;
	time: number;
};

export type NewApp = {
	name: string;
	description?: string;
};

export type App = NewApp & {
	id: number;
	audienceKey: string;
	telemetryKey: string;
	ownerID: number;
};

export type Overview = {
	users: {[key: string]: number};
	views: {[key: string]: number};
	clientLogs: {[key: string]: {[key: string]: number}};
	serverLogs: {[key: string]: {[key: string]: number}};
};

export type RealtimeAudience = {
	users: {[key: string]: number};
	views: {[key: string]: number};
};

export type DayAudience = {
	users: number;
	sessions: [
		{
			duration: number;
			ua: string;
			pages: {url: string; referrer: string | null; time: number}[];
		}
	];
	bounceRate: number;
	avgDuration: number;
	views: number;
	pages: {[key: string]: number};
	referrers: {[key: string]: number};
};

export type HistoricalAudience = {
	users: {[key: string]: number};
	views: {[key: string]: number};
};

export type Log = {
	id: number;
	time: number;
	tag?: string;
	message: string;
	level: number;
};

export type HistoricalLogs = {[key: string]: {[key: string]: number}};

export type Feedback = {
	id: number;
	time: number;
	message: string;
};

export type Metrics = {
	time: number;
	device?: string;
	cpu?: number;
	memUsed?: number;
	memTotal?: number;
	netUp?: number;
	netDown?: number;
	diskUsed?: number;
	diskTotal?: number;
};
