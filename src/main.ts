import './styles/global.css';
import { supabase } from './lib/supabase';

async function testSupabase() {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (!app) return;

  try {
    const { error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    app.innerHTML = `
      <main>
        <h1>EduChess Academy OS</h1>
        <p>Supabase connection: ✅ Connected</p>
        <p>System foundation is ready.</p>
      </main>
    `;
  } catch (error) {
    console.error(error);

    app.innerHTML = `
      <main>
        <h1>EduChess Academy OS</h1>
        <p>Supabase connection: ❌ Failed</p>
        <p>Please check the Supabase configuration.</p>
      </main>
    `;
  }
}

testSupabase();
