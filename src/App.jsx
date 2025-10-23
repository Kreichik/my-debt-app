import { useState, useEffect } from 'react';
import './App.css';

const tg = window.Telegram.WebApp;
const ADMIN_ID = 918550382; // Твой ID

function App() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const user = tg.initDataUnsafe?.user;
  const isOwner = user?.id === ADMIN_ID; // Проверяем, являешься ли ты владельцем

  useEffect(() => {
    tg.BackButton.show();
    tg.onEvent('backButtonClicked', () => tg.close());

    const fetchDebts = async () => {
      // Важно: теперь мы добавляем к запросу id пользователя, для которого смотрим долги.
      // Если это ты, то ты смотришь сам на себя. Если другой - то на него.
      const targetUserId = user?.id;
      if (!targetUserId) {
        setError("Не удалось определить пользователя Telegram.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/getDebts?userId=${targetUserId}`);
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
  }, [user?.id]); // Добавляем user.id в зависимости, чтобы useEffect перезапустился если вдруг юзер сменится

  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!newAmount || !newDescription || isSubmitting) return;

    setIsSubmitting(true);
    
    // ВАЖНО: Мы отправляем `initData` на бэкенд для проверки!
    try {
      const response = await fetch('/api/addDebt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id, // Добавляем долг текущему пользователю
          amount: parseFloat(newAmount),
          description: newDescription,
          initData: tg.initData, // Отправляем данные для валидации на бэкенде
        }),
      });
      if (!response.ok) throw new Error('Не удалось добавить долг');
      const newDebt = await response.json();
      setDebts([newDebt, ...debts]);
      setNewAmount('');
      setNewDescription('');
    } catch (error) {
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
      {/* Форма видна только если isOwner === true */}
      {isOwner && (
        <form onSubmit={handleAddDebt} className="add-debt-form">
          <h3>Добавить новый долг</h3>
          <div className="form-group">
            <input type="number" placeholder="Сумма" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} required />
            <input type="text" placeholder="Описание" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required />
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Добавление...' : 'Добавить'}
          </button>
        </form>
      )}

      {debts.length === 0 ? (
        <div className="no-debts">
          <h2>Долгов нет! 🎉</h2>
          <p>Все чисто.</p>
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
                  <span className="debt-date">
                    {new Date(debt.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="debt-card-body">
                  <p>{debt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;