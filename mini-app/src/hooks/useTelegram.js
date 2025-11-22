import { useEffect, useState } from 'react';

export function useTelegram() {
  const [tg, setTg] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const telegram = window.Telegram?.WebApp;
    if (telegram) {
      telegram.ready();
      telegram.expand();
      setTg(telegram);
      setUser(telegram.initDataUnsafe?.user);
    }
  }, []);

  return {
    tg,
    user,
    platform: tg?.platform,
    isExpanded: tg?.isExpanded,
    colorScheme: tg?.colorScheme
  };
}
