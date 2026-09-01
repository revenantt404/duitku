import { z } from "zod";

export const walletSchema = z.object({
  name: z.string().min(1, "Nama dompet wajib diisi").max(30),
  type: z.enum(["CASH", "BANK", "E_WALLET", "INVESTMENT", "OTHER"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B82F6"),
  icon: z.string().default("wallet"),
  initialBalance: z.preprocess((v) => (v === "" || v === undefined || v === null ? 0 : v), z.coerce.number().int().min(0).default(0)),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(30),
  icon: z.string().default("tag"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#10B981"),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export const transactionSchema = z
  .object({
    walletId: z.string().min(1, "Pilih dompet"),
    toWalletId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    amount: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : v),
      z.coerce.number({ required_error: "Nominal harus > 0", invalid_type_error: "Nominal harus > 0" }).int().positive("Nominal harus > 0").max(9_999_999_999, "Maks 9.999.999.999")
    ),
    description: z.string().max(100).optional().nullable(),
    date: z.coerce.date().default(() => new Date()),
  })
  .superRefine((data, ctx) => {
    if (data.type === "TRANSFER" && !data.toWalletId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pilih dompet tujuan untuk transfer",
        path: ["toWalletId"],
      });
    }
    if (data.type === "TRANSFER" && data.walletId === data.toWalletId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Dompet asal & tujuan tidak boleh sama",
        path: ["toWalletId"],
      });
    }
    if (data.type !== "TRANSFER" && !data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pilih kategori",
        path: ["categoryId"],
      });
    }
  });

export const budgetSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.coerce.number({ required_error: "Nominal harus > 0", invalid_type_error: "Nominal harus > 0" }).int().positive("Nominal harus > 0").max(9_999_999_999, "Maks 9.999.999.999")
  ),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
});

export const goalSchema = z.object({
  name: z.string().min(1).max(50),
  targetAmount: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.coerce.number({ required_error: "Target harus > 0", invalid_type_error: "Target harus > 0" }).int().positive("Target harus > 0").max(9_999_999_999)
  ),
  currentAmount: z.preprocess((v) => (v === "" || v === undefined || v === null ? 0 : v), z.coerce.number().int().min(0).default(0)),
  deadline: z.coerce.date().optional().nullable(),
  icon: z.string().default("target"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#F59E0B"),
});

export type WalletInput = z.infer<typeof walletSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
