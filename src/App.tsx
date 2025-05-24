import './App.css'
import { useAuth } from './Context/AuthContext/useAuth'
import signInWithGoogle from './firebase/signInWithGoogle';
import Button from './components/Button';
import { useEffect } from 'react';
import signout from './firebase/signOut';
import Nvelopes from './components/Nvelopes';

function App() {
  const { user } = useAuth();

  useEffect(() => {
    console.log('WTF MAN! :', user);
  }, [user]);
  
  return (
    <div className="flex flex-col items-center h-full gap-4 py-4">
      <Button
        color={user ? 'red' : 'green'}
        onClick={user ? signout : signInWithGoogle}
        text={user ? "Sign Out" : "Sign In with Google"}
      />
      <div className="p-4 rounded w-[80%] text-center">
        {user ? (
          <p>Hello {user.displayName}</p>
        ) : (
          <p>Not logged in</p>
        )}
      </div>
      {user && <Nvelopes />}
    </div>
  )
}

export default App
