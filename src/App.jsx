import { useState, useEffect } from 'react';
import './App.css';

const tg = window.Telegram.WebApp;

function App() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Новые состояния для полей формы
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    tg.BackButton.show();
    tg.onEvent('backButtonClicked', () => tg.close());

    const fetchDebts = async () => {
      const userId = tg.initDataUnsafe?.user?.id;
      if (!userId) {
        setError("Не удалось определить пользователя Telegram.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/getDebts?userId=${userId}`);
        if (!response.ok) throw new Error('Ошибка сети или сервера');
        const data = await response.json();
        setDebts(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDebts();
  }, []);

  // --- НОВАЯ ФУНКЦИЯ ДЛЯ ДОБАВЛЕНИЯ ДОЛГА ---
  const handleAddDebt = async (e) => {
    e.preventDefault(); // Предотвращаем стандартную перезагрузку страницы при отправке формы

    if (!newAmount || !newDescription || isSubmitting) {
      return; // Не отправлять, если поля пустые или уже идет отправка
    }

    setIsSubmitting(true);
    const userId = tg.initDataUnsafe?.user?.id;

    try {
      const response = await fetch('/api/addDebt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          amount: parseFloat(newAmount),
          description: newDescription,
        }),
      });

      if (!response.ok) throw new Error('Не удалось добавить долг');

      const newDebt = await response.json();

      // Оптимистичное обновление: добавляем новый долг в начало списка
      // без повторного запроса всех данных с сервера.
      setDebts([newDebt, ...debts]);

      // Очищаем поля формы
      setNewAmount('');
      setNewDescription('');

    } catch (error) {
      // Здесь можно показать пользователю уведомление об ошибке
      console.error(error);
      alert('Произошла ошибка при добавлении долга.');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading) return <div className="app-container">Загрузка...</div>;
  if (error) return <div className="app-container">Ошибка: {error}</div>;
  
  const totalAmount = debts.reduce((sum, debt) => sum + debt.amount, 0);

  return (
    <div className="app-container">
      {/* --- НОВАЯ ФОРМА --- */}
      <form onSubmit={handleAddDebt} className="add-debt-form">
        <h3>Добавить новый долг</h3>
        <div className="form-group">
          <input
            type="number"
            placeholder="Сумма"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Описание (на что?)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Добавление...' : 'Добавить'}
        </button>
      </form>
      
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