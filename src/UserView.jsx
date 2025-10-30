// src/UserView.jsx

useEffect(() => {
  tg.BackButton.show();
  tg.onEvent('backButtonClicked', () => tg.close());

  const initializeUser = async () => {
    if (!user?.id) {
      setError("Не удалось определить пользователя.");
      setLoading(false);
      return;
    }

    try {
      // --- НОВЫЙ БЛОК: РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ ---
      // Это "тихий" запрос, который просто обеспечивает наличие юзера в БД
      await fetch('/api/registerUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      // ---------------------------------------------

      // Загрузка долгов (остается как было)
      const response = await fetch(`/api/getDebts?userId=${user.id}`);
      if (!response.ok) throw new Error('Ошибка сети');
      const data = await response.json();
      setDebts(data.filter(d => d.status === 'UNPAID'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  initializeUser();
}, [user?.id]);