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

export type AppOverview = {
	currentUsers: number;
	sessions: {[key: string]: number};
	clientLogs: {[key: string]: {[key: string]: number}};
	serverLogs: {[key: string]: {[key: string]: number}};
};

export type RealtimeAudience = {
	currentUsers: number;
	pages: {[key: string]: number};
	sessions: {[key: string]: number};
	referrers: {[key: string]: number};
};

export type DayAudience = {
	bounceRate: number;
	avgDuration: number;
	users: number;
	sessions: [
		{
			duration: number;
			ua: string;
			pages: {url: string; time: number}[];
		}
	];
};

export type Log = {
	time: number;
	tag?: string;
	message: string;
	level: number;
};

export type Feedback = {
	time: number;
	message: string;
};
