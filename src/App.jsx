import { useState, useEffect } from 'react';
import './App.css';

// Получаем объект Telegram Web App
const tg = window.Telegram.WebApp;

function App() {
  const [debts, setDebts] = useState([]); // Состояние для хранения списка долгов
  const [loading, setLoading] = useState(true); // Состояние для отслеживания загрузки
  const [error, setError] = useState(null); // Состояние для хранения ошибки

  // useEffect будет выполняться один раз после того, как компонент отобразится
  useEffect(() => {
    // Включаем кнопку "назад" в интерфейсе Telegram, чтобы можно было закрыть аппку
    tg.BackButton.show();
    tg.onEvent('backButtonClicked', () => tg.close());

    const fetchDebts = async () => {
      // Получаем ID пользователя из данных Telegram
      const userId = tg.initDataUnsafe?.user?.id;

      if (!userId) {
        setError("Не удалось определить пользователя Telegram.");
        setLoading(false);
        return;
      }

      try {
        // Делаем запрос к нашему API.
        // Используем относительный путь, Vercel сам поймет, куда направить запрос.
        const response = await fetch(`/api/getDebts?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Ошибка сети или сервера');
        }
        const data = await response.json();
        setDebts(data); // Сохраняем полученные данные в состояние
      } catch (e) {
        setError(e.message); // В случае ошибки, сохраняем ее
      } finally {
        setLoading(false); // В любом случае убираем индикатор загрузки
      }
    };

    fetchDebts();
  }, []); // Пустой массив [] означает, что эффект выполнится только один раз

  // --- Ниже идет логика отображения в зависимости от состояний ---

  if (loading) {
    return <div className="app-container">Загрузка...</div>;
  }

  if (error) {
    return <div className="app-container">Ошибка: {error}</div>;
  }
  
  const totalAmount = debts.reduce((sum, debt) => sum + debt.amount, 0);

  return (
    <div className="app-container">
      {debts.length === 0 ? (
        <div className="no-debts">
          <h2>Ты ничего не должен! 🎉</h2>
          <p>Можно спать спокойно.</p>
        </div>
      ) : (
        <>
          <div className="total-debt">
            <span>Общий долг:</span>
            <h1>{totalAmount.toFixed(2)} ₽</h1>
          </div>
          <div className="debt-history">
            <h3>История:</h3>
            {debts.map((debt) => (
              <div key={debt.id} className="debt-item">
                <div className="debt-info">
                  <span className="debt-description">{debt.description}</span>
                  <span className="debt-date">
                    {new Date(debt.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="debt-amount">{debt.amount.toFixed(2)} ₽</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;