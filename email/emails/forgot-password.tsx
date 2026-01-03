import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

import config from "../../_config.json";

interface ForgotPasswordEmailProps {
  displayName?: string;
  link?: string;
}

export const ForgotPasswordEmail = ({ displayName, link }: ForgotPasswordEmailProps) => {
  const previewText = `Reset your ${config.branding.name} password`;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>{previewText}</Preview>
        <Container style={container}>
          <Section style={box}>
            <Heading style={h1}>{config.branding.name}</Heading>
            <Hr style={hr} />
            <Text style={paragraph}>Hi {displayName || "there"},</Text>
            <Text style={paragraph}>
              We received a request to reset your password for your <strong>{config.branding.name}</strong> account. Click the button below
              to reset your password.
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={link}>
                Reset Password
              </Button>
            </Section>
            <Text style={paragraph}>
              Or copy and paste this URL into your browser:{" "}
              <Link href={link} style={anchor}>
                {link}
              </Link>
            </Text>
            <Hr style={hr} />
            <Text style={footerText}>
              If you didn&apos;t request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </Text>
            <Text style={footerText}>This link will expire in 1 hour for security reasons.</Text>
            <Hr style={hr} />
            <Text style={footer}>— The {config.branding.name} team</Text>
            <Text style={footerLinks}>
              <Link href={config.links.terms} style={footerAnchor}>
                Terms of Service
              </Link>{" "}
              •{" "}
              <Link href={config.links.privacy} style={footerAnchor}>
                Privacy Policy
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

ForgotPasswordEmail.PreviewProps = {
  displayName: "John Doe",
  link: "https://example.com/reset-password?token=abc123",
} as ForgotPasswordEmailProps;

export default ForgotPasswordEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "465px",
  borderRadius: "8px",
};

const box = {
  padding: "0 48px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold" as const,
  margin: "30px 0",
  padding: "0",
  textAlign: "center" as const,
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const paragraph = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const anchor = {
  color: "#556cd6",
  wordBreak: "break-all" as const,
};

const footerText = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "20px",
  textAlign: "left" as const,
  margin: "8px 0",
};

const footer = {
  color: "#525f7f",
  fontSize: "14px",
  lineHeight: "16px",
  marginTop: "20px",
};

const footerLinks = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  marginTop: "12px",
  textAlign: "center" as const,
};

const footerAnchor = {
  color: "#8898aa",
  textDecoration: "underline",
};
