import { useRouter } from 'expo-router';
import Logout from '../src/screens/Logout';

export default function LogoutPage() {
  const router = useRouter();
  return (
    <Logout
      onDone={() => {
        router.replace('/login');
      }}
    />
  );
}
