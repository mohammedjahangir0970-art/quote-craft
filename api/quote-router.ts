import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { quotes, quoteItems } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

function generateQuoteNumber(_userId: number, count: number) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const seq = String(count + 1).padStart(4, "0");
  return `QC-${year}${month}-${seq}`;
}

export const quoteRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userQuotes = await db
      .select()
      .from(quotes)
      .where(eq(quotes.userId, ctx.user.id))
      .orderBy(desc(quotes.createdAt));
    return userQuotes;
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [quote] = await db
        .select()
        .from(quotes)
        .where(and(eq(quotes.id, input.id), eq(quotes.userId, ctx.user.id)));
      if (!quote) return null;

      const items = await db
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, quote.id))
        .orderBy(quoteItems.sortOrder);

      return { ...quote, items };
    }),

  create: authedQuery
    .input(
      z.object({
        customerName: z.string().min(1),
        customerEmail: z.string().email().optional().or(z.literal("")),
        customerPhone: z.string().optional(),
        customerAddress: z.string().optional(),
        trade: z.string().optional(),
        jobDescription: z.string().optional(),
        notes: z.string().optional(),
        taxRate: z.number().default(0),
        includeTax: z.boolean().default(true),
        subtotal: z.number().default(0),
        taxAmount: z.number().default(0),
        total: z.number().default(0),
        items: z.array(
          z.object({
            description: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            total: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Count existing quotes for quote number generation
      const existing = await db
        .select({ count: sql<number>`count(*)` })
        .from(quotes)
        .where(eq(quotes.userId, ctx.user.id));

      const quoteNumber = generateQuoteNumber(
        ctx.user.id,
        existing[0]?.count ?? 0
      );

      const [quote] = await db.insert(quotes).values({
        userId: ctx.user.id,
        quoteNumber,
        customerName: input.customerName,
        customerEmail: input.customerEmail || null,
        customerPhone: input.customerPhone || null,
        customerAddress: input.customerAddress || null,
        trade: input.trade || null,
        jobDescription: input.jobDescription || null,
        notes: input.notes || null,
        taxRate: String(input.taxRate),
        includeTax: input.includeTax,
        subtotal: String(input.subtotal),
        taxAmount: String(input.taxAmount),
        total: String(input.total),
        status: "draft",
      });

      const quoteId = Number(quote.insertId);

      // Insert line items
      if (input.items.length > 0) {
        await db.insert(quoteItems).values(
          input.items.map((item, idx) => ({
            quoteId,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            total: String(item.total),
            sortOrder: idx,
          }))
        );
      }

      return { id: quoteId, quoteNumber };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        customerName: z.string().min(1).optional(),
        customerEmail: z.string().optional(),
        customerPhone: z.string().optional(),
        customerAddress: z.string().optional(),
        trade: z.string().optional(),
        jobDescription: z.string().optional(),
        notes: z.string().optional(),
        taxRate: z.number().optional(),
        includeTax: z.boolean().optional(),
        subtotal: z.number().optional(),
        taxAmount: z.number().optional(),
        total: z.number().optional(),
        status: z.enum(["draft", "sent", "approved", "declined", "expired"]).optional(),
        items: z
          .array(
            z.object({
              description: z.string(),
              quantity: z.number(),
              unitPrice: z.number(),
              total: z.number(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, items, ...updateData } = input;

      // Verify ownership
      const [existing] = await db
        .select()
        .from(quotes)
        .where(and(eq(quotes.id, id), eq(quotes.userId, ctx.user.id)));

      if (!existing) throw new Error("Quote not found");

      const updateValues: Record<string, unknown> = {};
      if (updateData.customerName !== undefined)
        updateValues.customerName = updateData.customerName;
      if (updateData.customerEmail !== undefined)
        updateValues.customerEmail = updateData.customerEmail || null;
      if (updateData.customerPhone !== undefined)
        updateValues.customerPhone = updateData.customerPhone || null;
      if (updateData.customerAddress !== undefined)
        updateValues.customerAddress = updateData.customerAddress || null;
      if (updateData.trade !== undefined)
        updateValues.trade = updateData.trade || null;
      if (updateData.jobDescription !== undefined)
        updateValues.jobDescription = updateData.jobDescription || null;
      if (updateData.notes !== undefined)
        updateValues.notes = updateData.notes || null;
      if (updateData.taxRate !== undefined)
        updateValues.taxRate = String(updateData.taxRate);
      if (updateData.includeTax !== undefined)
        updateValues.includeTax = updateData.includeTax;
      if (updateData.subtotal !== undefined)
        updateValues.subtotal = String(updateData.subtotal);
      if (updateData.taxAmount !== undefined)
        updateValues.taxAmount = String(updateData.taxAmount);
      if (updateData.total !== undefined)
        updateValues.total = String(updateData.total);
      if (updateData.status !== undefined) {
        updateValues.status = updateData.status;
        if (updateData.status === "sent") updateValues.sentAt = new Date();
        if (updateData.status === "approved")
          updateValues.approvedAt = new Date();
        if (updateData.status === "declined")
          updateValues.declinedAt = new Date();
      }

      await db.update(quotes).set(updateValues).where(eq(quotes.id, id));

      // Update line items if provided
      if (items && items.length > 0) {
        await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
        await db.insert(quoteItems).values(
          items.map((item, idx) => ({
            quoteId: id,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            total: String(item.total),
            sortOrder: idx,
          }))
        );
      }

      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(quotes)
        .where(and(eq(quotes.id, input.id), eq(quotes.userId, ctx.user.id)));

      if (!existing) throw new Error("Quote not found");

      await db.delete(quoteItems).where(eq(quoteItems.quoteId, input.id));
      await db.delete(quotes).where(eq(quotes.id, input.id));

      return { success: true };
    }),

  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userQuotes = await db
      .select()
      .from(quotes)
      .where(eq(quotes.userId, ctx.user.id));

    const totalQuotes = userQuotes.length;
    const totalSent = userQuotes.filter((q) => q.status === "sent").length;
    const totalApproved = userQuotes.filter(
      (q) => q.status === "approved"
    ).length;
    const totalDeclined = userQuotes.filter(
      (q) => q.status === "declined"
    ).length;
    const totalDraft = userQuotes.filter((q) => q.status === "draft").length;
    const revenue = userQuotes
      .filter((q) => q.status === "approved")
      .reduce((sum, q) => sum + Number(q.total), 0);

    const nonDraft = totalSent + totalApproved + totalDeclined;
    const winRate = nonDraft > 0 ? Math.round((totalApproved / nonDraft) * 100) : 0;

    return {
      totalQuotes,
      totalSent,
      totalApproved,
      totalDeclined,
      totalDraft,
      revenue,
      winRate,
    };
  }),

  duplicate: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(quotes)
        .where(and(eq(quotes.id, input.id), eq(quotes.userId, ctx.user.id)));

      if (!existing) throw new Error("Quote not found");

      const items = await db
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, input.id));

      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(quotes)
        .where(eq(quotes.userId, ctx.user.id));

      const [newQuote] = await db.insert(quotes).values({
        userId: ctx.user.id,
        quoteNumber: generateQuoteNumber(ctx.user.id, count[0]?.count ?? 0),
        customerName: existing.customerName,
        customerEmail: existing.customerEmail,
        customerPhone: existing.customerPhone,
        customerAddress: existing.customerAddress,
        trade: existing.trade,
        jobDescription: existing.jobDescription,
        notes: existing.notes,
        taxRate: existing.taxRate,
        includeTax: existing.includeTax,
        subtotal: existing.subtotal,
        taxAmount: existing.taxAmount,
        total: existing.total,
        status: "draft",
      });

      const newId = Number(newQuote.insertId);

      if (items.length > 0) {
        await db.insert(quoteItems).values(
          items.map((item) => ({
            quoteId: newId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            sortOrder: item.sortOrder,
          }))
        );
      }

      return { id: newId };
    }),
});
