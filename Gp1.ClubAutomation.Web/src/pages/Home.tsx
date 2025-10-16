import { useAuth } from "../auth/AuthContext";
export default function Home(){
  const { user } = useAuth();
  return <div style={{padding:16}}>
    <h2>Hoş geldin, {user?.name} 👋</h2>
    <p> Home / Profilim / Kulüpler / Etkinlikler / Sertifikalar.</p>
  </div>;
}
