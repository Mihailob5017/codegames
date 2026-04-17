import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		host: "0.0.0.0",
		port: Number.parseInt(process.env.WEB_PORT || "3000"),
		proxy: {
			"/api": {
				target: process.env.API_URL || "http://api:4000",
				changeOrigin: true,
			},
		},
	},
});
