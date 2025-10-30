import { useState, useEffect } from 'react';

const tg = window.Telegram.WebApp;

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [customUserId, setCustomUserId] = useState('');
  
  const [userDebts, setUserDebts] = useState([]);
  const [loadingDebts, setLoadingDebts] = useState(false);
  const [totalUserDebt, setTotalUserDebt] = useState(0);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetch('/api/admin/getUsers')
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);
  
  // Пересчитываем общую сумму долга при изменении списка
  useEffect(() => {
      const total = userDebts
          .filter(d => d.status === 'UNPAID')
          .reduce((sum, debt) => sum + debt.amount, 0);
      setTotalUserDebt(total);
  }, [userDebts]);


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
    fetchUserDebts(customUserId);
  };
  
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
    fetchUserDebts(selectedUserId); // Обновляем
  };
  
  // ... (остальные хендлеры handleAddDebt, handleMarkAsPaid, handlePartialPayment оставляем без изменений)
  const handleAddDebt = (e) => { e.preventDefault(); manageDebt('ADD_DEBT', { targetUserId: selectedUserId, amount, description, issuedAt }); setAmount(''); setDescription(''); };
  const handleMarkAsPaid = (debtId) => { manageDebt('MARK_AS_PAID', { debtId }); };
  const handlePartialPayment = (e) => { e.preventDefault(); manageDebt('PARTIAL_PAYMENT', { targetUserId: selectedUserId, paymentAmount }); setPaymentAmount(''); };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Панель управления</h2>
      </div>

      <div className="admin-section">
        <h4>1. Выберите пользователя</h4>
        <select onChange={handleUserSelect} value={selectedUserId}>
          <option value="">-- Из списка --</option>
          {users.map(user => <option key={user.id} value={user.id}>{user.name} ({user.id})</option>)}
        </select>
        <form onSubmit={handleCustomUserSubmit} className="custom-user-form">
          <input type="number" placeholder="или введите ID вручную" value={customUserId} onChange={(e) => setCustomUserId(e.target.value)} />
          <button type="submit">Найти</button>
        </form>
      </div>

      {selectedUserId && (
        <div className="debt-management">
          {loadingDebts ? <p>Загрузка...</p> : (
            <>
              <div className="admin-summary-card">
                <span>Общий долг пользователя:</span>
                <div className="total-amount">{totalUserDebt.toLocaleString('ru-RU')} ₸</div>
              </div>
              
              <div className="admin-section">
                <h4>2. Операции с долгами</h4>
                <form className="admin-form" onSubmit={handleAddDebt}>
                  <h5>Добавить долг</h5>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Сумма (₸)" required />
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание" required />
                  <input type="date" value={issuedAt} onChange={e => setIssuedAt(e.target.value)} required />
                  <button type="submit">Добавить</button>
                </form>

                <form className="admin-form" onSubmit={handlePartialPayment}>
                  <h5>Погасить сумму</h5>
                  <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Сумма погашения (₸)" required />
                  <button type="submit" className="repay-btn">Погасить</button>
                </form>
              </div>

              <div className="admin-section">
                <h4>3. Список долгов</h4>
                <h5>Активные</h5>
                <div className="debt-list">
                  {userDebts.filter(d => d.status === 'UNPAID' && d.amount > 0).length === 0 && <p>Непогашенных долгов нет.</p>}
                  {userDebts.filter(d => d.status === 'UNPAID' && d.amount > 0).map(debt => (
                    <div key={debt.id} className="debt-card admin-debt-card">
                       {/* ... */}
                       <p><b>{debt.description}</b> - {debt.amount.toLocaleString('ru-RU')} ₸ от {new Date(debt.issuedAt).toLocaleDateString('ru-RU')}</p>
                       <button className="pay-off-btn" onClick={() => handleMarkAsPaid(debt.id)}>Погасить полностью</button>
                    </div>
                  ))}
                </div>
                <h5>Погашенные</h5>
                 <div className="debt-list">
                    {userDebts.filter(d => d.status === 'PAID' && d.amount > 0).map(debt => (
                        <div key={debt.id} className="debt-card admin-debt-card paid">
                             <p><b>{debt.description}</b> - {debt.amount.toLocaleString('ru-RU')} ₸ (Погашен)</p>
                        </div>
                    ))}
                 </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}