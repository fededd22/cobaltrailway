import env from "$lib/env";
import { browser } from "$app/environment";
import { get } from "svelte/store";
import settings from "$lib/state/settings";

export const currentApiURL = () => {
    const processingSettings = get(settings).processing;
    const customInstanceURL = processingSettings.customInstanceURL;

    if (processingSettings.enableCustomInstances && customInstanceURL.length > 0) {
        return new URL(customInstanceURL).origin;
    }

    // "self" = the frontend is served by the api itself (single-service deploys)
    if (env.DEFAULT_API === "self" && browser) {
        return location.origin;
    }

    return new URL(env.DEFAULT_API!).origin;
}
