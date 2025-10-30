import { useState, useEffect } from 'react';
// Не нужно импортировать App.css, так как он уже импортирован в App.jsx

const tg = window.Telegram.WebApp;

export default function UserView() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = tg.initDataUnsafe?.user;

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

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  const totalAmount = debts.reduce((sum, debt) => sum + debt.amount, 0);

  return (
    <>
      {debts.length === 0 ? (
        <div className="no-debts">
          <h2>Долгов нет! 🎉</h2>
        </div>
      ) : (
        <>
          <div className="total-debt">
            <span>Общий долг:</span>
            <h1>{totalAmount.toLocaleString('ru-RU')} ₸</h1>
          </div>
          <div className="debt-history">
            <h3>История долгов:</h3>
            {debts.map((debt) => (
              <div key={debt.id} className="debt-card">
                <div className="debt-card-header">
                  <span className="debt-amount">{debt.amount.toLocaleString('ru-RU')} ₸</span>
                  <span className="debt-date">{new Date(debt.issuedAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="debt-card-body"><p>{debt.description}</p></div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}