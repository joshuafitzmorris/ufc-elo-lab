import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export function AuthHeader() {
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)]">
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
      </SignedIn>
    </div>
  );
}
