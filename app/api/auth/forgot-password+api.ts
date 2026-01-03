import { getUserByEmail } from "@/server/auth";

// Firebase
import { auth } from "@/integrations/firebase.server";

// Resend
import { Resend } from "resend";

// Zod
import { z } from "zod";

import config from "@/_config.json";
import EmailTemplate from "@/email/emails/forgot-password";

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.email("Invalid email format"),
});
export async function POST(request: Request): Promise<Response> {
  const { email } = await request.json();

  // Validate request
  const validated = forgotPasswordSchema.safeParse({ email });
  if (!validated.success) {
    return Response.json({ error: validated.error.message }, { status: 400 });
  }

  const user = await getUserByEmail(email);

  //
  //
  //
  if (!user) {
    // You may change this, we just choose to not intidate if an account exists in our system
    // random time .5s to 2.
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1500 + 500));
    return Response.json({ message: "Password reset send" }, { status: 200 });
  }

  // Generate password reset link
  const link = await auth.generatePasswordResetLink(email);

  if (!!process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: `${config.branding.name} <${config.mail.from}>`,
      to: [user.email!],
      subject: `Reset your ${config.branding.name} password`,
      react: EmailTemplate({
        displayName: user.displayName || "",
        link: link,
      }),
    });
  }

  return Response.json({ message: "Password reset email sent" });
}
