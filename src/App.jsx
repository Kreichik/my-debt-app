import './App.css';

// Получаем объект Telegram Web App
const tg = window.Telegram.WebApp;

function App() {
  // tg.initDataUnsafe?.user?.first_name — это данные пользователя, который открыл приложение.
  // Мы используем знаки '?' на случай, если приложение открыто не в Telegram, чтобы не было ошибки.
  const user = tg.initDataUnsafe?.user;

  return (
    <div>
      <h1>Привет, {user ? user.first_name : 'незнакомец'}!</h1>
      <p>Это твое первое мини-приложение в Telegram.</p>
    </div>
  );
}

export default App;