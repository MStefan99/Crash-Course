<template lang="pug">
#audience(v-if="app")
	h1 {{app.name}} audience
	.row.py-3.sticky.top-0.glass
		.input
			label(for="date-start") Starting from
			DatePicker#date-start.w-full(v-model="startTime" @change="load()")
		.input
			label(for="level-end") Ending on
			DatePicker#date-end.w-full(v-model="endTime" @change="load()")
	.row
		.card
			h2 Audience history
			TimedChart(:data="audienceAggregate" :yStacked="false" @click="(time) => openDayView(time)")
		.card
			h2 Traffic history
			h3 Most popular pages
			table.cells(v-if="pages")
				thead
					tr
						th Page
						th Views
				tbody
					tr(v-for="page of pages" :key="page.url")
						td.break-all
							a.underline(:href="page.url") {{page.url}}
						td {{page.hits}}
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';

import Api from '../scripts/api';
import type {App, AudienceAggregate, PageAggregate} from '../scripts/types';
import DatePicker from '../components/DatePicker.vue';
import TimedChart from '../components/TimedChart.vue';
import {alert, PopupColor} from '../scripts/popups';
import {useQuery} from '../scripts/composables';

const router = useRouter();
const route = useRoute();
const app = ref<App | null>(null);
const historicalAudience = ref<AudienceAggregate | null>(null);
const pages = ref<PageAggregate | null>(null);
const monthLength = 1000 * 60 * 60 * 24 * 30;
const initialTime = new Date(Date.now() - monthLength);
const startTime = ref<Date>(initialTime);
const endTime = ref<Date>(new Date());

const {query} = useQuery(
	computed(() => ({
		startTime: startTime.value.toISOString(),
		endTime: endTime.value.toISOString()
	}))
);
startTime.value = new Date(
	Array.isArray(query.value.startTime) ? query.value.startTime[0] : query.value.startTime
);
endTime.value = new Date(
	Array.isArray(query.value.endTime) ? query.value.endTime[0] : query.value.endTime
);

const audienceAggregate = computed(() => [
	{
		label: 'Users',
		color: '#ef8105',
		data: historicalAudience.value?.users
	},
	{
		label: 'Page views',
		color: '#44c40c',
		data: historicalAudience.value?.views
	}
]);

Api.apps
	.getByID(+route.params.id)
	.then((a) => {
		app.value = a;
		window.document.title = a.name + ' audience | Crash Course';
	})
	.catch((err) => alert('Failed to load the app', PopupColor.Red, err.message));

function load() {
	Api.apps
		.getAudienceAggregate(+route.params.id, startTime.value.getTime(), endTime.value.getTime())
		.then((a) => (historicalAudience.value = a));
	Api.apps
		.getPageAggregate(+route.params.id, startTime.value.getTime(), endTime.value.getTime())
		.then((p) => (pages.value = p));
}

load();

function openDayView(time: number) {
	router.push({name: 'audience-day', query: {start: new Date(time).toISOString()}});
}
</script>

<style scoped>
.row .card {
	flex-basis: 400px;
}
</style>