import { useState, useEffect } from 'react';

const tg = window.Telegram.WebApp;

export default function UserView() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false); // Состояние для модального окна
  
  const user = tg.initDataUnsafe?.user;

  useEffect(() => {
    tg.BackButton.show();
    tg.onEvent('backButtonClicked', () => tg.close());

    // Проверяем, первый ли это визит
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowInfo(true); // Если нет, показываем инфо-окно
    }

    const initializeUser = async () => {
      if (!user?.id) {
        setError("Не удалось определить пользователя.");
        setLoading(false);
        return;
      }
      try {
        // Регистрируем юзера и передаем его имя
        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        await fetch('/api/registerUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, userName: userName }),
        });

        const response = await fetch(`/api/getDebts?userId=${user.id}`);
        if (!response.ok) throw new Error('Ошибка сети');
        const data = await response.json();
        setDebts(data.filter(d => d.status === 'UNPAID' && d.amount > 0));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    initializeUser();
  }, [user?.id]);

  const handleCloseInfo = () => {
    setShowInfo(false);
    localStorage.setItem('hasVisited', 'true'); // Запоминаем, что пользователь был здесь
  };

  if (loading) return <div className="loading-screen">Загрузка...</div>;
  if (error) return <div className="app-container">Ошибка: {error}</div>;

  const totalAmount = debts.reduce((sum, debt) => sum + debt.amount, 0);

  return (
    <>
      <div className="user-header">
        <h1>Мои долги</h1>
        <button className="info-icon" onClick={() => setShowInfo(true)}>i</button>
      </div>

      {debts.length === 0 ? (
        <div className="no-debts-card">
          <div className="party-popper">🎉</div>
          <h2>Долгов нет!</h2>
          <p>Можно расслабиться и выпить чаю.</p>
        </div>
      ) : (
        <>
          <div className="total-debt-card">
            <span>Общая сумма долга</span>
            <div className="total-amount">{totalAmount.toLocaleString('ru-RU')} ₸</div>
          </div>
          <div className="debt-list">
            {debts.map((debt) => (
              <div key={debt.id} className="debt-card">
                <div className="debt-card-main">
                  <div className="debt-description">{debt.description}</div>
                  <div className="debt-amount-item">{debt.amount.toLocaleString('ru-RU')} ₸</div>
                </div>
                <div className="debt-card-footer">
                  <span>{new Date(debt.issuedAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Информационное модальное окно */}
      {showInfo && (
        <div className="info-modal-backdrop">
          <div className="info-modal-content">
            <button className="close-btn" onClick={handleCloseInfo}>&times;</button>
            <h2>Что это за приложение?</h2>
            <p>Привет! Это личный помощник для учета моих долгов. Здесь ты можешь увидеть, сколько и за что ты мне должен.</p>
            <h3>Как погасить долг?</h3>
            <p>Ты можешь вернуть долг любым удобным способом:</p>
            <ul className="payment-methods">
              <li><b>Kaspi:</b> [Твой номер Kaspi]</li>
              <li><b>Halyk:</b> [Твой номер Halyk]</li>
              <li><b>Freedom:</b> [Твой номер Freedom]</li>
              <li><b>Наличными:</b> при встрече</li>
            </ul>
            <p>После того, как ты вернешь деньги, я отмечу долг как погашенный, и он исчезнет из этого списка.</p>
            <button className="understand-btn" onClick={handleCloseInfo}>Понятно</button>
          </div>
        </div>
      )}
    </>
  );
}