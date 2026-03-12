import ky from "ky";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

export const apiClient = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 10_000,
  retry: {
    limit: 2,
    methods: ["get", "put", "head", "delete", "options", "trace"],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  headers: {
    accept: "application/json",
  },
});
