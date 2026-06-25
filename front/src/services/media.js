// Service média — endpoints /api/media/*
import api from "../lib/api";

// POST /api/media/upload (multipart) → { url, type, filename, size }
export async function upload(file) {
  const form = new FormData();
  form.append("file", file);
  // IMPORTANT : ne pas forcer Content-Type. Le navigateur doit poser lui-même
  // « multipart/form-data; boundary=… ». On met undefined pour écraser le défaut
  // application/json de l'instance axios, sinon multer ne trouve pas le boundary.
  const res = await api.post("/media/upload", form, {
    headers: { "Content-Type": undefined },
  });
  return res.data.data;
}
