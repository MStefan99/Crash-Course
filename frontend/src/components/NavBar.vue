<template lang="pug">
div
	nav.text-white.font-semibold
		span(v-if="appState.user")
			RouterLink.clickable(:to="{name: 'apps'}") Apps
			RouterLink.clickable(:to="{name: 'profile'}") Profile
		span
			span.clickable(v-if="!appState.user" @click="connectionDialogOpen = true") Sign in
			div(v-else)
				span.clickable(@click="logout()") Sign out
	Transition(name="popup")
		ConnectionDialog(v-if="connectionDialogOpen" @close="connectionDialogOpen = false")
</template>

<script setup lang="ts">
import {ref} from 'vue';

import {appState} from '../scripts/store';
import Api from '../scripts/api';
import ConnectionDialog from './ConnectionDialog.vue';
import {alert, PopupColor} from '../scripts/popups';

const connectionDialogOpen = ref<boolean>(false);

function logout() {
	Api.auth.logout().catch((err) => alert('Failed to sign out', PopupColor.Red, err.message));
}
</script>

<style scoped>
label {
	display: block;
}

input {
	@apply border-2 border-accent rounded-xl w-full p-2 my-3 shadow;
}

input[type='submit'] {
	@apply bg-accent font-bold text-background text-xl shadow-md;
}
</style>
