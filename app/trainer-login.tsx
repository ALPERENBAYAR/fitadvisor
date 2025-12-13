import { useRouter } from 'expo-router';
import TrainerLogin from '../src/screens/TrainerLogin';

export default function TrainerLoginPage() {
  const router = useRouter();
  return (
    <TrainerLogin
      onSuccess={() => {
        router.push('/trainer-dashboard');
      }}
      onGoRegister={() => router.push('/trainer-register')}
    />
  );
}
