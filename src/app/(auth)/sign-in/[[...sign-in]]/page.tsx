import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-[var(--surface)] shadow-lg border border-[var(--outline)]',
              headerTitle: 'text-[var(--foreground)]',
              headerSubtitle: 'text-[var(--muted)]',
              socialButtonsBlockButton:
                'border border-[var(--outline)] hover:bg-[var(--surface-muted)]',
              formButtonPrimary:
                'bg-[var(--accent)] hover:bg-[var(--accent-strong)]',
              footerActionLink: 'text-[var(--accent)] hover:text-[var(--accent-strong)]',
              identityPreviewText: 'text-[var(--foreground)]',
              formFieldLabel: 'text-[var(--foreground)]',
              formFieldInput:
                'border-[var(--outline)] focus:border-[var(--accent)] text-[var(--foreground)]',
              dividerLine: 'bg-[var(--outline)]',
              dividerText: 'text-[var(--muted)]',
            },
          }}
        />
      </div>
    </div>
  );
}
