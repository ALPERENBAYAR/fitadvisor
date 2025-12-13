import { useRouter } from 'expo-router';
import Login from '../src/screens/Login';

export default function LoginPage() {
  const router = useRouter();
  
  return (
    <Login 
      onLoginSuccess={() => router.push('/dashboard')}
    />
  );
}
