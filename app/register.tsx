import { useRouter } from 'expo-router';
import Register from '../src/screens/Register';

export default function RegisterPage() {
  const router = useRouter();
  return (
    <Register
      onSuccess={() => {
        router.push('/dashboard');
      }}
    />
  );
}
