import { NavLink, Outlet } from 'react-router-dom';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div className={styles.layout}>
      <nav className={styles.layout__nav}>
        <div className={styles.layout__navContainer}>
          <NavLink
            to="/rooms"
            style={{textDecoration: 'none'}}
          >
            <div className={styles.layout__logo}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="#0D9488" />
                <path
                  d="M15 7.5V10.5M21 7.5V10.5M11.25 15H24.75M15.75 19.5L17.25 21L20.25 18M12.75 10.5H23.25C24.0784 10.5 24.75 11.1716 24.75 12V22.5C24.75 23.3284 24.0784 24 23.25 24H12.75C11.9216 24 11.25 23.3284 11.25 22.5V12C11.25 11.1716 11.9216 10.5 12.75 10.5Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className={styles.layout__brand}>BookRoom</span>
            </div>
          </NavLink>

          <div className={styles.layout__links}>
            <NavLink
              to="/rooms"
              className={({ isActive }) =>
                `${styles.layout__link} ${isActive ? styles.layout__link_active : ''}`
              }
            >
              Переговорные
            </NavLink>
            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `${styles.layout__link} ${isActive ? styles.layout__link_active : ''}`
              }
            >
              Мои бронирования
            </NavLink>
          </div>

          <div className={styles.layout__profile}>
            <div className={styles.layout__avatar}>
              <span className={styles.layout__userName}>Попехин Н.</span>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#5478D9" />
                <path
                  d="M17.48 25L14.13 20.5504H13.22V25H11.38V14.8182H13.22V19.0043H13.69L17.31 14.8182H19.58L15.56 19.4616L19.75 25H17.48ZM27.1 25L23.75 20.5504H22.85V25H21V14.8182H22.85V19.0043H23.31L26.93 14.8182H29.2L25.18 19.4616L29.38 25H27.1Z"
                  fill="white"
                />
              </svg>
            </div>
          </div>
        </div>
      </nav>
      <main className={styles.layout__main}>
        <Outlet />
      </main>
    </div>
  );
}
