export const fetchWithRefr = async (url, options = {}) => {
  let res = await fetch(url, {
    ...options,
    credentials: "include"
  });

  if (res.status === 401) {
    const refreshRes = await fetch(`${import.meta.env.VITE_API_UR}/refresh`, {
      method: "POST",
      credentials: "include"
    });

    if (refreshRes.status !== 200) {
      window.dispatchEvent(new Event("auth:logout"));
      throw new Error("Not authenticated");
    }

    res = await fetch(url, {
      ...options,
      credentials: "include"
    });
  }

  return res;
};