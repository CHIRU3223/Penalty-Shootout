import { useEffect, useRef } from 'react';
import type { PlayerRole, ServerToClientMessage } from '@pk/shared';
import {
  createCameraState,
  getActiveLayout,
  resizeCamera,
  setCameraRole,
} from '../game/camera';
import { createBallState } from '../game/ball';
import { computeFps, createGameLoop } from '../game/loop';
import {
  createKeeperState,
  resetKeeper,
  syncKeeperLayout,
} from '../game/keeper';
import { createOnlineInputHandlers } from '../game/onlineInput';
import { OnlineStateMachine } from '../game/onlineState';
import { drawDuelFlash, drawFrame } from '../game/renderer';
import { playSound } from '../game/sounds';
import {
  createStrikerState,
  resetStriker,
  syncStrikerLayout,
} from '../game/striker';
import { handleDuelAnimUpdate, resetDuelEntities, syncCameraToRole } from '../game/duelAnimations';
import { onServerMessage, sendMessage } from '../net/socketClient';
import { useAppStore } from '../store/appStore';
import { loadProfile } from '../lib/storage';

interface OnlineGameCanvasProps {
  active: boolean;
}

export function OnlineGameCanvas({ active }: OnlineGameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lobby = useAppStore((s) => s.lobby);
  const setHud = useAppStore((s) => s.setHud);
  const setWinner = useAppStore((s) => s.setWinner);
  const setScreen = useAppStore((s) => s.setScreen);
  const soundEnabled = useAppStore((s) => s.soundEnabled);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const localSide = lobby.youAreHost ? ('host' as const) : ('guest' as const);
    const playerProfile = loadProfile();
    const opponentProfile = { id: 'online-opp', name: 'Opponent', flagId: 'de' };
    const ball = createBallState();
    const anim = { animStarted: false };
    const lastRole = { value: 'shooter' as PlayerRole };
    let camera = createCameraState(canvas.width, canvas.height, 'shooter');
    let layout = getActiveLayout(camera);

    const keeper = createKeeperState(
      layout.keeperBaseX,
      layout.keeperBaseY,
      layout.keeperW,
      layout.keeperH,
    );
    const striker = createStrikerState(layout.strikerX, layout.strikerY, layout.strikerScale, true);
    const opponentStriker = createStrikerState(
      layout.strikerX,
      layout.strikerY,
      layout.strikerScale,
      false,
    );

    const deltaSamples: number[] = [];
    let lastHudClock = -1;

    const syncHud = () => {
      const s = machine.snapshot;
      setHud({
        round: s.round,
        maxRounds: 5,
        playerRole: s.playerRole,
        score: s.score,
        pickClock: s.pickClock,
        lastPoint: s.lastPoint,
        phase: s.phase,
        isSuddenDeath: s.isSuddenDeath,
        activeKicker: s.playerRole === 'shooter' ? playerProfile : opponentProfile,
        activeKeeper: s.playerRole === 'keeper' ? playerProfile : opponentProfile,
        playerProfile,
        opponentProfile,
      });
    };

    const machine = new OnlineStateMachine({
      localSide,
      onSubmitPick: (zone) => sendMessage({ type: 'submit_zone_pick', zone }),
      onTurnResolved: () => {
        syncHud();
        if (soundEnabled) {
          const p = machine.snapshot.lastPoint;
          if (p === 'KICKER_POINT') playSound('goal');
          else if (p === 'KEEPER_POINT') playSound('save');
        }
      },
      onMatchComplete: (snap) => {
        syncHud();
        if (snap.winner) setWinner(snap.winner);
        window.setTimeout(() => setScreen('result'), 1200);
      },
    });

    const input = createOnlineInputHandlers(() => layout, machine, syncHud);
    input.attach(canvas);

    const applyLayoutToEntities = () => {
      layout = getActiveLayout(camera);
      syncKeeperLayout(keeper, layout.keeperBaseX, layout.keeperBaseY, layout.keeperW, layout.keeperH);
      syncStrikerLayout(striker, layout.strikerX, layout.strikerY, layout.strikerScale);
      syncStrikerLayout(opponentStriker, layout.strikerX, layout.strikerY, layout.strikerScale);
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(320, Math.floor(rect.width * dpr));
      const height = Math.max(480, Math.floor(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      resizeCamera(camera, width, height);
      setCameraRole(camera, width, height, machine.snapshot.playerRole);
      lastRole.value = machine.snapshot.playerRole;
      applyLayoutToEntities();
      resetKeeper(keeper);
      resetStriker(striker);
      resetStriker(opponentStriker);
    };

    const offMsg = onServerMessage((msg: ServerToClientMessage) => {
      if (msg.type === 'match_start') {
        machine.initFromMatchStart(msg.round, msg.yourRole, msg.score);
        syncHud();
      } else if (msg.type === 'turn_result') {
        machine.applyTurnResult(msg);
        syncHud();
      } else if (msg.type === 'match_end') {
        machine.finishMatch(msg.score, msg.winner);
        syncHud();
      } else if (msg.type === 'opponent_disconnected') {
        setScreen('lobby');
      }
    });

    const loop = createGameLoop({
      update(dt) {
        deltaSamples.push(dt);
        if (deltaSamples.length > 30) deltaSamples.shift();

        machine.update(dt);

        const s = machine.snapshot;

        syncCameraToRole(
          camera,
          canvas.width,
          canvas.height,
          s.playerRole,
          lastRole,
          () => {
            applyLayoutToEntities();
            resetDuelEntities(layout, ball, keeper, striker, opponentStriker);
            anim.animStarted = false;
          },
        );

        handleDuelAnimUpdate(
          anim,
          layout,
          ball,
          keeper,
          striker,
          opponentStriker,
          s,
          dt,
        );

        const clockTick = Math.ceil(s.pickClock);
        if (clockTick !== lastHudClock && s.phase === 'PICK') {
          lastHudClock = clockTick;
          syncHud();
        }

        if (deltaSamples.length % 10 === 0) {
          setHud({ fps: computeFps(deltaSamples) });
        }
      },
      render() {
        const s = machine.snapshot;
        layout = getActiveLayout(camera);
        const animating = ball.active || keeper.diving;

        drawFrame(ctx, layout, ball, keeper, striker, opponentStriker, {
          phase: s.phase,
          playerRole: s.playerRole,
          playerPick: s.playerPick,
          hoverZone: s.hoverZone,
          kickZone: s.kickZone,
          keepZone: s.keepZone,
          playerLocked: s.playerLocked,
          opponentLocked: s.opponentLocked,
          showOpponentPick: s.phase === 'REVEAL' || s.phase === 'RESOLVE',
          lastPoint: s.lastPoint,
          animating,
        });

        if (s.phase === 'RESOLVE' && s.lastPoint) {
          drawDuelFlash(ctx, layout, s.lastPoint, 1 - Math.min(1, s.resolveTimer / 1.4));
        }
      },
    });

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    syncHud();
    loop.start();

    return () => {
      loop.stop();
      input.detach();
      offMsg();
      observer.disconnect();
    };
  }, [active, lobby.youAreHost, setHud, setScreen, setWinner, soundEnabled]);

  return (
    <div ref={containerRef} className="relative h-full min-h-[420px] w-full flex-1">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}
