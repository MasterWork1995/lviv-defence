// Root layout — passes through to [locale]/layout.tsx which owns <html> and <body>.
// Required by Next.js, but does not render its own html/body wrapper.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
