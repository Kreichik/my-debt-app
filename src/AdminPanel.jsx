// src/AdminPanel.jsx
import { useState, useEffect } from 'react';

const tg = window.Telegram.WebApp;

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [customUserId, setCustomUserId] = useState('');
  
  const [userDebts, setUserDebts] = useState([]);
  const [loadingDebts, setLoadingDebts] = useState(false);

  // Состояния для форм
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().split('T')[0]); // Сегодняшняя дата в формате YYYY-MM-DD
  const [paymentAmount, setPaymentAmount] = useState('');

  // Загружаем список пользователей один раз при загрузке
  useEffect(() => {
    fetch('/api/admin/getUsers')
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  // Функция для загрузки долгов выбранного пользователя
  const fetchUserDebts = async (userId) => {
    if (!userId) return;
    setLoadingDebts(true);
    setSelectedUserId(userId);
    const res = await fetch(`/api/admin/getDebtsForUser?userId=${userId}`);
    const data = await res.json();
    setUserDebts(data);
    setLoadingDebts(false);
  };

  const handleUserSelect = (e) => {
    const userId = e.target.value;
    setCustomUserId('');
    fetchUserDebts(userId);
  };

  const handleCustomUserSubmit = (e) => {
    e.preventDefault();
    if (!customUserId) return;
    setSelectedUserId(customUserId);
    fetchUserDebts(customUserId);
  };
  
  // Общая функция для отправки запросов на управление
  const manageDebt = async (action, payload) => {
    await fetch('/api/admin/manageDebt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminId: tg.initDataUnsafe?.user?.id,
        action,
        payload,
      }),
    });
    // После любой операции обновляем список долгов
    fetchUserDebts(selectedUserId);
  };
  
  const handleAddDebt = (e) => {
    e.preventDefault();
    manageDebt('ADD_DEBT', { targetUserId: selectedUserId, amount, description, issuedAt });
    setAmount('');
    setDescription('');
  };
  
  const handleMarkAsPaid = (debtId) => {
    manageDebt('MARK_AS_PAID', { debtId });
  };
  
  const handlePartialPayment = (e) => {
    e.preventDefault();
    manageDebt('PARTIAL_PAYMENT', { targetUserId: selectedUserId, paymentAmount });
    setPaymentAmount('');
  };

  return (
    <div className="admin-panel">
      <h2>Панель администратора</h2>

      {/* --- Блок выбора пользователя --- */}
      <div className="user-selection-box">
        <h4>Выберите пользователя</h4>
        <select onChange={handleUserSelect} value={selectedUserId}>
          <option value="">-- Из существующих --</option>
          {users.map(id => <option key={id} value={id}>User ID: {id}</option>)}
        </select>
        <p>или</p>
        <form onSubmit={handleCustomUserSubmit}>
          <input 
            type="number" 
            placeholder="Введите ID вручную" 
            value={customUserId}
            onChange={(e) => setCustomUserId(e.target.value)}
          />
          <button type="submit">Найти</button>
        </form>
      </div>

      {/* --- Блок управления долгами (появляется после выбора пользователя) --- */}
      {selectedUserId && (
        <div className="debt-management">
          <h3>Управление долгами для User ID: {selectedUserId}</h3>
          {loadingDebts ? <p>Загрузка...</p> : (
            <>
              {/* Форма добавления долга */}
              <form className="admin-form" onSubmit={handleAddDebt}>
                <h4>Добавить долг</h4>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Сумма (₸)" required />
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание" required />
                <input type="date" value={issuedAt} onChange={e => setIssuedAt(e.target.value)} required />
                <button type="submit">Добавить</button>
              </form>

              {/* Форма частичного погашения */}
              <form className="admin-form" onSubmit={handlePartialPayment}>
                <h4>Погасить сумму</h4>
                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Сумма погашения (₸)" required />
                <button type="submit">Погасить</button>
              </form>

              {/* Список долгов пользователя */}
              <div className="debt-list">
                <h4>Текущие долги</h4>
                {userDebts.filter(d => d.status === 'UNPAID').length === 0 && <p>Непогашенных долгов нет.</p>}
                {userDebts.filter(d => d.status === 'UNPAID' && d.amount > 0).map(debt => (

                  <div key={debt.id} className="debt-card admin-debt-card">
                    <div className="debt-card-header">
                      <span className="debt-amount">{debt.amount.toLocaleString('ru-RU')} ₸</span>
                      <span className="debt-date">{new Date(debt.issuedAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="debt-card-body"><p>{debt.description}</p></div>
                    <button className="pay-off-btn" onClick={() => handleMarkAsPaid(debt.id)}>Погасить полностью</button>
                  </div>
                ))}

                <h4>Погашенные долги</h4>
                 {userDebts.filter(d => d.status === 'PAID').map(debt => (
                  <div key={debt.id} className="debt-card admin-debt-card paid">
                    {/* ... отображение погашенных долгов ... */}
                     <p>{debt.description} - {debt.amount.toLocaleString('ru-RU')} ₸ (Погашен)</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}