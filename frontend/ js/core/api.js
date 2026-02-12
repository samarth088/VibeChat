import { ENV } from "../../config/env.js";
import { State } from "./state.js";

// Generic API helper
export async function api(path, method = "GET", body = null) {
  try {
    const res = await fetch(`${ENV.API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: State.user?.id || ""
      },
      body: body ? JSON.stringify(body) : null
    });

    return await res.json();

  } catch (err) {
    console.error("API Error:", err);
    return { error: "Server error" };
  }
}
