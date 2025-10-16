import axios from "axios";
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
export const useMock = String(import.meta.env.VITE_USE_MOCK) === "1";
export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${t}`;
  }
  return config;
});

export type LoginReq = { email: string; password: string };
export type LoginRes = { token: string; user: { id: string; name: string; email: string } };

export async function loginApi(body: LoginReq): Promise<LoginRes> {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 700));
    if (body.email === "test@uni.edu" && body.password === "123456") {
      return { token: "mock-token-abc123", user: { id: "u1", name: "Test User", email: body.email } };
    }
    throw new Error("E-posta veya şifre hatalı.");
  }
  const { data } = await api.post<LoginRes>("/auth/login", body);
  return data;
}
