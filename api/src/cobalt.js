import "dotenv/config";

import express from "express";
import cluster from "node:cluster";

import path from "path";
import { fileURLToPath } from "url";

import { env, isCluster } from "./config.js"
import { Red } from "./misc/console-text.js";
import { initCluster } from "./misc/cluster.js";
import { setupEnvWatcher } from "./core/env.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename).slice(0, -4);

app.disable("x-powered-by");

if (env.apiURL) {
    if (!process.env.API_URL && !process.env.RAILWAY_PUBLIC_DOMAIN && !process.env.RAILWAY_STATIC_URL && process.env.RAILWAY_PROJECT_ID && cluster.isPrimary) {
        console.warn(
            "warning: no public domain found. generate a domain in railway (Settings > Networking) " +
            "or set API_URL, otherwise download links will point to localhost."
        );
    }

    const { runAPI } = await import("./core/api.js");

    if (isCluster) {
       await initCluster();
    }

    if (env.envFile) {
        setupEnvWatcher();
    }

    runAPI(express, app, __dirname, cluster.isPrimary);
} else {
    console.log(
        Red("API_URL env variable is missing, cobalt api can't start.")
    )
}
