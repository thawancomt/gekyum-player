import { getCurrentWindow } from '@tauri-apps/api/window';

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export function TitleBar() {
  const minimize = () => isTauri() && getCurrentWindow().minimize();
  const maximize = () => isTauri() && getCurrentWindow().toggleMaximize();
  const close = () => isTauri() && getCurrentWindow().close();

  return (
    <div data-tauri-drag-region className="h-8 flex items-center justify-end select-none bg-muted">
      <button onClick={minimize}>–</button>
      <button onClick={maximize}>□</button>
      <button onClick={close}>✕</button>
    </div>
  );
}
