import './App.css';
import AdminPanel from './AdminPanel'; // Импортируем наш новый компонент
import UserView from './UserView'; // Мы вынесем вью пользователя в отдельный компонент

const tg = window.Telegram.WebApp;
const ADMIN_ID = 918550382;

function App() {
  const user = tg.initDataUnsafe?.user;
  const isOwner = user?.id === ADMIN_ID;

  return (
    <div className="app-container">
      {isOwner ? <AdminPanel /> : <UserView />}
    </div>
  );
}

export default App;