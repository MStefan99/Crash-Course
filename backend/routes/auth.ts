import { Middleware, Router } from '../deps.ts';

import auth from '../lib/auth.ts';
import User from '../lib/user.ts';
import Session from '../lib/session.ts';
import { hasBody, hasCredentials } from './middleware.ts';
import rateLimiter from '../lib/rateLimiter.ts';

const router = new Router();

function accountsEnabled(): Middleware {
	if (Deno.env.has('NO_ACCOUNTS')) {
		return (ctx, _next) => {
			ctx.response.status = 422;
			ctx.response.body = {
				error: 'ACCOUNTS_DISABLED',
				message:
					'Account management is disabled for this Crash Course installation',
			};
			return;
		};
	} else {
		return async (_ctx, next) => {
			await next();
		};
	}
}

// Register
router.post(
	'/register',
	accountsEnabled(),
	hasCredentials(),
	rateLimiter({ tag: 'auth', rate: 2, initial: 10, max: 10 }),
	async (ctx) => {
		const body = await ctx.request.body.json();

		const user = await User.create(
			body.username.toString().trim(),
			body.password.toString(),
		);
		const session = await Session.create(
			user,
			ctx.request.ip,
			ctx.request.headers.get('user-agent') ?? 'Unknown',
		);

		ctx.response.status = 201;
		ctx.response.body = { key: session.publicID, user };
	},
);

// Log in
router.post(
	'/login',
	hasCredentials(),
	rateLimiter({ tag: 'auth', rate: 2, initial: 10, max: 10 }),
	async (ctx) => {
		const body = await ctx.request.body.json();
		const user = await User.getByUsername(body.username.toString().trim());

		if (user === null) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		} else if (!(await user.verifyPassword(body.password.toString()))) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'WRONG_PASSWORD',
				message: 'Wrong password',
			};
			return;
		}

		const session = await Session.create(
			user,
			ctx.request.ip,
			ctx.request.headers.get('user-agent') ?? 'Unknown',
		);

		ctx.response.status = 201;
		ctx.response.body = { key: session.publicID, user };
	},
);

// Check authentication status
router.get(
	'/auth',
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	(ctx) => {
		ctx.response.body = { message: 'OK' };
	},
);

// Get user currently logged in as
router.get(
	'/me',
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const user = await auth.methods.getUser(ctx);

		if (!user) {
			// Should in theory never get here
			ctx.response.status = 500;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
		} else {
			ctx.response.body = user;
		}
	},
);

// Edit user currently logged in as
router.patch(
	'/me',
	hasBody(),
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const body = await ctx.request.body.json();

		const user = await auth.methods.getUser(ctx);
		if (user === null) {
			ctx.response.status = 500;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		if (body.username?.toString()?.length) {
			user.username = body.username.toString().trim();
		}

		if (body.password?.toString()?.length) {
			await user.setPassword(body.password.toString());
		}

		await user.save();
		ctx.response.body = user;
	},
);

// Log out
router.get(
	'/logout',
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		ctx.response.body = { message: 'OK' };

		const session = await auth.methods.getSession(ctx);
		session?.delete();
	},
);

// Delete account
router.delete(
	'/me',
	accountsEnabled(),
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const user = await auth.methods.getUser(ctx);

		if (user === null) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		user.delete();
		ctx.response.body = user;
	},
);

export default router;
