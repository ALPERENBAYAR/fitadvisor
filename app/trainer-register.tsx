import { useRouter } from 'expo-router';
import TrainerRegister from '../src/screens/TrainerRegister';

export default function TrainerRegisterPage() {
  const router = useRouter();
  return (
    <TrainerRegister
      onSuccess={() => {
        router.push('/trainer-dashboard');
      }}
      onGoLogin={() => router.push('/trainer-login')}
    />
  );
}
