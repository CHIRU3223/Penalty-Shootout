import type { Zone } from '@pk/shared';
import { canvasPointFromEvent, zoneFromPoint, type Layout } from './geometry';
import type { OnlineStateMachine } from './onlineState';

export function createOnlineInputHandlers(
  getLayout: () => Layout,
  machine: OnlineStateMachine,
  onAction?: () => void,
) {
  let canvas: HTMLCanvasElement | null = null;

  const getZone = (clientX: number, clientY: number): Zone | null => {
    if (!canvas) return null;
    const point = canvasPointFromEvent(canvas, clientX, clientY);
    return zoneFromPoint(getLayout(), point.x, point.y);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const snap = machine.snapshot;
    if (snap.phase !== 'PICK' || snap.playerLocked) return;

    const zone = getZone(e.clientX, e.clientY);
    if (zone !== null) {
      machine.pickZone(zone);
      onAction?.();
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (machine.snapshot.phase === 'PICK' && !machine.snapshot.playerLocked) {
      machine.setHoverZone(getZone(e.clientX, e.clientY));
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (canvas?.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  return {
    attach(target: HTMLCanvasElement) {
      canvas = target;
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
      canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
    },
    detach() {
      if (!canvas) return;
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas = null;
    },
  };
}
