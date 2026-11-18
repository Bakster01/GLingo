import { useEffect, useRef, type PropsWithChildren } from "react";

export function Modal({ children, onClose, titleId }: PropsWithChildren<{ onClose: () => void; titleId: string }>) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} className="w-[calc(100%-2.5rem)] max-w-md rounded-2xl border-0 bg-white p-7 text-center shadow-xl backdrop:bg-black/40">{children}</dialog>;
}
