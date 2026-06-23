// Service média — endpoints /api/media/*
import api from "../lib/api";

// POST /api/media/upload (multipart) → { url, type, filename, size }
export async function upload(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/media/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}
