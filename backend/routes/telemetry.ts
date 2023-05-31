import { Router } from '../deps.ts';
import auth from '../lib/auth.ts';
import { hasBody } from './middleware.ts';

const router = new Router({
	prefix: '/telemetry',
});

router.post('/metrics', hasBody(), auth.hasTelemetryKey(), async (ctx) => {
	const app = await auth.methods.getAppByTelemetryKey(ctx);

	if (!app) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'APP_NOT_FOUND',
			message: 'App was not found',
		};
		return;
	}

	const body = await ctx.request.body({ type: 'json' }).value;
	await app.createMetrics({
		device: body.device.toString().trim(),
		cpu: +body.cpu,
		memUsed: +body.memUsed,
		memTotal: +body.memTotal,
		netUp: +body.netUp,
		netDown: +body.netDown,
		diskUsed: +body.diskUsed,
		diskTotal: +body.diskTotal,
	});

	ctx.response.status = 201;
});

router.post('/logs', hasBody(), auth.hasTelemetryKey(), async (ctx) => {
	const app = await auth.methods.getAppByTelemetryKey(ctx);

	if (!app) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'APP_NOT_FOUND',
			message: 'App was not found',
		};
		return;
	}

	const body = await ctx.request.body({ type: 'json' }).value;
	if (!body.message || typeof body.level !== 'number') {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'NO_MESSAGE_OR_LEVEL',
			message: 'You need to provide both message and level',
		};
		return;
	}

	await app.createServerLog(
		body.message.toString().trim(),
		+body.level,
		body.tag?.toString()?.trim(),
	);

	ctx.response.status = 201;
});

export default router;
