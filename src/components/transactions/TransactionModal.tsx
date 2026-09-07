"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { X, Camera, Image as ImageIcon, Loader2, Sparkles, Trash2 } from "lucide-react";
import clsx from "clsx";
import {
  createTransactionAction,
  updateTransactionAction,
  type TransactionFormState,
} from "@/lib/actions/transactions";
import { analyzeReceiptAction } from "@/lib/actions/receipts";
import { Label, Input, Select, Textarea, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { toDateInputValue } from "@/lib/format";
import type { CategoryItem } from "@/components/categories/CategoriesManager";

export type EditingTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
  date: string;
  categoryId: string | null;
  receiptPath: string | null;
};

const initialState: TransactionFormState = {};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "Terisi otomatis — cek sebelum simpan",
  medium: "Terisi otomatis, mohon periksa kembali",
  low: "Kurang yakin — periksa kembali",
};

export function TransactionModal({
  open,
  onClose,
  editing,
  categories,
  defaultType,
}: {
  open: boolean;
  onClose: () => void;
  editing: EditingTransaction | null;
  categories: CategoryItem[];
  defaultType: "INCOME" | "EXPENSE";
}) {
  const action = editing ? updateTransactionAction : createTransactionAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(editing?.type ?? defaultType);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [receiptPath, setReceiptPath] = useState<string | null>(editing?.receiptPath ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    editing?.receiptPath ? `/api/receipts/${editing.receiptPath}` : null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState<{ text: string; kind: "info" | "error" } | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setType(editing?.type ?? defaultType);
      setAmount(editing ? String(editing.amount) : "");
      setDescription(editing?.description ?? "");
      setCategoryId(editing?.categoryId ?? "");
      setReceiptPath(editing?.receiptPath ?? null);
      setPreviewUrl(editing?.receiptPath ? `/api/receipts/${editing.receiptPath}` : null);
      setUploadNote(null);
    }
  }, [open, editing, defaultType]);

  useEffect(() => {
    if (state.success) onClose();
    // Depend on the whole state object (not state.success) so this fires on
    // every successful submission, not just the first true value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  function handleTypeChange(t: "INCOME" | "EXPENSE") {
    setType(t);
    if (!categories.some((c) => c.id === categoryId && c.type === t)) {
      setCategoryId("");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setUploadNote(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await analyzeReceiptAction(formData);

      if (result.receiptPath) setReceiptPath(result.receiptPath);

      if (result.extracted) {
        setType(result.extracted.type);
        setAmount(String(result.extracted.amount));
        if (result.extracted.description) setDescription(result.extracted.description);
        setCategoryId(result.extracted.categoryId ?? "");
        setUploadNote({
          text: CONFIDENCE_LABEL[result.extracted.confidence] ?? "Terisi otomatis dari foto",
          kind: result.extracted.confidence === "low" ? "error" : "info",
        });
      } else if (result.error) {
        setUploadNote({ text: result.error, kind: "error" });
      }
    } catch {
      setUploadNote({ text: "Gagal mengunggah foto. Coba lagi.", kind: "error" });
    } finally {
      setUploading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function handleRemovePhoto() {
    setReceiptPath(null);
    setPreviewUrl(null);
    setUploadNote(null);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fade-in-up">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {editing ? "Edit Transaksi" : "Tambah Transaksi"}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <input type="hidden" name="receiptPath" value={receiptPath ?? ""} />

          <div>
            <Label>Foto Bukti Transaksi (opsional)</Label>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Bukti transaksi" className="h-full w-full object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {uploading ? (
                    <p className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      Membaca bukti transaksi...
                    </p>
                  ) : uploadNote ? (
                    <p
                      className={clsx(
                        "flex items-center gap-1.5 text-sm font-medium",
                        uploadNote.kind === "error" ? "text-amber-600" : "text-emerald-600"
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {uploadNote.text}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-slate-600">Foto tersimpan</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Ambil ulang
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Pilih file lain
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 py-5 text-slate-400 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-sm font-medium">Ambil Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 py-5 text-slate-400 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600"
                >
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Pilih dari Galeri</span>
                </button>
                <p className="col-span-2 mt-0.5 text-center text-xs text-slate-400">
                  Jumlah, jenis &amp; kategori terisi otomatis
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(["INCOME", "EXPENSE"] as const).map((t) => (
              <label
                key={t}
                className={clsx(
                  "flex cursor-pointer items-center justify-center rounded-xl border py-2.5 text-sm font-medium transition-colors",
                  type === t
                    ? t === "INCOME"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={type === t}
                  onChange={() => handleTypeChange(t)}
                  className="sr-only"
                />
                {t === "INCOME" ? "Pemasukan" : "Pengeluaran"}
              </label>
            ))}
          </div>

          <div>
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={1}
              step="1"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={
                  editing ? toDateInputValue(editing.date) : toDateInputValue(new Date())
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="categoryId">Kategori</Label>
              <Select
                id="categoryId"
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Tanpa kategori</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Catatan (opsional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Belanja bulanan di supermarket"
            />
          </div>

          <FieldError>{state.error}</FieldError>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" fullWidth disabled={pending || uploading}>
              {pending ? "Menyimpan..." : uploading ? "Menunggu foto..." : "Simpan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
