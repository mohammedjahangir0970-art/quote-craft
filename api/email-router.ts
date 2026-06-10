import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import nodemailer from "nodemailer";

// Create a transporter using SMTP
// For production, you should use a proper email service
function getTransporter() {
  // Check if we have SMTP credentials
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: use a console logger for development
  return {
    sendMail: async (options: nodemailer.SendMailOptions) => {
      console.log("[EMAIL] Would send email:");
      console.log("  To:", options.to);
      console.log("  Subject:", options.subject);
      console.log("  Body:", options.text || options.html?.toString().slice(0, 200));
      return { messageId: "dev-mode" };
    },
  } as nodemailer.Transporter;
}

export const emailRouter = createRouter({
  notifySignup: publicQuery
    .input(
      z.object({
        userEmail: z.string().email(),
        userName: z.string().optional(),
        plan: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const transporter = getTransporter();

        const primaryEmail = "quotecraft@quote-craft.uk";
        const fallbackEmail = "mohammedjahangir0970@gmail.com";

        const subject = `New QuoteCraft Signup: ${input.userName || input.userEmail}`;
        const html = `
          <h2>New User Signed Up for QuoteCraft</h2>
          <table style="border-collapse:collapse;max-width:500px">
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Name:</strong></td><td style="padding:8px;border:1px solid #ddd">${input.userName || "N/A"}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Email:</strong></td><td style="padding:8px;border:1px solid #ddd">${input.userEmail}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Plan:</strong></td><td style="padding:8px;border:1px solid #ddd">${input.plan || "Free"}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Date:</strong></td><td style="padding:8px;border:1px solid #ddd">${new Date().toLocaleString()}</td></tr>
          </table>
          <p style="margin-top:16px;color:#666">This is an automated notification from QuoteCraft.</p>
        `;

        // Send to primary
        await transporter.sendMail({
          from: `"QuoteCraft" <${primaryEmail}>`,
          to: primaryEmail,
          subject,
          html,
          text: `New signup: ${input.userName || "N/A"} (${input.userEmail}) - Plan: ${input.plan || "Free"}`,
        });

        // Send to fallback (CC)
        await transporter.sendMail({
          from: `"QuoteCraft" <${primaryEmail}>`,
          to: fallbackEmail,
          subject,
          html,
          text: `New signup: ${input.userName || "N/A"} (${input.userEmail}) - Plan: ${input.plan || "Free"}`,
        });

        return { success: true };
      } catch {
        // Silently fail - don't block signup flow
        return { success: false };
      }
    }),

  sendRecoveryEmail: publicQuery
    .input(
      z.object({
        to: z.string().email(),
        userName: z.string(),
        quoteDetails: z.string(),
        quoteUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const transporter = getTransporter();
        const fromEmail = process.env.SMTP_FROM || "quotecraft@quote-craft.uk";

        await transporter.sendMail({
          from: `"QuoteCraft" <${fromEmail}>`,
          to: input.to,
          subject: "Don't forget to send your quote!",
          html: `
            <h2>Hi ${input.userName},</h2>
            <p>You started creating a quote but haven't sent it yet.</p>
            <blockquote style="border-left:4px solid #2563eb;padding-left:16px;color:#444">
              ${input.quoteDetails}
            </blockquote>
            <p><a href="${input.quoteUrl}" style="background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Finish Your Quote</a></p>
            <p style="color:#666;font-size:12px">QuoteCraft - Professional quoting for tradespeople</p>
          `,
        });

        return { success: true };
      } catch {
        return { success: false };
      }
    }),
});
