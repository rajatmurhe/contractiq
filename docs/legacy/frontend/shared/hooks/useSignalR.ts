import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export const useSignalR = (runId: string) => {
  const [events, setEvents] = useState<any[]>([]);
  const [connectionState, setConnectionState] = useState<string>('Disconnected');
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl('/agentws', { accessTokenFactory: () => 'mock-token' })
      .withAutomaticReconnect()
      .build();

    conn.start().then(() => {
      setConnectionState('Connected');
      if (runId) conn.invoke('JoinRun', runId);
    }).catch(() => setConnectionState('Failed'));

    conn.on('Event', (evt) => {
      setEvents(prev => [...prev, evt]);
      setLastEvent(evt);
    });

    return () => { conn.stop(); };
  }, [runId]);

  return { events, connectionState, lastEvent };
};
