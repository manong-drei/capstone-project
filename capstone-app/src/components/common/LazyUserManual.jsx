import { lazy, Suspense } from "react";

const UserManual = lazy(() => import("./UserManual"));

export default function LazyUserManual({ role, isOpen, onClose }) {
  if (!isOpen || !role) return null;

  return (
    <Suspense fallback={<p role="status" className="fixed right-4 bottom-4 z-50 rounded-lg bg-white px-4 py-2 text-sm text-blue-950 shadow-md">Loading help…</p>}>
      <UserManual role={role} isOpen onClose={onClose} />
    </Suspense>
  );
}
