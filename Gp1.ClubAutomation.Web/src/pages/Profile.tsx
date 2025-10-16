import { useAuth } from "../auth/AuthContext";
export default function Profile(){
  const { user } = useAuth();
  return <div style={{padding:16}}>
    <h2>Profilim</h2>
    <pre>{JSON.stringify(user, null, 2)}</pre>
  </div>;
}
