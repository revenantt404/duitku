export function toCsvValue(v: string): string {
  const needsQuote = /[",\n]/.test(v);
  const escaped = v.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map(toCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// helper khusus transaksi
export function buildTransactionCsvRows(
  txs: { date: string; type: string; amount: number; categoryName: string; walletName: string; toWalletName: string; description: string | null }[]
): string[][] {
  const header = ["Tanggal", "Tipe", "Nominal", "Kategori", "Dompet", "Tujuan", "Catatan"];
  const body = txs.map((t) => [
    new Date(t.date).toLocaleDateString("id-ID"),
    t.type,
    String(t.amount),
    t.categoryName || "",
    t.walletName || "",
    t.toWalletName || "",
    t.description || "",
  ]);
  return [header, ...body];
}
